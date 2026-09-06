import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';

export default function VirtualProbeMarker({ probe, onClear }) {
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const beaconRef = useRef();

  if (!probe) return null;

  const lat = probe.lat ?? probe.latitude ?? 12.0;
  const lon = probe.lon ?? probe.longitude ?? 75.0;
  const pos = latLonToVector3(lat, lon, 2.54);

  const normal = pos.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    normal
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Pulsing sonar radar ripple rings
    if (ring1Ref.current) {
      const s1 = 1 + (t * 2.5) % 3.0;
      ring1Ref.current.scale.set(s1, s1, s1);
      ring1Ref.current.material.opacity = Math.max(0, 1 - (s1 - 1) / 3.0);
    }
    if (ring2Ref.current) {
      const s2 = 1 + ((t * 2.5 + 1.5) % 3.0);
      ring2Ref.current.scale.set(s2, s2, s2);
      ring2Ref.current.material.opacity = Math.max(0, 1 - (s2 - 1) / 3.0);
    }
    if (beaconRef.current) {
      beaconRef.current.material.opacity = 0.7 + Math.sin(t * 6) * 0.3;
    }
  });

  return (
    <group position={pos} quaternion={quaternion}>
      {/* 1. Sonar Ripple Waves */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 32]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Floating Buoy Core */}
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.8} />
      </mesh>

      {/* 3. Probe Beacon Mast */}
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 4. Flashing Beacon Light */}
      <mesh ref={beaconRef} position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial color="#38bdf8" transparent />
      </mesh>

      {/* 5. CTD Subsurface Cable Sounding line */}
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.5, 6]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>

      {/* 6. Floating Label */}
      <Html position={[0, 0.32, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-600 text-white shadow-lg border border-sky-300 font-mono flex items-center gap-1 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            VIRTUAL PROBE
          </span>
          <span className="text-[9px] font-mono text-sky-200 bg-slate-950/90 px-1.5 py-0.2 rounded border border-slate-700 shadow">
            {Math.abs(lat).toFixed(2)}°{lat >= 0 ? 'N' : 'S'}, {Math.abs(lon).toFixed(2)}°{lon >= 0 ? 'E' : 'W'}
          </span>
        </div>
      </Html>
    </group>
  );
}
