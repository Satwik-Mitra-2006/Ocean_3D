import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Generate procedural realistic high-res Earth texture with ocean bathymetry, distinct terrain and clear labels
function createEarthCanvasTexture(primaryVariable = 'sst', colorScale = 'turbo', opacity = 0.85) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // 1. Deep Ocean Base with realistic marine gradients
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#041527');     // Polar North
  oceanGrad.addColorStop(0.25, '#072445');  // Mid North
  oceanGrad.addColorStop(0.45, '#09315d');  // Arabian Sea & Bay of Bengal Deep Blue
  oceanGrad.addColorStop(0.55, '#072b52');  // Tropical Indian Ocean
  oceanGrad.addColorStop(0.8, '#06203d');   // Southern Indian Ocean
  oceanGrad.addColorStop(1, '#030f1c');     // Polar South
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function toX(lon) { return ((lon + 180) / 360) * canvas.width; }
  function toY(lat) { return ((90 - lat) / 180) * canvas.height; }

  // 2. Continental Shelf Shading (Glowing turquoise coastal waters around India & continents)
  const drawShelfGlow = (coords) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][0]), toY(coords[0][1]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][0]), toY(coords[i][1]));
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)';
    ctx.lineWidth = 26;
    ctx.stroke();
    ctx.restore();
  };

  // 3. Indian Subcontinent Coordinates
  const indiaCoords = [
    [68, 24], [70, 23], [72.5, 21.5], [72.8, 19], [73.5, 16], [74.5, 13.5], [76, 10.2], 
    [77.5, 8.1], // Kanyakumari (Southernmost tip)
    [78.5, 9.2], [79.8, 10.5], [80.3, 13], [82, 16], [85, 19.5], [87, 21.5], [88.5, 22.5], 
    [89.5, 24], [92, 26], [89, 27.5], [85, 28], [80, 31], [76, 33], [74, 34.5], 
    [72, 33], [70, 28], [68, 24]
  ];

  const sriLankaCoords = [
    [80, 9.8], [81.8, 8.5], [81.5, 6.5], [79.9, 7.2], [80, 9.8]
  ];

  const arabiaCoords = [
    [43, 13], [48, 14], [54, 17], [59, 22.5], [56, 26], [50, 29], [40, 28], [35, 28], [43, 13]
  ];

  const africaCoords = [
    [32, 31], [40, 30], [43, 13], [51, 11], [45, 1], [40, -5], [35, -15],
    [30, -30], [20, -34], [18, -33], [14, -22], [10, -5], [5, 5],
    [-15, 12], [-17, 15], [-5, 35], [10, 37], [25, 32], [32, 31]
  ];

  const seAsiaCoords = [
    [98, 8], [104, 1.5], [103, 14], [108, 16], [108, 21], [100, 20], [98, 8]
  ];

  // Draw coastal shelf glows
  drawShelfGlow(indiaCoords);
  drawShelfGlow(sriLankaCoords);
  drawShelfGlow(arabiaCoords);

  // Helper to draw filled landmass
  const drawLand = (coords, fillColor = '#163b28', strokeColor = '#38bdf8', lineWidth = 2) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0][0]), toY(coords[0][1]));
    for (let i = 1; i < coords.length; i++) {
      ctx.lineTo(toX(coords[i][0]), toY(coords[i][1]));
    }
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  };

  // Draw Neighboring continents
  drawLand(africaCoords, '#242b35', 'rgba(56, 189, 248, 0.5)', 1.5);
  drawLand(arabiaCoords, '#383226', 'rgba(250, 204, 21, 0.6)', 1.5); // Warm desert tone
  drawLand(seAsiaCoords, '#1b382b', 'rgba(56, 189, 248, 0.5)', 1.5);

  // Australia
  drawLand([
    [114, -22], [122, -15], [130, -12], [142, -11], [153, -28], [148, -38],
    [135, -35], [120, -35], [114, -28], [114, -22]
  ], '#3a2d22', 'rgba(56, 189, 248, 0.5)', 1.5);

  // Eurasia Context
  drawLand([
    [-9, 36], [0, 42], [10, 55], [30, 70], [60, 73], [100, 75], [140, 70], [170, 65],
    [160, 50], [140, 40], [122, 30], [105, 22], [75, 35], [50, 40], [30, 45], [-9, 36]
  ], '#1f2937', 'rgba(56, 189, 248, 0.35)', 1.2);

  // Madagascar
  drawLand([
    [44, -13], [50, -15], [47, -25], [43, -25], [44, -13]
  ], '#1e382b', '#38bdf8', 1.5);

  // 4. DRAW VIBRANT INDIA & SRI LANKA (Central Focal Point)
  // Rich topographic gradient for India
  const indiaGrad = ctx.createLinearGradient(toX(75), toY(34), toX(77), toY(8));
  indiaGrad.addColorStop(0, '#3f5647');   // Himalayas / North
  indiaGrad.addColorStop(0.3, '#214e32'); // Gangetic Plains
  indiaGrad.addColorStop(0.7, '#183d28'); // Deccan Plateau
  indiaGrad.addColorStop(1, '#1b4a30');   // Coastal South

  drawLand(indiaCoords, indiaGrad, '#67e8f9', 2.8); // Bright cyan glowing border
  drawLand(sriLankaCoords, '#1b4a30', '#67e8f9', 2.0);

  // Lakshadweep & Maldives Coral Atolls (Visual dots)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(toX(72.6), toY(10.5), 4, 0, Math.PI * 2);
  ctx.arc(toX(73.5), toY(4.2), 3, 0, Math.PI * 2);
  ctx.arc(toX(73.2), toY(0.5), 3, 0, Math.PI * 2);
  ctx.fill();

  // Andaman & Nicobar Islands (East of Bay of Bengal)
  ctx.beginPath();
  ctx.arc(toX(92.8), toY(12.0), 4, 0, Math.PI * 2);
  ctx.arc(toX(93.0), toY(10.0), 3.5, 0, Math.PI * 2);
  ctx.arc(toX(93.8), toY(7.0), 3, 0, Math.PI * 2);
  ctx.fill();

  // 5. EMBEDDED GEOGRAPHIC HIGH-RESOLUTION TYPOGRAPHY
  // Draws clear ocean and country labels directly onto the globe surface
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 🇮🇳 INDIA Label
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 8;
  ctx.fillText('INDIA', toX(78), toY(22));

  // 🌊 ARABIAN SEA
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(2, 132, 199, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText('ARABIAN SEA', toX(66), toY(16));
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
  ctx.fillText('0° - 25°N  •  60° - 75°E', toX(66), toY(18));

  // 🌊 BAY OF BENGAL
  ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(2, 132, 199, 0.9)';
  ctx.shadowBlur = 10;
  ctx.fillText('BAY OF BENGAL', toX(89), toY(15));
  ctx.font = '11px monospace';
  ctx.fillStyle = 'rgba(186, 230, 253, 0.8)';
  ctx.fillText('5° - 22°N  •  80° - 95°E', toX(89), toY(17));

  // 🌊 INDIAN OCEAN BASIN
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#7dd3fc';
  ctx.shadowColor = 'rgba(3, 105, 161, 0.9)';
  ctx.shadowBlur = 12;
  ctx.fillText('INDIAN OCEAN', toX(77), toY(-6));
  ctx.font = '12px monospace';
  ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.fillText('Equatorial Current System', toX(77), toY(-3.5));

  // Islands labels
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('Lakshadweep', toX(72.6), toY(8.8));
  ctx.fillText('Andaman & Nicobar', toX(94), toY(13.8));
  ctx.fillText('Sri Lanka', toX(81.5), toY(5.2));

  ctx.restore();

  // 6. Subtle Latitude / Longitude lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = toY(lat);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  // Equator line highlighted
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
  ctx.lineWidth = 1.5;
  const eqY = toY(0);
  ctx.beginPath();
  ctx.moveTo(0, eqY);
  ctx.lineTo(canvas.width, eqY);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function OceanGlobe({ 
  primaryVariable = 'sst', 
  colorScale = 'turbo', 
  opacity = 0.85,
  showCurrents = true 
}) {
  const globeRef = useRef();
  const earthTexture = useMemo(() => {
    return createEarthCanvasTexture(primaryVariable, colorScale, opacity);
  }, [primaryVariable, colorScale, opacity]);

  return (
    <group ref={globeRef}>
      {/* Core Ocean & Land Sphere */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.4}
          metalness={0.12}
        />
      </mesh>

      {/* Atmospheric Rim Glow */}
      <mesh scale={[1.025, 1.025, 1.025]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.10}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
