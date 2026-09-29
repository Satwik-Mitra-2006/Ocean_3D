import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Convert Lat/Lon to 3D Sphere coordinates
export function latLonToVector3(lat, lon, radius = 2.536) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Dedicated collision-proof spatial offsets for all 8 Indian Ocean stations (Orthogonal Compass Directions)
// Dedicated collision-proof spatial offsets for all 8 Indian Ocean stations
// [East(+) / West(-), North(+) / South(-)]
const STATION_LABEL_OFFSETS = {
  'AD02': [-0.08, 0.07],            // North-West Arabian Sea -> Top-Left
  'BD08': [0.07, 0.07],             // Central Arabian Sea -> Top-Right
  'CB01': [-0.11, -0.02],           // Lakshadweep -> Far West into Arabian Sea
  'GLIDER-NIOT-02': [0.10, 0.04],   // Coastal Karnataka/Goa -> Far East
  'station-08': [0.10, 0.04],
  'GL-02': [0.10, 0.04],
  'ARGO-1844': [0.00, -0.09],        // South Kerala Shelf -> Straight South
  'ARGO 2901844': [0.00, -0.09],
  'ARGO': [0.00, -0.09],
  'BD11': [0.00, 0.08],             // North Bay of Bengal -> North
  'GLIDER-INCOIS-01': [0.09, -0.03], // Central Bay of Bengal -> South-East
  'station-07': [0.09, -0.03],
  'GL-01': [0.09, -0.03],
  'TB05': [0.08, -0.01]             // Equatorial Jet -> East
};

