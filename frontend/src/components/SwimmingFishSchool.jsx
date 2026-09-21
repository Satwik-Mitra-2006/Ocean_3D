import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ========================================================================
// 1. SPECIES A: ROYAL BLUE FLOWING-FIN BETTA (MATCHING USER REFERENCE PHOTO 1)
// ========================================================================

/**
 * Royal Blue Betta Fish Body Geometry
 * Fusiform body with rich iridescent royal blue scales and warm golden-amber ventral tones.
 */
function createBettaBodyGeometry() {
  const geom = new THREE.BufferGeometry();
  const segments = [
    // [z, rx, ry, yCenter]
    [ 0.38, 0.012, 0.015,  0.00 ],  // Snout tip
    [ 0.30, 0.048, 0.060,  0.005],  // Head & eye
    [ 0.20, 0.080, 0.096,  0.012],  // Gills / operculum
    [ 0.08, 0.098, 0.124,  0.016],  // Deepest mid-body
    [-0.04, 0.092, 0.120,  0.012],  // Flank
    [-0.16, 0.074, 0.098,  0.006],  // Posterior body
    [-0.26, 0.050, 0.068,  0.002],  // Caudal peduncle
    [-0.34, 0.024, 0.035,  0.000],  // Tail root
  ];

  const radialSegments = 16;
  const positions = [];
  const normals = [];
  const colors = [];

  for (let s = 0; s < segments.length; s++) {
    const [z, rx, ry, yCenter] = segments[s];
    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      positions.push(cosT * rx, yCenter + sinT * ry, z);

      const nx = cosT;
      const ny = sinT;
      const nz = 0.15 * (s / segments.length - 0.5);
      const len = Math.hypot(nx, ny, nz);
      normals.push(nx / len, ny / len, nz / len);

      // Photo 1 Palette: Deep royal sapphire blue on dorsal/flank, warm amber-gold on ventral
      const dorsal = Math.max(0, sinT);
      const ventral = Math.max(0, -sinT);

      const rCol = 0.02 * dorsal + 0.10 * (1 - dorsal) + 0.70 * ventral;
      const gCol = 0.30 * dorsal + 0.52 * (1 - dorsal) + 0.48 * ventral;
      const bCol = 0.98 * dorsal + 0.92 * (1 - dorsal) + 0.18 * ventral;

      colors.push(rCol, gCol, bCol);
    }
  }

  const indices = [];
  const stride = radialSegments + 1;
  for (let s = 0; s < segments.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * stride + r;
      const b = (s + 1) * stride + r;
      const c = (s + 1) * stride + (r + 1);
      const d = s * stride + (r + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Massive Flowing Silk Veil Tail (Halfmoon Caudal Fin - Matching Photo 1)
 * Royal blue at the top with translucent glowing golden-amber trailing drape.
 */
function createBettaFlowingTailGeometry() {
  const geom = new THREE.BufferGeometry();
  const rayCount = 14;
  const radialSteps = 8;
  const positions = [];
  const colors = [];
  const indices = [];

  for (let step = 0; step <= radialSteps; step++) {
    const rFrac = step / radialSteps;
    const len = rFrac * 0.70;

    for (let ray = 0; ray <= rayCount; ray++) {
      const rayFrac = ray / rayCount;
      const fanAngle = THREE.MathUtils.lerp(1.30, -1.20, rayFrac);

      const finHeight = Math.sin(fanAngle) * (0.04 + rFrac * 0.48);
      const finSide = Math.cos(fanAngle) * (0.02 + rFrac * 0.20);
      const finZ = -len;

      positions.push(finSide, finHeight, finZ);

      // Color gradient matching Photo 1:
      if (rayFrac < 0.52) {
        colors.push(0.04, 0.48, 0.98);
      } else {
        const amberRatio = (rayFrac - 0.52) / 0.48;
        const rCol = THREE.MathUtils.lerp(0.04, 0.98, amberRatio);
        const gCol = THREE.MathUtils.lerp(0.48, 0.68, amberRatio);
        const bCol = THREE.MathUtils.lerp(0.98, 0.10, amberRatio);
        colors.push(rCol, gCol, bCol);
      }
    }
  }

  const stride = rayCount + 1;
  for (let s = 0; s < radialSteps; s++) {
    for (let r = 0; r < rayCount; r++) {
      const a = s * stride + r;
      const b = (s + 1) * stride + r;
      const c = (s + 1) * stride + (r + 1);
      const d = s * stride + (r + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Drooping Ventral Ribbon Fins (Betta - Photo 1)
 */
function createBettaRibbonFinGeometry() {
  const geom = new THREE.BufferGeometry();
  const verts = new Float32Array([
    // Base
     0.01, -0.05,  0.08,
    -0.01, -0.05,  0.08,
    // Mid drape
     0.02, -0.24, -0.02,
    -0.02, -0.24, -0.02,
    // Flowing golden tip
     0.01, -0.40, -0.10,
    -0.01, -0.40, -0.10,
  ]);
  const colors = [
    0.05, 0.45, 0.95,
    0.05, 0.45, 0.95,
    0.80, 0.62, 0.15,
    0.80, 0.62, 0.15,
    0.98, 0.72, 0.08,
    0.98, 0.72, 0.08,
  ];
  geom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]);
  geom.computeVertexNormals();
  return geom;
}

// ========================================================================
// 2. SPECIES B: CRYSTALLINE NEON WIREFRAME GLASS FISH (REFERENCE PHOTO 2)
// ========================================================================

/**
 * Crystal Glass Fish Body Geometry with Internal Wireframe Contours
 */
function createGlassFishBodyGeometry() {
  const geom = new THREE.BufferGeometry();
  const segments = [
    // [z, rx, ry, yCenter]
    [ 0.36, 0.015, 0.018,  0.00 ],  // Transparent snout
    [ 0.28, 0.052, 0.065,  0.005],  // Cranial dome with golden eye
    [ 0.18, 0.082, 0.102,  0.012],  // Operculum
    [ 0.06, 0.102, 0.132,  0.016],  // Mid-body visceral cavity
    [-0.06, 0.096, 0.126,  0.012],  // Deep transparent flank
    [-0.18, 0.076, 0.102,  0.006],  // Posterior taper
    [-0.28, 0.048, 0.068,  0.002],  // Peduncle
    [-0.35, 0.020, 0.030,  0.000],  // Caudal base
  ];

  const radialSegments = 14;
  const positions = [];
  const normals = [];

  for (let s = 0; s < segments.length; s++) {
    const [z, rx, ry, yCenter] = segments[s];
    for (let r = 0; r <= radialSegments; r++) {
      const theta = (r / radialSegments) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      positions.push(cosT * rx, yCenter + sinT * ry, z);

      const nx = cosT;
      const ny = sinT;
      const nz = 0.15 * (s / segments.length - 0.5);
      const len = Math.hypot(nx, ny, nz);
      normals.push(nx / len, ny / len, nz / len);
    }
  }

  const indices = [];
  const stride = radialSegments + 1;
  for (let s = 0; s < segments.length - 1; s++) {
    for (let r = 0; r < radialSegments; r++) {
      const a = s * stride + r;
      const b = (s + 1) * stride + r;
      const c = (s + 1) * stride + (r + 1);
      const d = s * stride + (r + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Radiating Neon Fin Ray Lines for Glass Fish (Photo 2)
 */
function createGlassFishFinLinesGeometry() {
  const pts = [];
  // Caudal tail rays (forked fan trailing at Z = -0.35)
  for (let i = -6; i <= 6; i++) {
    const angle = (i / 6) * 0.85;
    pts.push(0, 0, -0.35);
    pts.push(
      Math.sin(angle) * 0.08,
      Math.sin(angle) * 0.22,
      -0.35 - Math.cos(angle) * 0.26
    );
  }
  // Dorsal fin rays
  for (let i = 0; i <= 7; i++) {
    const z = THREE.MathUtils.lerp(0.18, -0.06, i / 7);
    pts.push(0, 0.12, z);
    pts.push(0, 0.24, z - 0.08);
  }
  // Ventral anal fin rays
  for (let i = 0; i <= 6; i++) {
    const z = THREE.MathUtils.lerp(0.00, -0.20, i / 6);
    pts.push(0, -0.11, z);
    pts.push(0, -0.22, z - 0.06);
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return geom;
}

// ========================================================================
// 3. SEPARATE DISTINCT TRAJECTORIES (FULL-PAGE ROAMING, ZERO CLUMPING)
// ========================================================================

/**
 * Earth Silhouette Safe Guard:
 * When a fish is in front of the camera (Z > -0.5), ensure its projected
 * (X, Y) coordinate avoids the center globe area (X: [-3.2, 3.2], Y: [-1.8, 2.4])
 * so it NEVER covers India or the observation station pins!
 */
function applyEarthSilhouetteClearance(pos) {
  if (pos.z > -0.5) {
    const centerX = 0.0;
    const centerY = 0.35;
    const dx = (pos.x - centerX) / 3.4;
    const dy = (pos.y - centerY) / 2.5;
    const distSq = dx * dx + dy * dy;

    if (distSq < 1.0) {
      const dist = Math.sqrt(distSq);
      const push = 1.05 / Math.max(dist, 0.001);
      pos.x = centerX + (pos.x - centerX) * push;
      pos.y = centerY + (pos.y - centerY) * push;
    }
  }
  return pos;
}

/**
 * Pod 1 (Upper Betta Squadron - Photo 1):
 * Sweeps smoothly across the TOP half of the webpage:
 * - Upper-left (Navbar & Sidebar header)
 * - Across the top perimeter above the Earth
 * - Upper-right (Copernicus Live status & Telemetry)
 * - Loops back in a flowing arc
 */
function getUpperBettaCircuit(s) {
  const t = s;
  let x = Math.cos(t) * 9.6 + Math.sin(t * 2.0) * 1.6;
  let y = 3.6 + Math.sin(t) * 1.3 + Math.cos(t * 2.0) * 0.4;
  let z = Math.sin(t) * 3.5 - 1.2;

  return applyEarthSilhouetteClearance(new THREE.Vector3(x, y, z));
}

/**
 * Pod 2 (Lower Neon Glass Fish School - Photo 2):
 * Sweeps smoothly across the BOTTOM half of the webpage:
 * - Lower-left (Date range & Variables panel & seamounts)
 * - Lower-center (Model comparison table & Diurnal sparklines)
 * - Lower-right (Data charts & AI agent)
 * - Ascends up the right telemetry margin and swoops back
 */
function getLowerGlassFishCircuit(s) {
  const t = s;
  let x = Math.sin(t) * 9.4 + Math.cos(t * 2.0) * 1.4;
  let y = -3.5 + Math.cos(t) * 1.4 + Math.sin(t * 2.0) * 0.4;
  let z = Math.cos(t) * 3.2 - 0.8;

  return applyEarthSilhouetteClearance(new THREE.Vector3(x, y, z));
}

/**
 * Pod 3 (Giant Sovereign Alpha Royal Betta - Photo 1):
 * A solitary colossal Alpha Betta roaming on a grand, slow perimeter figure-8
 * connecting ALL 4 corners of the entire page!
 */
function getPerimeterBettaCircuit(s) {
  const t = s;
  let x = Math.sin(t) * 10.8;
  let y = Math.sin(t * 2.0) * 4.6;
  let z = Math.cos(t) * 2.8 - 1.0;

  return applyEarthSilhouetteClearance(new THREE.Vector3(x, y, z));
}

/**
 * Pod 4 (Deep Abyss Neon Glass Explorers - Photo 2):
 * Cruising deep in the background ocean ($Z \in [-4.5, -7.5]$) behind the Earth.
 */
function getDeepAbyssGlassCircuit(s) {
  const t = s;
  let x = Math.cos(t) * 11.2;
  let y = Math.sin(t * 1.5) * 2.4 - 0.4;
  let z = -5.2 + Math.sin(t) * 1.8;

  return new THREE.Vector3(x, y, z);
}

// ========================================================================
// 4. INDIVIDUAL AGENT RENDERERS WITH HYDRODYNAMICS
// ========================================================================

/**
 * Royal Blue Betta Agent (Photo 1)
 */
function RoyalBlueBettaAgent({ fish, pathFn, bodyGeom, tailGeom, ribbonGeom, eyeGeom }) {
  const groupRef = useRef();
  const tailRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      const speed = fish.speed || 0.15;
      const s = time * speed + fish.timeLag;
      const sAhead = s + 0.035;

      const pCenter = pathFn(s);
      const pAhead = pathFn(sAhead);

      const tangent = pAhead.clone().sub(pCenter).normalize();

      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const trueUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

      // Formed echelon position
      const formedPos = pCenter.clone()
        .addScaledVector(right, fish.formationX)
        .addScaledVector(trueUp, fish.formationY);

      groupRef.current.position.copy(formedPos);
      groupRef.current.lookAt(formedPos.clone().sub(tangent));

      // Dynamic banking
      const bankRoll = Math.sin(time * fish.swimFreq + fish.phase) * 0.08 - (right.y * 0.7);
      groupRef.current.rotateZ(bankRoll);
    }

    // Photo 1: Hypnotic silk veil tail ripple
    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * fish.swimFreq + fish.phase - 0.70) * 0.46;
      tailRef.current.rotation.z = Math.cos(time * (fish.swimFreq * 0.8) + fish.phase) * 0.12;
    }
  });

  return (
    <group ref={groupRef} scale={[fish.scale, fish.scale, fish.scale]}>
      {/* 1. Royal Blue Iridescent Fish Body (Photo 1) */}
      <mesh geometry={bodyGeom}>
        <meshStandardMaterial
          vertexColors
          roughness={0.22}
          metalness={0.65}
          emissive="#002b80"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* 2. Massive Flowing Veil Tail (Halfmoon Fan - Photo 1) */}
      <group ref={tailRef} position={[0, 0, -0.34]}>
        <mesh geometry={tailGeom}>
          <meshStandardMaterial
            vertexColors
            roughness={0.20}
            metalness={0.45}
            transparent
            opacity={0.92}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. Flowing Golden-Tipped Ventral Ribbon Fins (Photo 1) */}
      <mesh geometry={ribbonGeom} position={[0, 0, 0]}>
        <meshStandardMaterial
          vertexColors
          roughness={0.28}
          metalness={0.45}
          transparent
          opacity={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 4. Realistic Dark Marine Eyes */}
      <mesh geometry={eyeGeom} position={[0.046, 0.020, 0.28]}>
        <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh geometry={eyeGeom} position={[-0.046, 0.020, 0.28]}>
        <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

/**
 * Crystalline Neon Wireframe Glass Fish Agent (Photo 2)
 */
function CrystallineGlassFishAgent({ fish, pathFn, bodyGeom, wireframeGeom, finLinesGeom, eyeGeom }) {
  const groupRef = useRef();
  const tailRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (groupRef.current) {
      const speed = fish.speed || 0.16;
      const s = time * speed + fish.timeLag;
      const sAhead = s + 0.035;

      const pCenter = pathFn(s);
      const pAhead = pathFn(sAhead);

      const tangent = pAhead.clone().sub(pCenter).normalize();

      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const trueUp = new THREE.Vector3().crossVectors(right, tangent).normalize();

      const formedPos = pCenter.clone()
        .addScaledVector(right, fish.formationX)
        .addScaledVector(trueUp, fish.formationY);

      groupRef.current.position.copy(formedPos);
      groupRef.current.lookAt(formedPos.clone().sub(tangent));

      const bankRoll = Math.sin(time * fish.swimFreq + fish.phase) * 0.07 - (right.y * 0.65);
      groupRef.current.rotateZ(bankRoll);
    }

    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(time * fish.swimFreq + fish.phase - 0.75) * 0.44;
    }
  });

  return (
    <group ref={groupRef} scale={[fish.scale, fish.scale, fish.scale]}>
      {/* 1. Transparent Crystal Glass Body (Photo 2) */}
      <mesh geometry={bodyGeom}>
        <meshStandardMaterial
          color="#bae6fd"
          roughness={0.10}
          metalness={0.25}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Glowing Electric Cyan Wireframe Skeleton Lines (Photo 2) */}
      <lineSegments geometry={wireframeGeom}>
        <lineBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.82}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 3. Radiating Electric Cyan Fin Rays (Photo 2) */}
      <group ref={tailRef}>
        <lineSegments geometry={finLinesGeom}>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.88}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </lineSegments>
      </group>

      {/* 4. Glowing Golden-Amber Luminous Eye with Dark Pupil (Photo 2) */}
      <mesh position={[0.052, 0.020, 0.26]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.054, 0.020, 0.26]}>
        <sphereGeometry args={[0.010, 10, 10]} />
        <meshStandardMaterial color="#09090b" roughness={0.1} />
      </mesh>

      <mesh position={[-0.052, 0.020, 0.26]}>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-0.054, 0.020, 0.26]}>
        <sphereGeometry args={[0.010, 10, 10]} />
        <meshStandardMaterial color="#09090b" roughness={0.1} />
      </mesh>
    </group>
  );
}

