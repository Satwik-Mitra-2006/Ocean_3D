import React, { useRef, useState } from 'react';
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

// Convert 3D Sphere vector back to Lat/Lon
export function vector3ToLatLon(vec) {
  const norm = vec.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, norm.y)));
  const lat = 90 - (phi * 180) / Math.PI;

  const theta = Math.atan2(norm.z, -norm.x);
  let lon = (theta * 180) / Math.PI - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;

  return {
    lat: +lat.toFixed(2),
    lon: +lon.toFixed(2)
  };
}

export default function ObservationMarker({ 
  station, 
  isSelected, 
  onSelect
}) {
  const [hovered, setHovered] = useState(false);
  const [isFacingCamera, setIsFacingCamera] = useState(true);

  const ringRef = useRef();
  const beaconRef = useRef();

  const lat = station.lat ?? station.latitude ?? 15.0;
  const lon = station.lon ?? station.longitude ?? 72.0;
  const markerPos = latLonToVector3(lat, lon, 2.538);

  const normal = markerPos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal
  );

  // Animate pulse rings and check if marker is facing the camera
  useFrame(({ camera, clock }) => {
    const time = clock.getElapsedTime();

    // Mathematically test if station is on the camera-facing hemisphere
    const dirToCam = camera.position.clone().sub(markerPos).normalize();
    const dot = normal.dot(dirToCam);
    const facing = dot > 0.08; 
    if (facing !== isFacingCamera) {
      setIsFacingCamera(facing);
    }

    // Pulse ring on ocean surface
    if (ringRef.current) {
      const s = 1 + (Math.sin(time * 3.2) * 0.25 + 0.25);
      ringRef.current.scale.set(s, s, s);
    }
  });

  // Display label matching reference mockup
  let displayCode = station.code;
  if (!displayCode || displayCode === 'ARGO-1844') {
    displayCode = 'ARGO 2901844';
  }

  const isArgo = displayCode.includes('ARGO');

  return (
    <group position={markerPos} quaternion={quaternion}>
      {/* Raycasting Click Sphere */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect && onSelect(station);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Pulsing Surface Anchor Ring */}
      <mesh ref={ringRef} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.035, 0.065, 24]} />
        <meshBasicMaterial 
          color={isSelected ? '#38bdf8' : '#0ea5e9'} 
          transparent 
          opacity={isSelected ? 0.95 : 0.7} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* 2. Small Physical Sensor Beacon Dot */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshBasicMaterial color={isSelected ? '#ffffff' : '#38bdf8'} />
      </mesh>

      {/* 3. Floating Sleek Badge (Render ONLY when marker faces camera) */}
      {isFacingCamera && (
        <Html
          position={[0, 0.14, 0]}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(station);
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap cursor-pointer select-none transition-all shadow-xl ${
              isSelected
                ? 'bg-slate-950/95 text-white ring-2 ring-sky-400 font-bold border border-sky-300 scale-110 shadow-sky-500/40'
                : hovered
                  ? 'bg-slate-900/90 text-sky-200 border border-sky-400 scale-105'
                  : 'bg-slate-950/85 text-slate-200 border border-slate-700/80 hover:border-sky-400'
            }`}
          >
            {/* Buoy/Argo Icon Pin */}
            <span className={`w-2 h-2 rounded-full flex items-center justify-center ${
              isSelected ? 'bg-sky-400 animate-ping' : isArgo ? 'bg-purple-400' : 'bg-emerald-400'
            }`} />
            <span>{displayCode}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
