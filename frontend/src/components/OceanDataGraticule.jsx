import React, { useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVector3 } from './ObservationMarker';

// Bounding Domain for Copernicus GLORYS12V1 North Indian Ocean NetCDF Grid
// Longitude: 50°E to 100°E | Latitude: -10°S to 25°N
const LAT_STEPS = [
  { lat: 20, label: '20° N', showBadge: true },
  { lat: 10, label: '10° N', showBadge: true },
  { lat: 0, label: '0° [Equator]', isEquator: true, showBadge: true },
  { lat: -2, label: '-2° S', isJet: true, showBadge: false }, // Line only, no clutter badge
  { lat: -10, label: '10° S', showBadge: true }
];

const LON_GRID = [50, 60, 70, 80, 90, 100];
// Only label 3 primary meridians to eliminate crowd
const LON_LABELS = [
  { lon: 60, label: '60° E' },
  { lon: 80, label: '80° E' },
  { lon: 100, label: '100° E' }
];

export default function OceanDataGraticule({ 
  visible = true,
  showVectors = true,
  opacity = 0.85
}) {
  // 1. Build Geographic Latitude Curve Segments
  const latLineMeshes = useMemo(() => {
    return LAT_STEPS.map((step) => {
      const points = [];
      for (let lon = 50; lon <= 100; lon += 1.0) {
        points.push(latLonToVector3(step.lat, lon, 2.537));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const isSpecial = step.isEquator || step.isJet;
      const material = new THREE.LineBasicMaterial({
        color: isSpecial ? new THREE.Color('#38bdf8') : new THREE.Color('#64748b'),
        transparent: true,
        opacity: isSpecial ? 0.65 : 0.25,
        linewidth: 1,
        depthWrite: false
      });
      return {
        ...step,
        line: new THREE.Line(geometry, material),
        anchorWest: latLonToVector3(step.lat, 48.5, 2.54)
      };
    });
  }, []);

  // 2. Build Geographic Longitude Meridian Segments
  const lonLineMeshes = useMemo(() => {
    return LON_GRID.map((lon) => {
      const points = [];
      for (let lat = -10; lat <= 25; lat += 1.0) {
        points.push(latLonToVector3(lat, lon, 2.537));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color('#64748b'),
        transparent: true,
        opacity: 0.22,
        linewidth: 1,
        depthWrite: false
      });
      return new THREE.Line(geometry, material);
    });
  }, []);

  // 3. Build Outer Boundary Rectangle Loop (50°E - 100°E, -10°S - 25°N)
  const boundaryLoop = useMemo(() => {
    const points = [];
    for (let lon = 50; lon <= 100; lon += 1.5) points.push(latLonToVector3(25, lon, 2.538));
    for (let lat = 25; lat >= -10; lat -= 1.5) points.push(latLonToVector3(lat, 100, 2.538));
    for (let lon = 100; lon >= 50; lon -= 1.5) points.push(latLonToVector3(-10, lon, 2.538));
    for (let lat = -10; lat <= 25; lat += 1.5) points.push(latLonToVector3(lat, 50, 2.538));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#0284c7'), // Clean deep sky cyan
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    return new THREE.LineLoop(geometry, material);
  }, []);

  // 4. Directional Equatorial Jet Flow Arrows (Sleek, low-density: only 7 arrows)
  const vectorArrows = useMemo(() => {
    if (!showVectors) return [];
    const arrows = [];
    // Equatorial eastward jets (Wyrtki Jet)
    for (let lon of [58, 66, 74, 82, 90, 96]) {
      const origin = latLonToVector3(-1.0, lon, 2.539);
      const nextPt = latLonToVector3(-1.0, lon + 1.8, 2.539);
      const dir = nextPt.clone().sub(origin).normalize();
      arrows.push({
        id: `jet-${lon}`,
        origin,
        dir,
        length: 0.055,
        color: '#10b981' // Emerald
      });
    }
    // Somali Current
    for (let item of [{ lat: 10, lon: 56 }, { lat: 14, lon: 60 }]) {
      const origin = latLonToVector3(item.lat, item.lon, 2.539);
      const nextPt = latLonToVector3(item.lat + 1.2, item.lon + 1.2, 2.539);
      const dir = nextPt.clone().sub(origin).normalize();
      arrows.push({
        id: `somali-${item.lat}`,
        origin,
        dir,
        length: 0.050,
        color: '#38bdf8'
      });
    }
    return arrows;
  }, [showVectors]);

  if (!visible) return null;

  return (
    <group name="ocean-data-graticule">
      {/* 1. Outer NetCDF Domain Bounding Line */}
      <primitive object={boundaryLoop} />

      {/* 2. Latitude Curves */}
      {latLineMeshes.map((m, idx) => (
        <primitive key={`lat-${idx}`} object={m.line} />
      ))}

      {/* 3. Longitude Meridians */}
      {lonLineMeshes.map((line, idx) => (
        <primitive key={`lon-${idx}`} object={line} />
      ))}

      {/* 4. Directional Current Flow Arrows */}
      {vectorArrows.map((a) => (
        <arrowHelper
          key={a.id}
          args={[a.dir, a.origin, a.length, a.color, 0.018, 0.012]}
        />
      ))}

      {/* 5. Minimal, Ultra-Sleek Scientific Coordinate Labels (Zero Bulk, Fixed Pixel Size) */}
      {/* West Latitude Labels Only (No duplicate east side!) */}
      {latLineMeshes.filter(m => m.showBadge).map((m) => (
        <Html
          key={`label-w-${m.label}`}
          position={m.anchorWest}
          center
          zIndexRange={[10, 0]}
        >
          <div className="pointer-events-none select-none px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/50 text-[7.5px] font-mono text-slate-300 whitespace-nowrap shadow-xs backdrop-blur-xs">
            <span className={m.isEquator ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
              {m.label}
            </span>
          </div>
        </Html>
      ))}

      {/* South Longitude Meridian Labels: 3 Essential Reference Points */}
      {LON_LABELS.map((item) => (
        <Html
          key={`label-s-${item.label}`}
          position={latLonToVector3(-11.0, item.lon, 2.54)}
          center
          zIndexRange={[10, 0]}
        >
          <div className="pointer-events-none select-none px-1.5 py-0.5 rounded bg-slate-950/80 border border-slate-700/50 text-[7.5px] font-mono text-slate-300 whitespace-nowrap shadow-xs backdrop-blur-xs">
            {item.label}
          </div>
        </Html>
      ))}
    </group>
  );
}
