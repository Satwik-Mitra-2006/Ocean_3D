import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import OceanGlobe from './OceanGlobe';
import ObservationMarker, { latLonToVector3 } from './ObservationMarker';
import Copernicus3DLayer from './Copernicus3DLayer';
import OceanCrossSection from './OceanCrossSection';
import Legend from './Legend';
import { 
  Rotate3d, 
  Maximize2, 
  Compass, 
  Database,
  Box,
  Globe2,
  Thermometer,
  Droplets,
  Wind,
  Waves,
  Info,
  MapPin
} from 'lucide-react';

export default function OceanScene({
  stations = [],
  gridPoints = [],
  selectedStation,
  onSelectStation,
  onSelectGridPoint,
  layers,
  selectedDepth = 0.49,
  opacity,
  colorScale,
  primaryVariable,
  currentTimeHour,
  resetTrigger,
  availableDepths = []
}) {
  const controlsRef = useRef();
  const [viewMode, setViewMode] = useState('cross-section'); // 'globe' | 'cross-section'
  const [crossSectionMode, setCrossSectionMode] = useState('temperature');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef();

  // Compute real data ranges for each parameter (localized to selected buoy or whole basin)
  const dataRanges = useMemo(() => {
    if (selectedStation) {
      const baseT = selectedStation.baseTemp ?? selectedStation.temperature ?? 28.5;
      const baseS = selectedStation.baseSalinity ?? selectedStation.salinity ?? 35.2;
      const baseV = selectedStation.baseSpeed ?? selectedStation.current_speed ?? 0.85;

      // Realistic localized vertical depth variation (0.49m to 11.4m)
      const tempMin = +(baseT - 0.45).toFixed(2);
      const tempMax = +(baseT + 0.15).toFixed(2);
      const tempMean = +(baseT).toFixed(2);

      const salMin = +(baseS - 0.15).toFixed(2);
      const salMax = +(baseS + 0.35).toFixed(2);
      const salMean = +(baseS).toFixed(2);

      const spdMin = +(Math.max(0.05, baseV - 0.20)).toFixed(2);
      const spdMax = +(baseV + 0.30).toFixed(2);
      const spdMean = +(baseV).toFixed(2);

      const denMin = +(1000 + 0.8 * salMin - 0.0065 * (tempMax - 4) * (tempMax - 4)).toFixed(2);
      const denMax = +(1000 + 0.8 * salMax - 0.0065 * (tempMin - 4) * (tempMin - 4)).toFixed(2);
      const denMean = +(((denMin + denMax) / 2)).toFixed(2);

      return {
        temperature: { min: tempMin, max: tempMax, mean: tempMean },
        salinity: { min: salMin, max: salMax, mean: salMean },
        currents: { min: spdMin, max: spdMax, mean: spdMean },
        density: { min: denMin, max: denMax, mean: denMean }
      };
    }

    const defaultStats = {
      temperature: { min: 25.71, max: 30.30, mean: 28.32 },
      salinity: { min: 32.10, max: 36.80, mean: 34.57 },
      currents: { min: 0.05, max: 1.85, mean: 0.48 },
      density: { min: 1021.2, max: 1026.5, mean: 1023.8 }
    };

    if (!gridPoints || gridPoints.length === 0) {
      return defaultStats;
    }

    const tempVals = gridPoints.map(p => p.temperature).filter(v => typeof v === 'number' && !isNaN(v));
    const salVals = gridPoints.map(p => p.salinity).filter(v => typeof v === 'number' && !isNaN(v));
    const spdVals = gridPoints.map(p => 
      p.current_speed ?? Math.sqrt((p.u_current || 0) ** 2 + (p.v_current || 0) ** 2)
    ).filter(v => typeof v === 'number' && !isNaN(v));
    const denVals = gridPoints.map(p => {
      const T = p.temperature ?? 28;
      const S = p.salinity ?? 35;
      return 1000 + 0.8 * S - 0.0065 * (T - 4) * (T - 4);
    }).filter(v => typeof v === 'number' && !isNaN(v));

    const calcStats = (arr, fallback) => {
      if (!arr || arr.length === 0) return fallback;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = sum / arr.length;
      return { min, max, mean };
    };

    return {
      temperature: calcStats(tempVals, defaultStats.temperature),
      salinity: calcStats(salVals, defaultStats.salinity),
      currents: calcStats(spdVals, defaultStats.currents),
      density: calcStats(denVals, defaultStats.density)
    };
  }, [gridPoints, selectedStation]);

  const activeRange = dataRanges[crossSectionMode] || dataRanges.temperature;
  const depthMin = availableDepths.length > 0 ? Math.min(...availableDepths) : 0.49;
  const depthMax = availableDepths.length > 0 ? Math.max(...availableDepths) : 11.40;

  // Switch camera when viewMode changes
  useEffect(() => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    const controls = controlsRef.current;

    if (viewMode === 'cross-section') {
      camera.position.set(7.2, 5.0, 7.8);
      controls.target.set(0, -0.6, 0);
    } else {
      camera.position.set(0, 1.4, 5.8);
      controls.target.set(0, 0, 0);
    }
    controls.update();
  }, [viewMode]);

  // When selected station changes, fly/focus camera towards it on Globe view
  useEffect(() => {
    if (viewMode === 'globe' && selectedStation && controlsRef.current) {
      const lat = selectedStation.lat ?? selectedStation.latitude ?? 15.0;
      const lon = selectedStation.lon ?? selectedStation.longitude ?? 72.0;

      // Rotate camera to focus on this coordinate in our group orientation
      const controls = controlsRef.current;
      const camera = controls.object;

      if (lon < 75) {
        // Arabian Sea station
        camera.position.set(-1.2, 1.3, 5.0);
        controls.target.set(-0.3, 0.2, 0);
      } else if (lon > 82) {
        // Bay of Bengal station
        camera.position.set(1.4, 1.3, 5.0);
        controls.target.set(0.4, 0.2, 0);
      } else {
        // Central Indian Ocean / South coast
        camera.position.set(0, 1.0, 5.2);
        controls.target.set(0, 0.1, 0);
      }
      controls.update();
    }
  }, [selectedStation, viewMode]);

  // Handle camera reset trigger
  useEffect(() => {
    if (controlsRef.current && resetTrigger) {
      controlsRef.current.reset();
      if (viewMode === 'cross-section') {
        controlsRef.current.object.position.set(7.2, 5.0, 7.8);
        controlsRef.current.target.set(0, -0.6, 0);
      } else {
        controlsRef.current.object.position.set(0, 1.4, 5.8);
        controlsRef.current.target.set(0, 0, 0);
      }
    }
  }, [resetTrigger, viewMode]);

  // Camera preset navigation for globe
  const setCameraPreset = (preset) => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    const controls = controlsRef.current;

    switch (preset) {
      case 'india':
        camera.position.set(0, 1.4, 4.6);
        controls.target.set(0, 0.4, 0);
        break;
      case 'arabian-sea':
        camera.position.set(-1.6, 1.3, 4.4);
        controls.target.set(-0.5, 0.3, 0);
        break;
      case 'bay-of-bengal':
        camera.position.set(1.6, 1.3, 4.4);
        controls.target.set(0.5, 0.3, 0);
        break;
      case 'indian-ocean':
      default:
        camera.position.set(0, 0.8, 5.5);
        controls.target.set(0, -0.3, 0);
        break;
    }
    controls.update();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const modeUnits = {
    temperature: '°C',
    salinity: 'PSU',
    density: 'kg/m³',
    currents: 'm/s'
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[580px] lg:h-[660px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-sky-950 border border-slate-700/60 shadow-2xl select-none"
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 1.4, 5.8], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.15} />
        <directionalLight position={[8, 7, 6]} intensity={1.9} color="#ffffff" />
        <pointLight position={[-8, -4, -5]} intensity={0.6} color="#38bdf8" />

        <Stars radius={80} depth={40} count={1200} factor={2.5} saturation={0.5} fade speed={0.5} />

        {viewMode === 'cross-section' ? (
          <OceanCrossSection 
            mode={crossSectionMode} 
            gridPoints={gridPoints}
            selectedDepth={selectedDepth}
            availableDepths={availableDepths}
            dataRange={activeRange}
            selectedStation={selectedStation}
          />
        ) : (
          <group rotation={[0.08, 3.35, 0]}>
            {/* 1. Realistic India & Indian Ocean Globe */}
            <OceanGlobe
              primaryVariable={primaryVariable}
              colorScale={colorScale}
              opacity={opacity}
              showCurrents={layers.currents}
            />

            {/* 2. Real Copernicus Marine 3D NetCDF Grid Points */}
            <Copernicus3DLayer
              gridPoints={gridPoints}
              primaryVariable={primaryVariable}
              colorScale={colorScale}
              opacity={opacity}
              showCurrents={layers.currents}
              visible={layers.sst || layers.salinity || layers.currents}
              selectedDepth={selectedDepth}
              onSelectPoint={onSelectGridPoint}
            />

            {/* 3. In-Situ Observation Stations with generous hit-targets */}
            {layers.observations && (selectedStation ? [selectedStation] : stations).map((station) => (
              <ObservationMarker
                key={station.id}
                station={station}
                isSelected={selectedStation?.id === station.id}
                onSelect={onSelectStation}
                currentTimeHour={currentTimeHour}
              />
            ))}
          </group>
        )}

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3.5}
          maxDistance={14.0}
          rotateSpeed={0.65}
          zoomSpeed={0.8}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>

      {/* TOP HEADER: View Mode Switcher */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
        <div className="flex items-center gap-1 bg-slate-950/95 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-2xl pointer-events-auto">
          <button
            type="button"
            onClick={() => setViewMode('cross-section')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'cross-section'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>Station Water Column</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('globe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'globe'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* HUD Controls Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setAutoRotate(prev => !prev)}
          title={autoRotate ? "Pause Orbit" : "Auto Orbit"}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all flex items-center gap-1 cursor-pointer ${
            autoRotate
              ? 'bg-sky-500/90 text-white border-sky-400 shadow-md shadow-sky-500/20'
              : 'bg-slate-900/70 text-slate-200 border-white/10 hover:bg-slate-900/90'
          }`}
        >
          <Rotate3d className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{autoRotate ? 'Rotating' : 'Orbit'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (controlsRef.current) {
              controlsRef.current.reset();
              if (viewMode === 'cross-section') {
                controlsRef.current.object.position.set(7.2, 5.0, 7.8);
                controlsRef.current.target.set(0, -0.6, 0);
              } else {
                controlsRef.current.object.position.set(0, 1.4, 5.8);
                controlsRef.current.target.set(0, 0, 0);
              }
            }
          }}
          title="Reset Camera"
          className="p-2 rounded-xl text-xs font-semibold bg-slate-900/70 text-slate-200 border border-white/10 hover:bg-slate-900/90 backdrop-blur-md transition-all cursor-pointer"
        >
          <Compass className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 rounded-xl text-xs font-semibold bg-slate-900/70 text-slate-200 border border-white/10 hover:bg-slate-900/90 backdrop-blur-md transition-all cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* 1-Click Station Quick-Selector Bar (Available in both Globe & Cutaway Views) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl max-w-[95%] overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider font-mono whitespace-nowrap flex items-center gap-1">
          <MapPin className="h-3 w-3 text-emerald-400" />
          Select Station:
        </span>
        {stations.map(st => {
          let code = st.code;
          if (!code) {
            const n = st.name || '';
            if (n.includes('BD08')) code = 'BD08';
            else if (n.includes('AD02')) code = 'AD02';
            else if (n.includes('2901844') || n.includes('ARGO') || n.includes('Argo')) code = 'ARGO-1844';
            else if (n.includes('CB01')) code = 'CB01';
            else if (n.includes('BD11')) code = 'BD11';
            else if (n.includes('TB05')) code = 'TB05';
            else if (n.includes('—')) code = n.split('—')[1]?.trim();
            else code = st.id;
          }
          const isSel = selectedStation?.id === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStation && onSelectStation(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSel
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30 scale-105 ring-2 ring-white/30'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/10'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isSel ? 'bg-slate-950' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{code}</span>
            </button>
          );
        })}
      </div>

      {/* ================= CUTAWAY VIEW ACTIVE COLUMN BANNER ================= */}
      {viewMode === 'cross-section' && selectedStation && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 bg-slate-950/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-sky-400/40 shadow-2xl text-xs text-white max-w-[90%] truncate">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider shrink-0">
            Active Water Column:
          </span>
          <span className="font-bold text-sky-300 font-mono truncate">
            {selectedStation.code || selectedStation.name}
          </span>
          <span className="text-slate-500 shrink-0">•</span>
          <span className="text-slate-300 text-[11px] truncate shrink-0">
            {selectedStation.region}
          </span>
        </div>
      )}

      {/* ================= GLOBE VIEW CONTROLS ================= */}
      {viewMode === 'globe' && (
        <>
          {/* Dynamic Live Station & Colormap Legend */}
          <Legend 
            primaryVariable={primaryVariable} 
            colorScale={colorScale} 
            layers={layers} 
            selectedStation={selectedStation}
          />

          {/* Bottom Guide Bar */}
          <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] shadow-lg text-slate-200 pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
                <span className="font-semibold text-slate-300">● Copernicus Grid Dots</span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 animate-pulse" />
                <span className="font-semibold text-emerald-300">📍 Observation Buoys (Click to view live telemetry)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= OVERLAYS FOR 3D CUTAWAY VIEW ================= */}
      {viewMode === 'cross-section' && (
        <>
          {/* LEFT OVERLAYS: Real Data Color Scale */}
          <div className="absolute top-16 left-3.5 z-20 flex flex-col gap-2.5 pointer-events-none max-w-[190px]">
            {/* REAL DATA BADGE */}
            <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-emerald-500/50 shadow-xl text-white pointer-events-auto">
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                REAL COPERNICUS DATA
              </div>
              <div className="text-[9px] text-slate-300 font-mono mt-1 leading-relaxed">
                <div>Depth: <strong className="text-emerald-300">{depthMin.toFixed(2)} – {depthMax.toFixed(2)} m</strong></div>
                <div>Points: <strong className="text-sky-300">{gridPoints.length || 64}</strong> grid cells</div>
                <div className="text-amber-400/90 text-[8px] mt-0.5">Deeper data not loaded</div>
              </div>
            </div>

            {/* Active Parameter Color Scale */}
            <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-white/15 shadow-xl text-white pointer-events-auto">
              <div className="text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                {crossSectionMode === 'temperature' && <Thermometer className="h-3 w-3 text-rose-400" />}
                {crossSectionMode === 'salinity' && <Droplets className="h-3 w-3 text-amber-400" />}
                {crossSectionMode === 'currents' && <Wind className="h-3 w-3 text-cyan-400" />}
                {crossSectionMode === 'density' && <Waves className="h-3 w-3 text-purple-400" />}
                {crossSectionMode.toUpperCase()} ({modeUnits[crossSectionMode]})
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-24 rounded-md shadow-inner border border-white/20 ${
                  crossSectionMode === 'temperature' 
                    ? 'bg-gradient-to-t from-blue-950 via-cyan-500 via-yellow-400 to-rose-500'
                    : crossSectionMode === 'salinity'
                    ? 'bg-gradient-to-t from-indigo-950 via-cyan-500 to-amber-400'
                    : crossSectionMode === 'density'
                    ? 'bg-gradient-to-t from-purple-950 via-indigo-500 to-rose-400'
                    : 'bg-gradient-to-t from-slate-900 via-blue-700 to-cyan-400'
                }`} />
                <div className="flex flex-col justify-between h-24 text-[9px] font-mono text-slate-200">
                  <span className="font-bold text-rose-300">{activeRange.max.toFixed(2)}</span>
                  <span className="text-slate-400">{activeRange.mean.toFixed(2)}</span>
                  <span className="font-bold text-cyan-300">{activeRange.min.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT OVERLAYS: Parameter Switcher + Stats */}
          <div className="absolute top-16 right-3.5 z-20 flex flex-col gap-2.5 pointer-events-auto max-w-[210px]">
            {/* PARAMETER SWITCHER */}
            <div className="bg-slate-950/95 backdrop-blur-md p-2.5 rounded-xl border border-white/15 shadow-2xl text-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                PARAMETER (NETCDF VAR)
              </span>
              <div className="space-y-1">
                {[
                  { id: 'temperature', label: 'Temperature', var: 'thetao', color: 'text-rose-400', icon: <Thermometer className="h-3 w-3" /> },
                  { id: 'salinity', label: 'Salinity', var: 'so', color: 'text-amber-400', icon: <Droplets className="h-3 w-3" /> },
                  { id: 'density', label: 'Calc. Density', var: 'derived', color: 'text-purple-400', icon: <Waves className="h-3 w-3" /> },
                  { id: 'currents', label: 'Currents', var: 'uo + vo', color: 'text-cyan-400', icon: <Wind className="h-3 w-3" /> }
                ].map(param => (
                  <button
                    key={param.id}
                    type="button"
                    onClick={() => setCrossSectionMode(param.id)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between gap-1 ${
                      crossSectionMode === param.id
                        ? 'bg-white/15 text-white ring-1 ring-white/30 font-bold shadow-xs'
                        : `${param.color} hover:bg-white/5`
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {param.icon}
                      <span>{param.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-mono text-slate-400">{param.var}</span>
                      {crossSectionMode === param.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* REAL DATA STATS BOX */}
            <div className="bg-slate-950/90 backdrop-blur-md p-2.5 rounded-xl border border-white/15 shadow-xl text-white">
              <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono flex items-center justify-between">
                <span>DATA RANGE (REAL)</span>
                <span className="text-[9px] text-sky-400 font-bold">{modeUnits[crossSectionMode]}</span>
              </div>
              
              {selectedStation ? (
                <div className="text-[9px] text-amber-300 font-mono font-bold pb-1.5 border-b border-white/10 mb-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>📍 {selectedStation.code || selectedStation.name}</span>
                </div>
              ) : (
                <div className="text-[9px] text-slate-400 font-mono pb-1 border-b border-white/10 mb-1">
                  🌍 Basin-Wide Average
                </div>
              )}

              <div className="text-[10px] text-slate-300 space-y-0.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Min:</span>
                  <span className="text-cyan-300 font-bold">{activeRange.min.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max:</span>
                  <span className="text-rose-300 font-bold">{activeRange.max.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mean:</span>
                  <span className="text-emerald-300 font-bold">{activeRange.mean.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