// ========================================================================
// 5. MASTER FULL-PAGE FISH SYSTEM (ALL PODS & FORMATIONS)
// ========================================================================

function FullPageFishScene() {
  // Geometries for Species A (Betta - Photo 1)
  const bettaBodyGeom = useMemo(() => createBettaBodyGeometry(), []);
  const bettaTailGeom = useMemo(() => createBettaFlowingTailGeometry(), []);
  const bettaRibbonGeom = useMemo(() => createBettaRibbonFinGeometry(), []);

  // Geometries for Species B (Glass Wireframe - Photo 2)
  const glassBodyGeom = useMemo(() => createGlassFishBodyGeometry(), []);
  const glassWireframeGeom = useMemo(() => new THREE.WireframeGeometry(glassBodyGeom), [glassBodyGeom]);
  const glassFinLinesGeom = useMemo(() => createGlassFishFinLinesGeometry(), []);

  const eyeGeom = useMemo(() => new THREE.SphereGeometry(0.011, 10, 10), []);

  // -------------------------------------------------------------
  // POD 1: Royal Blue Betta Squadron (Photo 1) - Upper Realm
  // Arranged V-Formation: 1 Big Alpha, 2 Medium Flankers, 3 Small Escorts
  // -------------------------------------------------------------
  const upperBettaPod = useMemo(() => [
    // Big Alpha Leader
    { id: 'ub-0', scale: 2.30, formationX:  0.00, formationY:  0.00, timeLag:  0.00, speed: 0.15, swimFreq: 4.8, phase: 0.0 },
    // Medium Flankers
    { id: 'ub-1', scale: 1.45, formationX:  0.85, formationY:  0.18, timeLag: -0.16, speed: 0.15, swimFreq: 5.2, phase: 0.3 },
    { id: 'ub-2', scale: 1.45, formationX: -0.85, formationY: -0.18, timeLag: -0.16, speed: 0.15, swimFreq: 5.2, phase: 0.3 },
    // Small Escorts
    { id: 'ub-3', scale: 0.85, formationX:  1.70, formationY:  0.36, timeLag: -0.32, speed: 0.15, swimFreq: 5.6, phase: 0.6 },
    { id: 'ub-4', scale: 0.85, formationX: -1.70, formationY: -0.36, timeLag: -0.32, speed: 0.15, swimFreq: 5.6, phase: 0.6 },
    { id: 'ub-5', scale: 0.70, formationX:  0.00, formationY: -0.48, timeLag: -0.45, speed: 0.15, swimFreq: 5.8, phase: 0.9 },
  ], []);

  // -------------------------------------------------------------
  // POD 2: Crystalline Neon Wireframe Glass Fish (Photo 2) - Lower Realm
  // Arranged Echelon: 1 Large Glass Leader, 2 Medium, 3 Small
  // -------------------------------------------------------------
  const lowerGlassPod = useMemo(() => [
    // Large Glass Alpha
    { id: 'lg-0', scale: 1.85, formationX:  0.00, formationY:  0.00, timeLag:  0.00, speed: 0.16, swimFreq: 5.0, phase: 0.0 },
    // Medium Wing Cruisers
    { id: 'lg-1', scale: 1.20, formationX:  0.80, formationY:  0.16, timeLag: -0.15, speed: 0.16, swimFreq: 5.4, phase: 0.25 },
    { id: 'lg-2', scale: 1.20, formationX: -0.80, formationY: -0.16, timeLag: -0.15, speed: 0.16, swimFreq: 5.4, phase: 0.25 },
    // Small Followers
    { id: 'lg-3', scale: 0.70, formationX:  1.60, formationY:  0.30, timeLag: -0.30, speed: 0.16, swimFreq: 5.8, phase: 0.5 },
    { id: 'lg-4', scale: 0.70, formationX: -1.60, formationY: -0.30, timeLag: -0.30, speed: 0.16, swimFreq: 5.8, phase: 0.5 },
    { id: 'lg-5', scale: 0.60, formationX:  0.00, formationY: -0.42, timeLag: -0.42, speed: 0.16, swimFreq: 6.0, phase: 0.75 },
  ], []);

  // -------------------------------------------------------------
  // POD 3: Solitary Giant Sovereign Royal Betta (Photo 1) - Outer Perimeter
  // Colossal single Betta cruising the 4 corners of the full webpage
  // -------------------------------------------------------------
  const perimeterBetta = useMemo(() => [
    { id: 'pb-0', scale: 2.60, formationX: 0.0, formationY: 0.0, timeLag: 0.0, speed: 0.12, swimFreq: 4.4, phase: 0.0 },
  ], []);

  // -------------------------------------------------------------
  // POD 4: Deep Abyss Neon Glass Explorers (Photo 2) - Background Abyss
  // -------------------------------------------------------------
  const deepAbyssGlassPod = useMemo(() => [
    { id: 'dg-0', scale: 1.35, formationX:  0.00, formationY:  0.00, timeLag:  0.00, speed: 0.14, swimFreq: 4.8, phase: 0.0 },
    { id: 'dg-1', scale: 0.85, formationX:  0.75, formationY:  0.15, timeLag: -0.20, speed: 0.14, swimFreq: 5.2, phase: 0.3 },
    { id: 'dg-2', scale: 0.75, formationX: -0.75, formationY: -0.15, timeLag: -0.20, speed: 0.14, swimFreq: 5.2, phase: 0.3 },
  ], []);

  return (
    <group>
      {/* Lighting for Full-Screen Fish Showcase */}
      <ambientLight intensity={1.4} />
      <directionalLight position={[12, 16, 10]} intensity={1.8} color="#93c5fd" />
      <directionalLight position={[-12, -8, -6]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[0, -4, 4]} intensity={1.4} color="#0284c7" />
      <pointLight position={[8, 6, 4]} intensity={1.0} color="#fbbf24" />

      {/* POD 1: Upper Betta Squadron (Photo 1) */}
      {upperBettaPod.map((fish) => (
        <RoyalBlueBettaAgent
          key={fish.id}
          fish={fish}
          pathFn={getUpperBettaCircuit}
          bodyGeom={bettaBodyGeom}
          tailGeom={bettaTailGeom}
          ribbonGeom={bettaRibbonGeom}
          eyeGeom={eyeGeom}
        />
      ))}

      {/* POD 2: Lower Neon Glass Fish (Photo 2) */}
      {lowerGlassPod.map((fish) => (
        <CrystallineGlassFishAgent
          key={fish.id}
          fish={fish}
          pathFn={getLowerGlassFishCircuit}
          bodyGeom={glassBodyGeom}
          wireframeGeom={glassWireframeGeom}
          finLinesGeom={glassFinLinesGeom}
          eyeGeom={eyeGeom}
        />
      ))}

      {/* POD 3: Giant Sovereign Alpha Royal Betta (Photo 1) */}
      {perimeterBetta.map((fish) => (
        <RoyalBlueBettaAgent
          key={fish.id}
          fish={fish}
          pathFn={getPerimeterBettaCircuit}
          bodyGeom={bettaBodyGeom}
          tailGeom={bettaTailGeom}
          ribbonGeom={bettaRibbonGeom}
          eyeGeom={eyeGeom}
        />
      ))}

      {/* POD 4: Deep Abyss Glass Explorers (Photo 2) */}
      {deepAbyssGlassPod.map((fish) => (
        <CrystallineGlassFishAgent
          key={fish.id}
          fish={fish}
          pathFn={getDeepAbyssGlassCircuit}
          bodyGeom={glassBodyGeom}
          wireframeGeom={glassWireframeGeom}
          finLinesGeom={glassFinLinesGeom}
          eyeGeom={eyeGeom}
        />
      ))}
    </group>
  );
}

/**
 * Self-Contained Full-Page Swimming Fish School:
 * Renders a fixed full-screen 3D Three.js canvas across the entire webpage (100vw x 100vh).
 * Pointer events are disabled so all buttons, cards, globe dragging, and controls remain 100% interactive.
 */
export default function SwimmingFishSchool() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] overflow-hidden w-screen h-screen"
      style={{ pointerEvents: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 14], fov: 48 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
      >
        <FullPageFishScene />
      </Canvas>
    </div>
  );
}
