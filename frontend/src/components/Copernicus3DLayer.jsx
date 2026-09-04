import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Spherical coordinates conversion
export function latLonToVector3(lat, lon, radius = 2.53) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Check if coordinate falls within Indian mainland to avoid rendering ocean dots on dry land
function isIndianLand(lat, lon) {
  if (lat >= 8.2 && lat <= 23.0) {
    const westLimit = 73.2 + (lat - 8.2) * 0.35;
    const eastLimit = 79.8 + (lat - 8.2) * 0.55;
    if (lon >= westLimit && lon <= eastLimit) return true;
  }
  if (lat > 23.0 && lat < 30.0 && lon > 70.0 && lon < 89.0) return true;
  return false;
}

// Compute tangent surface vectors for current velocity (East & North)
function getTangentVectors(lat, lon) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const normal = new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta)
  ).normalize();

  const east = new THREE.Vector3(
    Math.sin(phi) * Math.sin(theta),
    0,
    Math.sin(phi) * Math.cos(theta)
  ).normalize();

  const north = new THREE.Vector3().crossVectors(east, normal).normalize();

  return { normal, east, north };
}

// Scientific color interpolation for ocean variables
function getScalarColor(val, variable = 'sst', colorScale = 'turbo') {
  let t = 0.5;

  if (variable === 'sst') {
    // SST range 25.0°C to 31.5°C in tropical Indian Ocean
    t = Math.max(0, Math.min(1, (val - 25.0) / 6.5));
  } else if (variable === 'salinity') {
    // Salinity range 32.0 to 36.8 PSU
    t = Math.max(0, Math.min(1, (val - 32.0) / 4.8));
  } else {
    // Current speed 0.05 to 0.75 m/s
    t = Math.max(0, Math.min(1, (val - 0.05) / 0.70));
  }

  const c = new THREE.Color();

  if (colorScale === 'thermal') {
    if (t < 0.33) {
      c.setRGB(0.1 + t * 1.5, 0.05, 0.4 + t * 1.2);
    } else if (t < 0.66) {
      const u = (t - 0.33) / 0.33;
      c.setRGB(0.6 + u * 0.35, 0.1 + u * 0.4, 0.4 - u * 0.3);
    } else {
      const u = (t - 0.66) / 0.34;
      c.setRGB(0.95 + u * 0.05, 0.5 + u * 0.45, 0.1);
    }
  } else if (colorScale === 'viridis') {
    c.setHSL(0.8 - t * 0.65, 0.85, 0.25 + t * 0.45);
  } else {
    // Turbo Multi-hue: Ocean Blue -> Teal -> Green -> Yellow -> Orange/Crimson
    if (t < 0.25) {
      const u = t / 0.25;
      c.setRGB(0.05, 0.35 + u * 0.45, 0.85 + u * 0.15);
    } else if (t < 0.5) {
      const u = (t - 0.25) / 0.25;
      c.setRGB(0.05 + u * 0.25, 0.82, 0.85 - u * 0.35);
    } else if (t < 0.75) {
      const u = (t - 0.5) / 0.25;
      c.setRGB(0.35 + u * 0.6, 0.85 - u * 0.2, 0.1);
    } else {
      const u = (t - 0.75) / 0.25;
      c.setRGB(0.95, 0.60 - u * 0.4, 0.1);
    }
  }

  return c;
}

