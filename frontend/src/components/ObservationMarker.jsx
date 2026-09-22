import React, { useRef, useState, useEffect } from 'react';
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
    const facing = dot > 0.06; 
    if (facing !== isFacingCamera) {
      setIsFacingCamera(facing);
    }

    // Subtle Anchor Pulse ring on ocean surface (less poppy, refined)
    if (ringRef.current) {
      const s = 1.0 + Math.sin(time * 2.8) * 0.12;
      ringRef.current.scale.set(s, s, s);
    }

    // Expanding Sonar Radar Wave for Selected Station
    if (sonarRingRef.current && isSelected) {
      const cycle = (time * 1.2) % 1.0;
      const sonarScale = 1.0 + cycle * 2.0;
      sonarRingRef.current.scale.set(sonarScale, sonarScale, sonarScale);
      if (sonarRingRef.current.material) {
        sonarRingRef.current.material.opacity = (1.0 - cycle) * 0.65;
      }
    }
  });

  // Display label formatting
  let displayCode = station.code;
  if (!displayCode || displayCode === 'ARGO-1844') {
    displayCode = 'ARGO 2901844';
  }
  const isArgo = displayCode.includes('ARGO');
  const isGlider = displayCode.includes('GLIDER');

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
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Main Refined Marker Group (subtle, non-poppy, sleek Aurora Indigo) */}
      <group scale={isSelected ? [1.10, 1.10, 1.10] : hovered ? [1.05, 1.05, 1.05] : [1, 1, 1]}>
        {/* 1. Pulsing Surface Anchor Ring */}
        <mesh ref={ringRef} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.035, 0.055, 24]} />
          <meshBasicMaterial 
            color={isSelected ? '#818cf8' : '#6366f1'} 
            transparent 
            opacity={isSelected ? 0.9 : 0.6} 
            side={THREE.DoubleSide} 
          />
        </mesh>

        {/* 2. Concentric Sonar Wave when Selected */}
        {isSelected && (
          <mesh ref={sonarRingRef} position={[0, 0.018, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.045, 0.065, 32]} />
            <meshBasicMaterial 
              color="#a855f7" 
              transparent 
              opacity={0.6} 
              side={THREE.DoubleSide} 
            />
          </mesh>
        )}

        {/* 3. Small Sensor Beacon Dot */}
        <mesh position={[0, 0.025, 0]}>
          <sphereGeometry args={[isSelected ? 0.026 : 0.02, 16, 16]} />
          <meshBasicMaterial color={isSelected ? '#ffffff' : '#818cf8'} />
        </mesh>
      </group>

      {/* 4. Compact Floating Station Pill (Uncluttered, Sleek, No Poppy Popup) */}
      {isFacingCamera && (
        <Html
          position={[0, 0.12, 0]}
          center
          zIndexRange={[80, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(station);
            }}
            onMouseEnter={handlePointerEnter}
            onMouseLeave={handlePointerLeave}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono tracking-tight whitespace-nowrap cursor-pointer select-none transition-all shadow-md ${
              isSelected
                ? 'bg-slate-950/95 text-white ring-1.5 ring-indigo-400 font-bold border border-indigo-300 shadow-indigo-500/40'
                : hovered
                  ? 'bg-[#0a0d1f]/95 text-indigo-200 border border-indigo-400'
                  : 'bg-[#080a18]/85 text-slate-200 border border-indigo-500/30 hover:border-indigo-400'
            }`}
          >
            {/* Status Indicator */}
            <span className={`w-1.5 h-1.5 rounded-full flex items-center justify-center shrink-0 ${
              isSelected ? 'bg-indigo-400 animate-ping' : isGlider ? 'bg-amber-400' : isArgo ? 'bg-purple-400' : 'bg-emerald-400'
            }`} />
            <span>{displayCode}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
