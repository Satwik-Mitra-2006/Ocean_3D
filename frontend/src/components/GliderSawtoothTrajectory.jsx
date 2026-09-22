import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';
import { Activity, Gauge, Compass } from 'lucide-react';

/**
 * GliderSawtoothTrajectory
 * Visualizes the 4D yo-yo / sawtooth dive profile of autonomous underwater gliders
 * (INCOIS Bay of Bengal & NIOT Arabian Sea missions).
 */
export default function GliderSawtoothTrajectory({
  glider,
  isSelected = false,
  onSelect
}) {
  const gliderMeshRef = useRef();
  const trajectory = glider?.trajectory || [];

  // Convert 4D waypoints [lat, lon, depth, time] to 3D spherical coordinates
  const { points3D, curve, pathLength } = useMemo(() => {
    if (!trajectory || trajectory.length === 0) {
      return { points3D: [], curve: null, pathLength: 0 };
    }

    const pts = trajectory.map(wp => {
      // Invert depth slightly below the 2.536 Earth radius for depth perception
      // Surface is 2.536, max 1000m depth maps to 2.450
      const dNorm = Math.min(1000, Number(wp.depth) || 0) / 1000.0;
      const radius = 2.536 - dNorm * 0.085;
      return latLonToVector3(wp.lat, wp.lon, radius);
    });

    const crv = pts.length > 1 ? new THREE.CatmullRomCurve3(pts) : null;
    return {
      points3D: pts,
      curve: crv,
      pathLength: pts.length
    };
  }, [trajectory]);

  // Line geometry for the sawtooth dive trajectory
  const lineGeometry = useMemo(() => {
    if (!curve) return null;
    const smoothPoints = curve.getPoints(80);
    return new THREE.BufferGeometry().setFromPoints(smoothPoints);
  }, [curve]);

  // Animate glider vehicle moving along the sawtooth dive path
  useFrame(({ clock }) => {
    if (!curve || !gliderMeshRef.current) return;
    const t = (clock.getElapsedTime() * 0.06) % 1;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    gliderMeshRef.current.position.copy(pos);

    // Align glider vehicle orientation to its dive angle
    const up = pos.clone().normalize();
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize();
    const m = new THREE.Matrix4().makeBasis(right, correctedUp, tangent.negate());
    gliderMeshRef.current.quaternion.setFromRotationMatrix(m);
  });

  if (!curve || !lineGeometry) return null;

  return (
    <group>
      {/* 1. Sawtooth Dive Path (Ribbon Line) */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={isSelected ? '#34d399' : '#10b981'}
          linewidth={2}
          transparent
          opacity={isSelected ? 0.95 : 0.75}
        />
      </line>

      {/* 2. Waypoint Depth Anchor Spheres */}
      {points3D.map((pos, idx) => {
        const wp = trajectory[idx];
        const isSurface = wp.depth <= 20;
        return (
          <group key={`wp-${idx}`} position={pos}>
            <mesh>
              <sphereGeometry args={[isSurface ? 0.018 : 0.012, 12, 12]} />
              <meshBasicMaterial
                color={isSurface ? '#38bdf8' : '#34d399'}
                transparent
                opacity={0.85}
              />
            </mesh>
          </group>
        );
      })}

      {/* 3. Autonomous Glider Vehicle Model */}
      <group ref={gliderMeshRef}>
        {/* Main Torpedo Body */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.014, 0.08, 12]} />
          <meshStandardMaterial
            color="#f59e0b"
            roughness={0.2}
            metalness={0.7}
            emissive="#d97706"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Aerodynamic Wings */}
        <mesh position={[0, 0, 0.01]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.075, 0.003, 0.02]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} />
        </mesh>
        {/* Vertical Tail Fin */}
        <mesh position={[0, 0.016, -0.03]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.003, 0.022, 0.018]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>

        {/* Live Glider Telemetry Tag */}
        {isSelected && (
          <Html position={[0, 0.06, 0]} center zIndexRange={[60, 0]} style={{ pointerEvents: 'none' }}>
            <div className="bg-slate-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-md text-[9px] font-mono text-emerald-300 shadow-xl whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{glider.code || 'GLIDER'}: {Number(glider.depth || 154).toFixed(0)}m Dive</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
