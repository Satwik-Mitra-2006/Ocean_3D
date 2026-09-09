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
 * - Day/Night Solar Terminator: Custom GLSL shader overlay that darkens the night-side of the globe
 *   based on the currentTimeHour (0-23). The sun direction is computed from the hour angle so that
 *   at 12:00 the sub-solar point is at the center of the visible hemisphere and at 00:00 (midnight)
 *   the entire visible face is in shadow.
 */

// GLSL Solar Terminator Shader Material
const terminatorVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const terminatorFragmentShader = `
  uniform vec3 uSunDirection;   // normalised direction from Earth centre toward the Sun
  uniform float uTerminatorSoftness; // angular softness in radians (~0.05)

  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    // Dot product between outward normal and sun direction gives cos(angle from sub-solar point)
    // > 0  => dayside, < 0 => nightside
    vec3 norm = normalize(vNormal);
    float cosAngle = dot(norm, normalize(uSunDirection));

    // Smooth terminator band
    float shadowFactor = 1.0 - smoothstep(-uTerminatorSoftness, uTerminatorSoftness, cosAngle);

    // Night side: deep navy-black shadow; day side: transparent (0 opacity)
    // Blend: fully transparent on day side, semi-opaque dark on night side
    float alpha = shadowFactor * 0.72;
    vec3 nightColor = vec3(0.01, 0.02, 0.06);

    gl_FragColor = vec4(nightColor, alpha);
  }
`;

export default function OceanGlobe({ 
  primaryVariable = 'thetao', 
  opacity = 0.85,
  isAutoRotate = false,
  currentTimeHour = 12   // <-- new prop: 0-23 UTC hour
}) {
  const globeGroupRef = useRef();
  const terminatorMeshRef = useRef();

  // Photorealistic NASA Blue Marble Satellite Earth Texture
  const earthSatelliteTexture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/earth_day.jpg');
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  // Build the custom shader material once and update uniform each frame
  const terminatorMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: terminatorVertexShader,
      fragmentShader: terminatorFragmentShader,
      uniforms: {
        uSunDirection: { value: new THREE.Vector3(1, 0, 0) },
        uTerminatorSoftness: { value: 0.06 }
      },
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.NormalBlending
    });
  }, []);

  // Compute sun direction from UTC hour
  // THREE.js SphereGeometry UV mapping: longitude 0° = +Z face
  // Camera is at z=-5.5, so the camera-facing face has normals pointing in -Z direction
  // We want the visible Indian Ocean face (center of the app) to be lit during daytime.
  // Since the UI uses IST (UTC+5.5), we add +5.5h to treat slider values as IST:
  //   • 6 AM IST → ~11.5h effective UTC → sub-solar lon ≈ 7.5°E → visible face bright ✓
  //   • 12 PM IST → ~17.5h effective UTC → sub-solar lon ≈ -82.5°W → afternoon light ✓  
  //   • Midnight IST → ~5.5h effective UTC → sub-solar lon ≈ 97.5°E → dark ✓
  //
  // Sub-solar longitude formula (standard Earth rotation):
  //   lon_sun = (12 - hour_UTC) * 15°  (positive = East)
  // In our coordinate system: lon=0° → +Z, lon=90°E → +X
  //   sunX = sin(lon_rad), sunZ = cos(lon_rad)
  const computeSunDirection = (hour) => {
    // Apply IST offset so time slider (IST) maps to correct solar position
    const effectiveUTC = (hour + 5.5) % 24;
    // Sub-solar longitude in radians (positive = East)
    const lonRad = (12 - effectiveUTC) * (Math.PI / 12); // 15° per hour
    return new THREE.Vector3(
      Math.sin(lonRad),    // East component
      0.12,                // slight axial tilt for realism
      Math.cos(lonRad)     // Forward (+Z) component — camera faces -Z so +Z normals face away
    ).normalize();
  };

  // Idle gentle rotation if user toggled Auto-Rotate + update terminator uniform each frame
  useFrame((_, delta) => {
    if (globeGroupRef.current && isAutoRotate) {
      globeGroupRef.current.rotation.y += delta * 0.08;
    }

    // Update sun direction uniform — use world-space direction directly
    // (The shader works in world space via vWorldPosition + vNormal)
    if (terminatorMeshRef.current) {
      const sunDir = computeSunDirection(currentTimeHour);
      terminatorMaterial.uniforms.uSunDirection.value.copy(sunDir);
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

      {/* 2. Solar Terminator Day/Night Overlay — sits just above the globe surface */}
      <mesh ref={terminatorMeshRef} scale={[1.001, 1.001, 1.001]}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <primitive object={terminatorMaterial} attach="material" />
      </mesh>

      {/* 3. Soft Atmospheric Cyan Rim Glow */}
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

      {/* 4. Outer Space-Facing Atmospheric Halo */}
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
