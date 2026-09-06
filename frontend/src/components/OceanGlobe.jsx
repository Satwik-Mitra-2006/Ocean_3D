import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Clean Photorealistic Satellite Earth Globe
 * - High-res NASA Blue Marble satellite Earth texture with real continents, oceans, snow, and vegetation.
 * - Removed harsh/blotchy color overlays per user request.
 * - Subtle specular reflections on ocean surface.
 * - Soft cyan atmospheric rim halo.
 * - Smooth OrbitControls interaction and optional idle auto-rotation.
 */
export default function OceanGlobe({ 
  primaryVariable = 'thetao', 
  opacity = 0.85,
  isAutoRotate = false
}) {
  const globeGroupRef = useRef();

  // Photorealistic NASA Blue Marble Satellite Earth Texture
  const earthSatelliteTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/earth_day.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // Idle gentle rotation if user toggled Auto-Rotate
  useFrame((_, delta) => {
    if (globeGroupRef.current && isAutoRotate) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* 1. Base Photorealistic Satellite Earth Sphere */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial
          map={earthSatelliteTexture}
          roughness={0.4}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Soft Atmospheric Cyan Rim Glow */}
      <mesh scale={[1.022, 1.022, 1.022]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Outer Space-Facing Atmospheric Halo */}
      <mesh scale={[1.048, 1.048, 1.048]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
