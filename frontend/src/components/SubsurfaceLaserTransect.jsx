import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';

// Predefined key oceanographic transect lines in the Indian Ocean
export const TRANSECT_PRESETS = [
  {
    id: 'as-transect',
    name: 'Arabian Sea High-Salinity Transect (ASHSW)',
    zone: 'Mumbai Shelf -> Lakshadweep Deep Basin',
    start: { lat: 18.9, lon: 72.8, name: 'Mumbai Coast' },
    end: { lat: 10.5, lon: 72.6, name: 'Lakshadweep (CB01)' },
    phenomenon: 'ASHSW Subduction (36.5 PSU at 100m) & Thermocline'
  },
  {
    id: 'bob-transect',
    name: 'Bay of Bengal Barrier Layer Transect',
    zone: 'Chennai Coast -> Central Bay Glider',
    start: { lat: 13.0, lon: 80.3, name: 'Chennai (BD11)' },
    end: { lat: 16.5, lon: 88.0, name: 'Bay Glider (GL01)' },
    phenomenon: 'Freshwater River Plume & Intense Barrier Layer Heat (30.5°C)'
  }
];

export default function SubsurfaceLaserTransect({
  visible = true,
  activeTransectId = 'as-transect',
  onSelectTransect
}) {
  const meshRef = useRef();

  const currentTransect = useMemo(() => {
    return TRANSECT_PRESETS.find(t => t.id === activeTransectId) || TRANSECT_PRESETS[0];
  }, [activeTransectId]);

  // Construct vertical curtain geometry between start and end
  // Surface radius = 2.538, Deep abyss radius = 2.450 (~2000m depth)
  const { geometry, startTop, endTop, midTop } = useMemo(() => {
    const numSegments = 32;
    const start = currentTransect.start;
    const end = currentTransect.end;

    const surfaceRadius = 2.538;
    const abyssRadius = 2.450; // Deep vertical slice

    const topPoints = [];
    const bottomPoints = [];

    for (let i = 0; i <= numSegments; i++) {
      const frac = i / numSegments;
      const lat = start.lat + (end.lat - start.lat) * frac;
      const lon = start.lon + (end.lon - start.lon) * frac;

      topPoints.push(latLonToVector3(lat, lon, surfaceRadius));
      bottomPoints.push(latLonToVector3(lat, lon, abyssRadius));
    }

    // Build quad strip vertices
    const vertices = [];
    const uvs = [];

    for (let i = 0; i < numSegments; i++) {
      const t1 = topPoints[i];
      const t2 = topPoints[i + 1];
      const b1 = bottomPoints[i];
      const b2 = bottomPoints[i + 1];

      // Tri 1: t1, b1, t2
      vertices.push(t1.x, t1.y, t1.z);
      vertices.push(b1.x, b1.y, b1.z);
      vertices.push(t2.x, t2.y, t2.z);

      uvs.push(i / numSegments, 1);
      uvs.push(i / numSegments, 0);
      uvs.push((i + 1) / numSegments, 1);

      // Tri 2: t2, b1, b2
      vertices.push(t2.x, t2.y, t2.z);
      vertices.push(b1.x, b1.y, b1.z);
      vertices.push(b2.x, b2.y, b2.z);

      uvs.push((i + 1) / numSegments, 1);
      uvs.push(i / numSegments, 0);
      uvs.push((i + 1) / numSegments, 0);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();

    return {
      geometry: geom,
      startTop: topPoints[0],
      endTop: topPoints[topPoints.length - 1],
      midTop: topPoints[Math.floor(topPoints.length / 2)]
    };
  }, [currentTransect]);

  // Dynamic Laser Curtain Shader Material
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorTop: { value: new THREE.Color('#f43f5e') },      // Warm Surface (29°C)
        uColorMid: { value: new THREE.Color('#38bdf8') },      // Thermocline (15°C)
        uColorDeep: { value: new THREE.Color('#1e1b4b') },     // Deep Abyss (4°C)
        uLaserColor: { value: new THREE.Color('#00ffff') }     // Laser Grid
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorDeep;
        uniform vec3 uLaserColor;
        varying vec2 vUv;

        void main() {
          // Vertical thermal stratification (1.0 = surface, 0.0 = 2000m abyss)
          float depthFactor = vUv.y;
          
          vec3 oceanGrad = mix(uColorDeep, uColorMid, smoothstep(0.0, 0.6, depthFactor));
          oceanGrad = mix(oceanGrad, uColorTop, smoothstep(0.6, 1.0, depthFactor));

          // Scanline laser pulses moving down
          float scanline = sin((vUv.y * 20.0) - (uTime * 3.0));
          float laserGrid = step(0.92, scanline) * 0.4;

          // Vertical depth contour lines at intervals (0m, 100m, 500m, 1000m)
          float contour1 = 1.0 - smoothstep(0.0, 0.015, abs(vUv.y - 0.95)); // ~100m thermocline
          float contour2 = 1.0 - smoothstep(0.0, 0.015, abs(vUv.y - 0.75)); // ~500m
          float contour3 = 1.0 - smoothstep(0.0, 0.015, abs(vUv.y - 0.50)); // ~1000m
          float contours = (contour1 + contour2 + contour3) * 0.6;

          vec3 finalColor = oceanGrad + (uLaserColor * (laserGrid + contours));

          // Edge glow & alpha
          float alpha = 0.78 + (laserGrid * 0.2);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }, []);

  useFrame(({ clock }) => {
    if (shaderMaterial) {
      shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  if (!visible) return null;

  return (
    <group ref={meshRef}>
      <mesh geometry={geometry} material={shaderMaterial} />
    </group>
  );
}
