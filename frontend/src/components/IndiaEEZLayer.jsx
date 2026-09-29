import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import indiaEEZData from '../data/india_eez.json';
import { latLonToVector3 } from './ObservationMarker';

// Sector center anchors for informational 3D badges
const SECTOR_ANCHORS = [
  {
    id: 'EEZ_MAINLAND_WEST',
    name: 'Arabian Sea & Lakshadweep',
    lat: 14.5,
    lon: 69.8,
    area: '850,000 km²',
    zone: 'West Coast Exclusive Economic Zone',
    keyAspect: 'Monsoon Upwelling & High-Salinity Water (ASHSW)'
  },
  {
    id: 'EEZ_MAINLAND_EAST',
    name: 'Bay of Bengal',
    lat: 14.0,
    lon: 84.5,
    area: '660,000 km²',
    zone: 'East Coast Exclusive Economic Zone',
    keyAspect: 'Tropical Cyclone Heat Potential & Low Salinity Plumes'
  },
  {
    id: 'EEZ_ANDAMAN_NICOBAR',
    name: 'Andaman & Nicobar Islands',
    lat: 10.0,
    lon: 94.0,
    area: '600,000 km²',
    zone: 'Island Archipelago Maritime Zone',
    keyAspect: 'Subduction Trench & Deep Ocean Equatorial Jets'
  }
];

export default function IndiaEEZLayer({
  visible = true,
  showBadges = true,
  onSelectSector
}) {
  const lineGroupRef = useRef();

  // Convert GeoJSON polygon coordinates to 3D Cartesian vectors
  const boundaryMeshes = useMemo(() => {
    if (!indiaEEZData || !indiaEEZData.features) return [];

    return indiaEEZData.features.map((feature) => {
      const coords = feature.geometry.coordinates[0];
      const points = coords.map(([lon, lat]) => latLonToVector3(lat, lon, 2.542));
      
      // Close the loop if not already closed
      if (coords.length > 0) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          points.push(latLonToVector3(first[1], first[0], 2.542));
        }
      }

      // Razor-Sharp Vector Boundary Line Loop
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color('#38bdf8'), // Vibrant Sky Cyan
        transparent: true,
        opacity: 0.92,
        depthWrite: false
      });
      const line = new THREE.LineLoop(geometry, lineMaterial);

      return {
        id: feature.properties.id,
        name: feature.properties.name,
        area: feature.properties.area_km2,
        line
      };
    });
  }, []);

  // Subtle breathing pulse for EEZ boundary line
  useFrame(({ clock }) => {
    if (!lineGroupRef.current || !visible) return;
    const t = clock.getElapsedTime();
    const pulse = 0.82 + Math.sin(t * 2.0) * 0.18;
    boundaryMeshes.forEach(({ line }) => {
      if (line && line.material) line.material.opacity = pulse;
    });
  });

  if (!visible) return null;

  return (
    <group ref={lineGroupRef}>
      {boundaryMeshes.map((meshGroup) => (
        <primitive key={meshGroup.id} object={meshGroup.line} />
      ))}
    </group>
  );
}