export default function Copernicus3DLayer({
  gridPoints = [],
  primaryVariable = 'sst',
  colorScale = 'turbo',
  opacity = 0.85,
  showCurrents = true,
  visible = true,
  selectedDepth = 0,
  onSelectPoint,
  onHoverPoint
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const flowVectorsRef = useRef();

  // Filter grid points: only ocean water (exclude land), matching depth
  const activePoints = useMemo(() => {
    if (!gridPoints || gridPoints.length === 0) return [];
    
    // Filter out points that are on land or invalid
    const oceanOnly = gridPoints.filter(p => {
      const lat = p.latitude ?? p.lat;
      const lon = p.longitude ?? p.lon;
      if (lat === undefined || lon === undefined) return false;
      if (isIndianLand(lat, lon)) return false;
      if (p.temperature <= 0 || p.salinity <= 0) return false;
      return true;
    });

    if (selectedDepth > 0) {
      const depths = [...new Set(oceanOnly.map(p => p.depth))];
      const closest = depths.reduce((prev, curr) =>
        Math.abs(curr - selectedDepth) < Math.abs(prev - selectedDepth) ? curr : prev, depths[0]
      );
      return oceanOnly.filter(p => Math.abs(p.depth - closest) < 0.3);
    }

    // Default surface layer (depth <= 2.0m)
    const surface = oceanOnly.filter(p => p.depth <= 2.0);
    return surface.length > 0 ? surface : oceanOnly.slice(0, 500);
  }, [gridPoints, selectedDepth]);

  // Compute 3D positions and colors
  const { positions, colors, pointData } = useMemo(() => {
    const posArr = [];
    const colArr = [];
    const metaArr = [];

    activePoints.forEach((pt) => {
      const lat = pt.latitude ?? pt.lat;
      const lon = pt.longitude ?? pt.lon;
      if (lat === undefined || lon === undefined) return;

      const vec = latLonToVector3(lat, lon, 2.536);

      let scalarVal = pt.temperature;
      if (primaryVariable === 'salinity') scalarVal = pt.salinity;
      if (primaryVariable === 'currents') scalarVal = pt.current_speed;

      const col = getScalarColor(scalarVal, primaryVariable, colorScale);

      posArr.push(vec);
      colArr.push(col);
      metaArr.push(pt);
    });

    return { positions: posArr, colors: colArr, pointData: metaArr };
  }, [activePoints, primaryVariable, colorScale]);

  // 3D Velocity Vector Lines
  const currentLines = useMemo(() => {
    if (!showCurrents || activePoints.length === 0) return [];

    const lines = [];
    activePoints.forEach((pt, idx) => {
      if (idx % 2 !== 0) return; // subsample for clarity

      const lat = pt.latitude ?? pt.lat;
      const lon = pt.longitude ?? pt.lon;
      const u = pt.u_current || 0;
      const v = pt.v_current || 0;
      const speed = pt.current_speed || Math.sqrt(u * u + v * v);

      if (speed < 0.05) return;

      const origin = latLonToVector3(lat, lon, 2.538);
      const { east, north } = getTangentVectors(lat, lon);

      const flowDir = new THREE.Vector3()
        .addScaledVector(east, u)
        .addScaledVector(north, v)
        .normalize();

      const length = Math.min(0.08, Math.max(0.02, speed * 0.10));
      const target = origin.clone().addScaledVector(flowDir, length);

      const geom = new THREE.BufferGeometry().setFromPoints([origin, target]);

      lines.push({
        geom,
        speed,
        color: speed > 0.35 ? '#fbbf24' : '#38bdf8'
      });
    });

    return lines;
  }, [activePoints, showCurrents]);

  if (!visible || positions.length === 0) return null;

  return (
    <group>
      {/* 1. Real Copernicus Data Grid Points (Hoverable & Clickable) */}
      {positions.map((pos, idx) => {
        const pt = pointData[idx];
        const col = colors[idx];
        const isHovered = hoveredPoint && hoveredPoint.idx === idx;

        return (
          <group key={`copernicus-pt-${idx}`} position={pos}>
            <mesh
              scale={isHovered ? [2.4, 2.4, 2.4] : [1, 1, 1]}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectPoint) {
                  onSelectPoint({
                    ...pt,
                    name: `Copernicus Grid (${(pt.latitude ?? pt.lat).toFixed(2)}°N, ${(pt.longitude ?? pt.lon).toFixed(2)}°E)`,
                    region: (pt.longitude ?? pt.lon) < 76 ? 'Arabian Sea' : 'Bay of Bengal',
                    type: 'Copernicus Numerical Reanalysis Cell',
                    source: 'Copernicus Marine (CMEMS GLOPHY 0.083°)',
                    status: 'Active',
                    health: 'Physical Field Grid (0.083°)',
                    timestamp: '2026-09-03 12:00 UTC',
                    lat: pt.latitude ?? pt.lat,
                    lon: pt.longitude ?? pt.lon,
                    currentTemp: pt.temperature,
                    currentSalinity: pt.salinity,
                    currentSpeed: pt.current_speed,
                    currentWave: 1.8
                  });
                }
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredPoint({ idx, pt, pos });
                if (onHoverPoint) onHoverPoint(pt);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredPoint(null);
                if (onHoverPoint) onHoverPoint(null);
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.013, 8, 8]} />
              <meshStandardMaterial
                color={col}
                emissive={col}
                emissiveIntensity={isHovered ? 1.0 : 0.4}
                roughness={0.2}
                metalness={0.1}
                transparent
                opacity={Math.min(0.95, opacity * 1.05)}
              />
            </mesh>
          </group>
        );
      })}

      {/* 2. Real Ocean Current Flow Velocity Vectors */}
      {showCurrents && currentLines.length > 0 && (
        <group ref={flowVectorsRef}>
          {currentLines.map((line, lIdx) => (
            <line key={`vec-${lIdx}`} geometry={line.geom}>
              <lineBasicMaterial
                color={line.color}
                transparent
                opacity={0.75 * opacity}
              />
            </line>
          ))}
        </group>
      )}
    </group>
  );
}
