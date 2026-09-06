import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';

// Helper: Calculate ocean surface current velocity (u: Eastward, v: Northward) in m/s
// accurately modeling the seasonal Indian Ocean circulation system
export function getIndianOceanVelocity(
  lat, 
  lon, 
  timeHour = 0, 
  isCyclone = false, 
  cycloneCenter = { lat: 16.5, lon: 86.5 },
  isMonsoonUpwelling = false
) {
  let u = 0;
  let v = 0;

  if (isCyclone) {
    // Intense cyclonic counter-clockwise vortex centered at cycloneCenter
    const dLat = lat - cycloneCenter.lat;
    const dLon = (lon - cycloneCenter.lon) * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < 14.0 && dist > 0.4) {
      const vortexSpeed = Math.min(3.4, (14.0 - dist) * 0.32 + 0.6);
      // Counter-clockwise in Northern Hemisphere: tangent = (-dLat, dLon) / dist
      u = -(dLat / dist) * vortexSpeed;
      v = (dLon / dist) * vortexSpeed;
      return { u, v, speed: Math.sqrt(u * u + v * v) };
    }
  }

  if (isMonsoonUpwelling) {
    // High-speed offshore Ekman drift along Somali Coast and Southwest India
    if (lon >= 42 && lon <= 58 && lat >= -2 && lat <= 15) {
      u = 1.35; // Rapid northeastward jet
      v = 1.85;
      return { u, v, speed: Math.sqrt(u * u + v * v) };
    }
    if (lon >= 71 && lon <= 78 && lat >= 7 && lat <= 18) {
      u = -0.65; // Offshore drift into Arabian Sea
      v = -1.15; // Accelerated southward coastal current
      return { u, v, speed: Math.sqrt(u * u + v * v) };
    }
  }

  // 1. Somali Current & Jet (East Africa to Arabian Sea: lat -4° to 14°N, lon 42° to 56°E)
  if (lon >= 42 && lon <= 58 && lat >= -5 && lat <= 15) {
    const intensity = 1.0 + Math.sin((timeHour / 24) * Math.PI * 2) * 0.15;
    u = 0.65 * intensity;
    v = 1.25 * intensity; // Strong northeastward flow
  }
  // 2. Arabian Sea Great Whirl & Central Circulation (lat 8° to 22°N, lon 58° to 74°E)
  else if (lon >= 58 && lon <= 74 && lat >= 8 && lat <= 24) {
    const angle = Math.atan2(lat - 15, lon - 66);
    const r = Math.sqrt((lat - 15) ** 2 + (lon - 66) ** 2);
    if (r < 8) {
      // Clockwise summer gyre
      u = Math.sin(angle) * 0.7;
      v = -Math.cos(angle) * 0.6;
    } else {
      // General eastward drift
      u = 0.45;
      v = -0.15;
    }
  }
  // 3. West India Coastal Current (WICC: southward during summer, northward during winter)
  else if (lon >= 71 && lon <= 77 && lat >= 8 && lat <= 20) {
    u = -0.12;
    v = -0.55; // Southward coastal current
  }
  // 4. East India Coastal Current (EICC) & Bay of Bengal Gyre (lat 8° to 22°N, lon 80° to 94°E)
  else if (lon >= 80 && lon <= 96 && lat >= 6 && lat <= 23) {
    const angle = Math.atan2(lat - 15, lon - 88);
    // Southwest monsoon cyclonic circulation
    u = -Math.sin(angle) * 0.62;
    v = Math.cos(angle) * 0.58;
  }
  // 5. Equatorial Indian Ocean (Wyrtki Jets / Counter Current: lat -4° to +4°N, lon 55° to 95°E)
  else if (lat >= -4 && lat <= 4 && lon >= 50 && lon <= 98) {
    u = 0.85 + Math.cos((timeHour / 24) * Math.PI * 2) * 0.2; // Rapid eastward jet
    v = 0.05 * Math.sin(lon * 0.2);
  }
  // 6. South Equatorial Current (SEC: lat -8° to -20°S, lon 50° to 105°E)
  else if (lat <= -5 && lat >= -22 && lon >= 48 && lon <= 105) {
    u = -0.75; // Westward flow
    v = -0.08;
  }
  // 7. General Background Ocean Drift
  else {
    u = 0.25 * Math.sin(lat * 0.15);
    v = 0.20 * Math.cos(lon * 0.15);
  }

  // Avoid running directly into Indian mainland
  if (lat >= 8.5 && lat <= 23.0 && lon >= 73.5 && lon <= 85.0) {
    if (lon < 78.0) {
      u = -0.3; // Deflect west
    } else {
      u = 0.3; // Deflect east
    }
  }

  const speed = Math.sqrt(u * u + v * v);
  return { u, v, speed };
}

// Check if latitude/longitude is over Indian mainland
function isDryLand(lat, lon) {
  if (lat >= 8.2 && lat <= 23.5) {
    const west = 73.5 + (lat - 8.2) * 0.35;
    const east = 79.5 + (lat - 8.2) * 0.55;
    if (lon >= west && lon <= east) return true;
  }
  if (lat > 23.5 && lat < 34.0 && lon > 68.0 && lon < 90.0) return true;
  if (lat >= 12 && lat <= 30 && lon >= 38 && lon <= 55) return true; // Arabia interior
  return false;
}

