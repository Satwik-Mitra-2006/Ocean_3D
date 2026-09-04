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

export default function ObservationMarker({ 
  station, 
  isSelected, 
  onSelect,
  currentTimeHour = 12
}) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef();
  const secondaryRingRef = useRef();
  const beaconPillarRef = useRef();

  const lat = station.lat ?? station.latitude ?? 15.0;
  const lon = station.lon ?? station.longitude ?? 72.0;
  const markerPos = latLonToVector3(lat, lon, 2.538);

  // Status color mappings
  const statusColors = {
    Active: '#10b981',   // Emerald
    Warning: '#f59e0b',  // Amber
    Offline: '#f43f5e'   // Rose
  };
  const color = statusColors[station.status] || '#0284c7';

  // Orientation vector pointing radially outward from center of earth
  const normal = markerPos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal
  );

  // Animate pulse rings and selected beacon
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // Pulse ring on ocean surface
    if (ringRef.current) {
      const s = 1 + (Math.sin(time * 3.5) * 0.25 + 0.25);
      ringRef.current.scale.set(s, s, s);
    }

    if (secondaryRingRef.current && isSelected) {
      const s2 = 1 + (Math.cos(time * 3) * 0.35 + 0.35);
      secondaryRingRef.current.scale.set(s2, s2, s2);
    }

    // Glowing beacon pulse
    if (beaconPillarRef.current && isSelected) {
      beaconPillarRef.current.material.opacity = 0.6 + Math.sin(time * 4) * 0.25;
    }
  });

  const stationCode = station.code || (station.name ? station.name.split('—')[1]?.trim() : station.id);

  return (
    <group position={markerPos} quaternion={quaternion}>
      {/* Generous Click Hit-Sphere (Raycasting target) */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(station);
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
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 1. Ocean Surface Anchor Rings */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.095, 32]} />
        <meshBasicMaterial 
          color={isSelected ? '#38bdf8' : color} 
          transparent 
          opacity={isSelected ? 0.95 : hovered ? 0.85 : 0.6} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Selected Secondary Outer Pulsing Ring */}
      {isSelected && (
        <mesh ref={secondaryRingRef} position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.13, 0.16, 32]} />
          <meshBasicMaterial 
            color="#38bdf8" 
            transparent 
            opacity={0.7} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}

      {/* 2. Selected Station Tall Glowing Beacon Beam (Shoots into sky) */}
      {isSelected && (
        <group>
          {/* Main vertical laser cylinder */}
          <mesh ref={beaconPillarRef} position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.02, 0.05, 0.85, 16]} />
            <meshBasicMaterial 
              color="#38bdf8" 
              transparent 
              opacity={0.65} 
              side={THREE.DoubleSide} 
            />
          </mesh>
          {/* Inner core beam */}
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.008, 0.015, 0.88, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </group>
      )}

      {/* 3. Physical Buoy Structure */}
      <group scale={isSelected ? [1.6, 1.6, 1.6] : hovered ? [1.35, 1.35, 1.35] : [1, 1, 1]}>
        {/* Floating Buoy Torus */}
        <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.018, 12, 24]} />
          <meshStandardMaterial 
            color={isSelected ? '#38bdf8' : '#f59e0b'} 
            roughness={0.25} 
            metalness={0.7} 
            emissive={isSelected ? '#0284c7' : '#000000'}
            emissiveIntensity={isSelected ? 0.6 : 0}
          />
        </mesh>

        {/* Mast Stem */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.07, 8]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Flashing Top Beacon LED */}
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.024, 12, 12]} />
          <meshBasicMaterial color={isSelected ? '#38bdf8' : color} />
        </mesh>
      </group>

      {/* 4. Sleek Floating Station Badge */}
      <Html
        position={[0, isSelected ? 0.75 : 0.22, 0]}
        center
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div className={`px-2 py-0.5 rounded-md text-[11px] font-bold font-mono tracking-tight whitespace-nowrap select-none transition-all shadow-md ${
          isSelected
            ? 'bg-sky-500 text-slate-950 ring-2 ring-white scale-110 shadow-sky-500/50'
            : hovered
            ? 'bg-slate-900/95 text-sky-300 border border-sky-400 scale-105'
            : 'bg-slate-950/85 text-slate-200 border border-white/20'
        }`}>
          📍 {stationCode}
        </div>
      </Html>
    </group>
  );
}
