import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * OceanCrossSection — DATA-DRIVEN 3D Volumetric Ocean Cutaway Visualization
 * Clean, uncluttered 3D representation without floating HTML card collisions.
 */

// Color interpolation helpers
function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bv})`;
}

// Map a value to a color scale
function valueToColor(value, min, max, mode = 'temperature') {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  const clamped = Math.max(0, Math.min(1, t));

  const scales = {
    temperature: ['#030712', '#1e3a8a', '#0284c7', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444'],
    salinity: ['#1e1b4b', '#3730a3', '#0284c7', '#06b6d4', '#38bdf8', '#fbbf24', '#f97316'],
    density: ['#1e1b4b', '#4338ca', '#818cf8', '#c084fc', '#f43f5e'],
    currents: ['#0f172a', '#1e3a8a', '#0284c7', '#06b6d4', '#38bdf8', '#67e8f9']
  };

  const colors = scales[mode] || scales.temperature;
  const idx = clamped * (colors.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, colors.length - 1);
  const frac = idx - lo;
  return lerpColor(colors[lo], colors[hi], frac);
}

// Create canvas gradient texture from real data ranges
function createDataDrivenTexture(mode, dataRange) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#020b18';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { min, max } = dataRange;
  const steps = 64;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const value = max - t * (max - min);
    const color = valueToColor(value, min, max, mode);
    ctx.fillStyle = color;
    ctx.fillRect(0, (i / steps) * canvas.height, canvas.width, canvas.height / steps + 1);
  }

  // Subtle depth contour lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 9; i++) {
    const y = (i / 9) * canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(canvas);
}

// Create surface water texture with realistic ocean wave caustics
function createSurfaceWaterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(0.35, '#0369a1');
  grad.addColorStop(0.7, '#075985');
  grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Surface Current Circulation Gyres & Caustic Highlights
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  const drawSwirl = (cx, cy, r, startAngle, endAngle) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.stroke();
  };
  drawSwirl(220, 240, 110, 0, Math.PI * 1.6);
  drawSwirl(360, 160, 80, Math.PI * 0.5, Math.PI * 2.1);
  drawSwirl(320, 380, 65, Math.PI * 0.2, Math.PI * 1.8);

  // Coastal shelf turquoise glow
  const shelfGrad = ctx.createLinearGradient(0, 0, 180, 0);
  shelfGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
  shelfGrad.addColorStop(0.5, 'rgba(45, 212, 191, 0.4)');
  shelfGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = shelfGrad;
  ctx.fillRect(0, 0, 200, canvas.height);

  return new THREE.CanvasTexture(canvas);
}

// Realistic Procedural Coastal Mountain / Terrain Mesh
function CoastalMountains() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(3.6, 6.4, 36, 36);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const distFromCoast = Math.max(0, -x + 0.9);
      const noise = Math.sin(x * 3.2) * Math.cos(y * 2.8) * 0.3 +
                    Math.sin(x * 6.5 + y * 4.5) * 0.12;
      const height = distFromCoast > 0 ? (distFromCoast * 0.85 + noise * 0.5) : 0;
      pos.setZ(i, Math.max(0, height));
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[-2.4, 0.22, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
      {/* Solid Rocky Coastal Mass */}
      <mesh geometry={geom} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#334155" 
          roughness={0.88} 
          metalness={0.12} 
          flatShading 
        />
      </mesh>
    </group>
  );
}

// Realistic Seafloor Canyon
function SeafloorCanyon() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(6.4, 6.4, 32, 32);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const slope = Math.min(0, (x + 1.2) * -0.18);
      const rugged = Math.sin(x * 4.5) * Math.cos(y * 4.5) * 0.08;
      pos.setZ(i, slope + rugged);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geom} receiveShadow>
        <meshStandardMaterial 
          color="#1e293b" 
          roughness={0.92} 
          metalness={0.15} 
          flatShading 
        />
      </mesh>
    </group>
  );
}

// Real Data Point Cloud from Copernicus NetCDF
function DataPointCloud({ gridPoints, mode, selectedDepth, dataRange }) {
  const { positions, colors, count } = useMemo(() => {
    if (!gridPoints || gridPoints.length === 0) {
      return { positions: new Float32Array(0), colors: new Float32Array(0), count: 0 };
    }

    const depthTolerance = 1.2;
    const filteredPoints = gridPoints.filter(p => 
      Math.abs(p.depth - selectedDepth) < depthTolerance
    );

    const pts = filteredPoints.length > 0 ? filteredPoints : gridPoints;

    const latMin = Math.min(...pts.map(p => p.latitude));
    const latMax = Math.max(...pts.map(p => p.latitude));
    const lonMin = Math.min(...pts.map(p => p.longitude));
    const lonMax = Math.max(...pts.map(p => p.longitude));
    const latRange = latMax - latMin || 1;
    const lonRange = lonMax - lonMin || 1;

    const posArr = new Float32Array(pts.length * 3);
    const colArr = new Float32Array(pts.length * 3);
    const { min, max } = dataRange;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const x = ((p.longitude - lonMin) / lonRange - 0.5) * 5.4;
      const z = ((p.latitude - latMin) / latRange - 0.5) * 5.4;
      const depthFrac = (p.depth - 0.49) / (11.40 - 0.49 || 1);
      const y = -depthFrac * 1.35;

      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;

      let value;
      switch (mode) {
        case 'salinity':
          value = p.salinity ?? 35;
          break;
        case 'currents':
          value = p.current_speed ?? Math.sqrt((p.u_current || 0) ** 2 + (p.v_current || 0) ** 2);
          break;
        case 'density':
          const T = p.temperature ?? 28;
          const S = p.salinity ?? 35;
          value = 1000 + 0.8 * S - 0.0065 * (T - 4) * (T - 4);
          break;
        default:
          value = p.temperature ?? 28;
      }

      const colorStr = valueToColor(value, min, max, mode);
      const match = colorStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
      if (match) {
        colArr[i * 3] = parseInt(match[1]) / 255;
        colArr[i * 3 + 1] = parseInt(match[2]) / 255;
        colArr[i * 3 + 2] = parseInt(match[3]) / 255;
      } else {
        colArr[i * 3] = 0.1;
        colArr[i * 3 + 1] = 0.5;
        colArr[i * 3 + 2] = 0.8;
      }
    }

    return { positions: posArr, colors: colArr, count: pts.length };
  }, [gridPoints, mode, selectedDepth, dataRange]);

  if (count === 0) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.09} vertexColors transparent opacity={0.92} sizeAttenuation />
    </points>
  );
}

// Current flow vectors
function CurrentArrows({ gridPoints, selectedDepth }) {
  const arrows = useMemo(() => {
    if (!gridPoints || gridPoints.length === 0) return [];

    const depthTolerance = 1.2;
    const filtered = gridPoints.filter(p => Math.abs(p.depth - selectedDepth) < depthTolerance);
    const pts = filtered.length > 0 ? filtered : gridPoints;

    const step = Math.max(1, Math.floor(pts.length / 70));
    const result = [];

    const latMin = Math.min(...pts.map(p => p.latitude));
    const latMax = Math.max(...pts.map(p => p.latitude));
    const lonMin = Math.min(...pts.map(p => p.longitude));
    const lonMax = Math.max(...pts.map(p => p.longitude));
    const latRange = latMax - latMin || 1;
    const lonRange = lonMax - lonMin || 1;

    for (let i = 0; i < pts.length; i += step) {
      const p = pts[i];
      const u = p.u_current || 0;
      const v = p.v_current || 0;
      const speed = Math.sqrt(u * u + v * v);
      if (speed < 0.01) continue;

      const x = ((p.longitude - lonMin) / lonRange - 0.5) * 5.4;
      const z = ((p.latitude - latMin) / latRange - 0.5) * 5.4;
      const depthFrac = (p.depth - 0.49) / (11.40 - 0.49 || 1);
      const y = -depthFrac * 1.35 + 0.04;

      const angle = Math.atan2(v, u);
      const length = Math.min(speed * 2.2, 0.55);

      result.push({ x, y, z, angle, length, speed });
    }
    return result;
  }, [gridPoints, selectedDepth]);

  return (
    <group>
      {arrows.map((a, i) => (
        <group key={i} position={[a.x, a.y, a.z]} rotation={[0, -a.angle, 0]}>
          <mesh>
            <boxGeometry args={[a.length, 0.015, 0.015]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
          </mesh>
          <mesh position={[a.length / 2, 0, 0]}>
            <coneGeometry args={[0.03, 0.07, 4]} />
            <meshBasicMaterial color="#67e8f9" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function OceanCrossSection({
  mode = 'temperature',
  gridPoints = [],
  selectedDepth = 0.49,
  availableDepths = [],
  dataRange = null,
  selectedStation = null
}) {
  const waterRef = useRef();

  const computedRange = useMemo(() => {
    if (dataRange && dataRange.min !== undefined) return dataRange;
    return { min: 19.69, max: 35.49 };
  }, [dataRange]);

  const frontTexture = useMemo(() => createDataDrivenTexture(mode, computedRange), [mode, computedRange]);
  const surfaceTexture = useMemo(() => createSurfaceWaterTexture(), []);

  // Depth ruler from real available depths
  const depthRulerEntries = useMemo(() => {
    const depths = availableDepths && availableDepths.length > 0 
      ? availableDepths 
      : [0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40];
    
    const maxDepth = Math.max(...depths);
    const maxY = -1.45;
    
    return depths.map(d => ({
      label: `${d.toFixed(1)} m`,
      y: -(d / maxDepth) * Math.abs(maxY),
      value: d,
      isSelected: Math.abs(d - selectedDepth) < 0.4
    }));
  }, [availableDepths, selectedDepth]);

  // Gentle wave surface animation
  useFrame((state) => {
    if (waterRef.current) {
      const t = state.clock.getElapsedTime();
      waterRef.current.position.y = 0.05 + Math.sin(t * 1.5) * 0.01;
    }
  });

  const hasData = gridPoints && gridPoints.length > 0;

  return (
    <group position={[0, 0.4, 0]}>
      {/* 1. TOP SURFACE WATER PLANE */}
      <mesh ref={waterRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 6.4, 32, 32]} />
        <meshStandardMaterial
          map={surfaceTexture}
          roughness={0.15}
          metalness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* 2. VERTICAL CUTAWAY FRONT FACE */}
      <mesh position={[0, -0.7, 3.2]}>
        <planeGeometry args={[6.4, 1.55]} />
        <meshBasicMaterial map={frontTexture} side={THREE.DoubleSide} />
      </mesh>

      {/* 3. VERTICAL CUTAWAY RIGHT SIDE FACE */}
      <mesh position={[3.2, -0.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[6.4, 1.55]} />
        <meshBasicMaterial map={frontTexture} side={THREE.DoubleSide} />
      </mesh>

      {/* 4. BACK & LEFT WALLS */}
      <mesh position={[0, -0.7, -3.2]}>
        <planeGeometry args={[6.4, 1.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh position={[-3.2, -0.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6.4, 1.55]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* 5. COASTAL MOUNTAINS (Solid, realistic) */}
      <CoastalMountains />

      {/* 6. SEAFLOOR */}
      <SeafloorCanyon />

      {/* 7. REAL DATA POINT CLOUD */}
      {hasData && (
        <group position={[0, 0.05, 0]}>
          <DataPointCloud
            gridPoints={gridPoints}
            mode={mode}
            selectedDepth={selectedDepth}
            dataRange={computedRange}
          />
        </group>
      )}

      {/* 8. CURRENT ARROWS */}
      {mode === 'currents' && hasData && (
        <group position={[0, 0.05, 0]}>
          <CurrentArrows
            gridPoints={gridPoints}
            selectedDepth={selectedDepth}
          />
        </group>
      )}

      {/* 9. DEPTH RULER */}
      <group position={[3.25, 0, 3.22]}>
        {depthRulerEntries.map((d, idx) => (
          <group key={`depth-${idx}`} position={[0, d.y, 0]}>
            <mesh position={[-0.08, 0, 0]}>
              <boxGeometry args={[0.16, 0.012, 0.012]} />
              <meshBasicMaterial color={d.isSelected ? '#fbbf24' : '#94a3b8'} />
            </mesh>
            <Html position={[0.08, 0, 0]} style={{ pointerEvents: 'none' }}>
              <span className={`text-[9px] font-mono whitespace-nowrap px-1 py-0.5 rounded ${
                d.isSelected
                  ? 'bg-amber-500/90 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-950/80 text-slate-300 border border-white/10'
              }`}>
                {d.label}
              </span>
            </Html>
          </group>
        ))}

        <mesh position={[-0.16, depthRulerEntries.length > 0 ? depthRulerEntries[depthRulerEntries.length - 1].y / 2 : -0.75, 0]}>
          <boxGeometry args={[0.006, Math.abs(depthRulerEntries.length > 0 ? depthRulerEntries[depthRulerEntries.length - 1].y : 1.5), 0.006]} />
          <meshBasicMaterial color="#475569" />
        </mesh>
      </group>

      {/* 10. ACTIVE STATION BUOY & CTD SENSOR MOORING */}
      {selectedStation && (
        <group position={[0.4, 0.05, 0.4]}>
          {/* Floating Buoy Torus */}
          <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.06, 16, 24]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} emissive="#d97706" emissiveIntensity={0.5} />
          </mesh>
          {/* Beacon Mast */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Flashing Top Light */}
          <mesh position={[0, 0.38, 0]}>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
          {/* CTD Depth Sounding Cable through water column */}
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 1.36, 6]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
          </mesh>
          {/* CTD Probe Sensor Package */}
          <mesh position={[0, -1.36, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.12, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Station Badge Header */}
          <Html position={[0, 0.58, 0]} center style={{ pointerEvents: 'none' }}>
            <div className="bg-slate-950/95 text-sky-300 border border-sky-400/80 px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono whitespace-nowrap shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>📍 {selectedStation.code || selectedStation.name}</span>
              <span className="text-amber-400">({(selectedStation.baseSalinity ?? 35.2).toFixed(1)} PSU)</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