export default function OceanFlowParticleSystem({
  particleCount = 550,
  isPlaying = true,
  speedMultiplier = 1.0,
  currentTimeHour = 0,
  isCyclone = false,
  cycloneCenter = { lat: 16.5, lon: 86.5 },
  isMonsoonUpwelling = false
}) {
  const lineMeshRef = useRef();

  // Initialize particles across the Indian Ocean basin
  const { particles, positions, colors } = useMemo(() => {
    const pList = [];
    const posArr = new Float32Array(particleCount * 2 * 3); // 2 vertices per line streak * (x,y,z)
    const colArr = new Float32Array(particleCount * 2 * 3); // 2 vertices per line streak * (r,g,b)

    for (let i = 0; i < particleCount; i++) {
      let lat = -22 + Math.random() * 46;
      let lon = 42 + Math.random() * 62;
      while (isDryLand(lat, lon)) {
        lat = -22 + Math.random() * 46;
        lon = 42 + Math.random() * 62;
      }

      const life = Math.random() * 1.0;
      const maxLife = 0.8 + Math.random() * 1.2;
      const trailLength = 0.045 + Math.random() * 0.035;

      pList.push({
        lat,
        lon,
        prevLat: lat,
        prevLon: lon,
        life,
        maxLife,
        trailLength
      });
    }

    return { particles: pList, positions: posArr, colors: colArr };
  }, [particleCount]);

  // Color mapping based on current speed (m/s)
  const getSpeedColor = (speed) => {
    if (speed > 1.2) return [0.98, 0.45, 0.08]; // Fast: Vivid orange/amber (#f97316)
    if (speed > 0.7) return [0.98, 0.80, 0.08]; // Medium-high: Gold/yellow (#facc15)
    if (speed > 0.4) return [0.22, 0.74, 0.97]; // Moderate: Cyan (#38bdf8)
    return [0.06, 0.52, 0.78]; // Calm: Deep sea sky blue
  };

  useFrame((_, delta) => {
    if (!lineMeshRef.current) return;

    const effectiveDelta = isPlaying ? Math.min(delta, 0.08) * (speedMultiplier || 1.0) : 0.001;
    const posAttr = lineMeshRef.current.geometry.attributes.position;
    const colAttr = lineMeshRef.current.geometry.attributes.color;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Fetch flow velocity at current coordinate
      const { u, v, speed } = getIndianOceanVelocity(p.lat, p.lon, currentTimeHour, isCyclone, cycloneCenter, isMonsoonUpwelling);

      p.prevLat = p.lat;
      p.prevLon = p.lon;

      // Advance particle in spherical coordinates
      const step = effectiveDelta * 8.0;
      p.lon += (u * step) / Math.max(0.2, Math.cos((p.lat * Math.PI) / 180));
      p.lat += v * step;

      p.life += effectiveDelta;

      // Respawn particle if expired or moved onto land or beyond Indian Ocean bounds
      if (
        p.life > p.maxLife ||
        p.lat < -26 ||
        p.lat > 27 ||
        p.lon < 40 ||
        p.lon > 105 ||
        isDryLand(p.lat, p.lon)
      ) {
        if (isCyclone && Math.random() < 0.65) {
          // Concentrate particles into cyclone vortex
          const r = 1.0 + Math.random() * 8.0;
          const th = Math.random() * Math.PI * 2;
          p.lat = cycloneCenter.lat + r * Math.sin(th);
          p.lon = cycloneCenter.lon + (r * Math.cos(th)) / Math.cos((p.lat * Math.PI) / 180);
        } else {
          p.lat = -22 + Math.random() * 46;
          p.lon = 42 + Math.random() * 60;
          while (isDryLand(p.lat, p.lon)) {
            p.lat = -22 + Math.random() * 46;
            p.lon = 42 + Math.random() * 60;
          }
        }
        p.prevLat = p.lat;
        p.prevLon = p.lon;
        p.life = 0;
        p.maxLife = 0.8 + Math.random() * 1.2;
      }

      // Compute 3D positions on the sphere surface (radius = 2.538)
      const headPos = latLonToVector3(p.lat, p.lon, 2.538);
      const tailPos = latLonToVector3(p.prevLat, p.prevLon, 2.538);

      const baseIdx = i * 6;
      posAttr.array[baseIdx] = tailPos.x;
      posAttr.array[baseIdx + 1] = tailPos.y;
      posAttr.array[baseIdx + 2] = tailPos.z;

      posAttr.array[baseIdx + 3] = headPos.x;
      posAttr.array[baseIdx + 4] = headPos.y;
      posAttr.array[baseIdx + 5] = headPos.z;

      // Dynamic alpha / color fading
      const [r, g, b] = getSpeedColor(speed);
      const lifeFrac = p.life / p.maxLife;
      const alpha = lifeFrac < 0.2 ? lifeFrac / 0.2 : (1 - lifeFrac);

      colAttr.array[baseIdx] = r * alpha * 0.4;
      colAttr.array[baseIdx + 1] = g * alpha * 0.4;
      colAttr.array[baseIdx + 2] = b * alpha * 0.4;

      colAttr.array[baseIdx + 3] = r * alpha;
      colAttr.array[baseIdx + 4] = g * alpha;
      colAttr.array[baseIdx + 5] = b * alpha;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineMeshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
        linewidth={1.5}
        depthWrite={false}
      />
    </lineSegments>
  );
}
