import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';

/**
 * IsosurfaceLayer
 * Extracts and renders 3D isothermal surfaces (e.g. 20°C Thermocline Isosurface / 26°C Cyclone Heat Surface)
 * across the Indian Ocean basin.
 */
export default function IsosurfaceLayer({
  targetTemp = 28.0, // e.g. 20.0, 26.0, 28.0 °C
  visible = true,
  opacity = 0.75,
  isGlobe = true
}) {
  const meshRef = useRef();

  // Generate an undulating 3D surface mesh matching the isothermal layer
  const geometry = useMemo(() => {
    if (!visible) return null;

    if (isGlobe) {
      // Spherical isothermal shell covering Indian Ocean domain (Lat 0 to 24°N, Lon 60 to 95°E)
      const latSteps = 30;
      const lonSteps = 40;
      const vertices = [];
      const indices = [];

      for (let i = 0; i <= latSteps; i++) {
        const lat = 2.0 + (i / latSteps) * 22.0;
        for (let j = 0; j <= lonSteps; j++) {
          const lon = 60.0 + (j / lonSteps) * 35.0;

          // Thermocline depth equation: depends on targetTemp and geographical basin
          // 28°C surface is near 0-30m; 20°C thermocline is deeper (80-160m)
          const baseDepth = targetTemp <= 22.0 ? 120 : (targetTemp <= 26.0 ? 65 : 18);
          // Monsoon upwelling shallowing off the western coast & Bay of Bengal stratification
          const upwellingTilt = (78.0 - lon) * 1.5 + Math.sin(lat * 0.25) * 12.0;
          const depth_m = Math.max(5, baseDepth - upwellingTilt);

          // Convert to 3D sphere coordinate
          const r = 2.536 - (depth_m / 1000.0) * 0.085;
          const v = latLonToVector3(lat, lon, r);
          vertices.push(v.x, v.y, v.z);
        }
      }

      for (let i = 0; i < latSteps; i++) {
        for (let j = 0; j < lonSteps; j++) {
          const a = i * (lonSteps + 1) + j;
          const b = (i + 1) * (lonSteps + 1) + j;
          const c = (i + 1) * (lonSteps + 1) + (j + 1);
          const d = i * (lonSteps + 1) + (j + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    } else {
      // Planar undulating isosurface inside the water column box
      const geo = new THREE.PlaneGeometry(3.5, 3.5, 32, 32);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position;
      const targetY = targetTemp <= 22.0 ? -1.1 : (targetTemp <= 26.0 ? -0.4 : 0.15);
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const undulation = Math.sin(x * 1.8) * 0.08 + Math.cos(z * 1.5) * 0.06;
        pos.setY(i, targetY + undulation);
      }
      geo.computeVertexNormals();
      return geo;
    }
  }, [targetTemp, visible, isGlobe]);

  // Subtle breathing pulse for thermal boundary
  useFrame(({ clock }) => {
    if (meshRef.current && visible) {
      const t = clock.getElapsedTime();
      meshRef.current.material.opacity = opacity * (0.85 + 0.15 * Math.sin(t * 1.2));
    }
  });

  if (!visible || !geometry) return null;

  const color = targetTemp <= 22.0 ? '#06b6d4' : (targetTemp <= 26.0 ? '#f59e0b' : '#ef4444');

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        metalness={0.2}
        transparent
        opacity={opacity}
        wireframe={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