export default function ObservationMarker({ 
  station, 
  isSelected, 
  onSelect,
  onHoverStation,
  onHoverEnd
}) {
  const [hovered, setHovered] = useState(false);
  const [isFacingCamera, setIsFacingCamera] = useState(true);
  const hoverTimerRef = useRef(null);

  const ringRef = useRef();
  const sonarRingRef = useRef();

  const lat = station.lat ?? station.latitude ?? 15.0;
  const lon = station.lon ?? station.longitude ?? 72.0;
  const markerPos = latLonToVector3(lat, lon, 2.538);

  const normal = markerPos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal
  );

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  // Frame animation: camera face culling and subtle anchor ring pulse
  useFrame(({ camera, clock }) => {
    const time = clock.getElapsedTime();

    // Mathematically test if station is on the camera-facing hemisphere
    const dirToCam = camera.position.clone().sub(markerPos).normalize();
    const dot = normal.dot(dirToCam);
    const facing = dot > -0.05; 
    if (facing !== isFacingCamera) {
      setIsFacingCamera(facing);
    }

    // Surface Anchor Pulse ring on ocean surface
    if (ringRef.current) {
      const s = 1.0 + Math.sin(time * 3.0) * 0.12;
      ringRef.current.scale.set(s, s, s);
    }

    // Active Sonar Radar Wave for Selected / Hovered Station
    if (sonarRingRef.current && (isSelected || hovered)) {
      const cycle = (time * 1.5) % 1.0;
      const sonarScale = 1.0 + cycle * 1.2;
      sonarRingRef.current.scale.set(sonarScale, sonarScale, sonarScale);
      if (sonarRingRef.current.material) {
        sonarRingRef.current.material.opacity = (1.0 - cycle) * 0.65;
      }
    }
  });

  // Display label formatting: Keep codes clean, compact & consistent (Zero Overlap)
  let rawCode = station.code || 'BD08';
  let displayCode = rawCode;
  if (rawCode.includes('GLIDER-NIOT') || rawCode === 'station-08') {
    displayCode = 'GL-02';
  } else if (rawCode.includes('GLIDER-INCOIS') || rawCode === 'station-07') {
    displayCode = 'GL-01';
  } else if (rawCode.includes('ARGO') || rawCode === 'station-03') {
    displayCode = 'ARGO';
  }

  const isArgo = rawCode.includes('ARGO') || rawCode === 'station-03';
  const isGlider = rawCode.includes('GLIDER') || rawCode === 'station-07' || rawCode === 'station-08';
  
  // Icon and Tag categorization
  const typeIcon = isGlider ? '🚀' : isArgo ? '🌊' : '⚓';
  const typeLabel = isGlider ? 'GLIDER' : isArgo ? 'ARGO' : 'BUOY';

  // High-contrast vibrant colors
  const accentColor = isSelected ? '#ffffff' : isGlider ? '#fbbf24' : isArgo ? '#c084fc' : '#38bdf8';
  const glowHex = isSelected ? '#818cf8' : isGlider ? '#f59e0b' : isArgo ? '#a855f7' : '#0284c7';

  // Smart collision-free offset: local X is East/West, local Z is North/South, local Y is Radial Height
  const labelOffset = STATION_LABEL_OFFSETS[station.code] || STATION_LABEL_OFFSETS[displayCode] || [0, 0.08];
  const finalBadgePosition = useMemo(() => [
    labelOffset[0],      // East / West
    0.11,                // Upward radial elevation above beacon tip (tip is at 0.10)
    labelOffset[1]       // North / South
  ], [labelOffset]);

  // High-Tech HUD Leader Line connecting ocean beacon tip to elevated micro-badge
  const lineGeometry = useMemo(() => {
    const points = [
      new THREE.Vector3(0, 0.10, 0),
      new THREE.Vector3(finalBadgePosition[0], finalBadgePosition[1], finalBadgePosition[2])
    ];
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [finalBadgePosition]);

  const handlePointerEnter = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    
    // Clear any existing timer
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    
    // 1.5 Second Hover Delay before updating left-side dynamic display & left top corner
    hoverTimerRef.current = setTimeout(() => {
      onHoverStation && onHoverStation(station);
    }, 1500);
  };

  const handlePointerLeave = (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = 'auto';
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    onHoverEnd && onHoverEnd();
  };

  return (
    <group position={markerPos} quaternion={quaternion}>
      {/* Raycasting Click / Hover Detection Sphere with 1.5s delayed hover */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect && onSelect(station);
        }}
        onPointerOver={handlePointerEnter}
        onPointerOut={handlePointerLeave}
      >
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Main Refined Marker Group */}
      <group scale={isSelected ? [1.18, 1.18, 1.18] : hovered ? [1.12, 1.12, 1.12] : [1, 1, 1]}>
        {/* 1. Surface Anchor Ring & Base Pad */}
        <mesh position={[0, 0.003, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.018, 24]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        <mesh ref={ringRef} position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.022, 0.042, 32]} />
          <meshBasicMaterial 
            color={accentColor} 
            transparent 
            opacity={isSelected ? 1.0 : 0.85} 
            side={THREE.DoubleSide} 
          />
        </mesh>

        {/* 2. Concentric Sonar Wave when Selected or Hovered */}
        {(isSelected || hovered) && (
          <mesh ref={sonarRingRef} position={[0, 0.008, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.035, 0.055, 32]} />
            <meshBasicMaterial 
              color={glowHex} 
              transparent 
              opacity={0.65} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {/* 3. Solid Glowing 3D Beacon Needle Stem (Lifts prominently above ocean topography) */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.004, 0.007, 0.10, 16]} />
          <meshStandardMaterial 
            color={accentColor} 
            metalness={0.7} 
            roughness={0.15} 
            emissive={accentColor} 
            emissiveIntensity={isSelected ? 1.0 : 0.65} 
          />
        </mesh>

        {/* 4. Glowing Beacon Sensor Bead at Pin Tip */}
        <mesh position={[0, 0.10, 0]}>
          <sphereGeometry args={[isSelected ? 0.026 : 0.020, 20, 20]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive={accentColor} 
            emissiveIntensity={isSelected ? 1.5 : 1.1} 
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* 5. Vivid Glowing Laser Leader Line connecting Needle to Floating Micro-Badge */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial 
          color={accentColor} 
          transparent 
          opacity={isSelected ? 0.95 : 0.70} 
          depthWrite={false} 
        />
      </line>

      {/* 6. Crystal-Clear High-Contrast Command Badge (Zero Overlap & Bold Readability) */}
      {isFacingCamera && (
        <Html
          position={finalBadgePosition}
          center
          zIndexRange={isSelected ? [100, 0] : [50, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(station);
            }}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            className={`flex items-center gap-1.5 rounded-full font-mono font-bold tracking-tight whitespace-nowrap cursor-pointer select-none transition-all shadow-lg backdrop-blur-md ${
              isSelected
                ? 'bg-indigo-950 text-white ring-2 ring-white border border-indigo-300 shadow-xl shadow-indigo-500/70 text-[11px] px-3 py-1 scale-110'
                : hovered
                  ? 'bg-slate-950 text-white ring-1.5 ring-cyan-300 border border-cyan-400 shadow-cyan-500/60 text-[11px] px-2.5 py-0.5 scale-105'
                  : isGlider
                    ? 'bg-slate-950/95 text-amber-100 border-[1.5px] border-amber-400/90 shadow-md shadow-amber-500/30 text-[10.5px] px-2.5 py-0.5'
                    : isArgo
                      ? 'bg-slate-950/95 text-purple-100 border-[1.5px] border-purple-400/90 shadow-md shadow-purple-500/30 text-[10.5px] px-2.5 py-0.5'
                      : 'bg-slate-950/95 text-cyan-100 border-[1.5px] border-cyan-400/90 shadow-md shadow-cyan-500/30 text-[10.5px] px-2.5 py-0.5'
            }`}
          >
            {/* Sensor Type Icon */}
            <span className="text-[11px] leading-none">{typeIcon}</span>

            {/* Station Code */}
            <span className="font-extrabold text-white text-[11px] tracking-wide">
              {displayCode}
            </span>

            {/* Micro Sensor Tag */}
            <span className={`text-[7.5px] font-sans font-bold uppercase tracking-wider px-1 py-0.2 rounded ${
              isGlider 
                ? 'bg-amber-500/25 text-amber-300' 
                : isArgo 
                  ? 'bg-purple-500/25 text-purple-300' 
                  : 'bg-cyan-500/25 text-cyan-300'
            }`}>
              {typeLabel}
            </span>

            {/* Active Telemetry Pulse Dot */}
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSelected 
                ? 'bg-white animate-ping' 
                : isGlider 
                  ? 'bg-amber-400 animate-pulse' 
                  : isArgo 
                    ? 'bg-purple-400 animate-pulse' 
                    : 'bg-cyan-400 animate-pulse'
            }`} />
          </div>
        </Html>
      )}
    </group>
  );
}

