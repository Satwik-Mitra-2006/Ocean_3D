import React, { useState } from 'react';
import OceanScene from '../components/OceanScene';
import SimulationControls from '../components/SimulationControls';
import { 
  Globe2, 
  Box, 
  Layers, 
  Compass, 
  Radio, 
  Sparkles, 
  Eye, 
  Maximize2,
  Sliders,
  Thermometer,
  Droplets,
  Activity,
  Wind
} from 'lucide-react';

export default function Ocean3DView({
  stations = [],
  gridPoints = [],
  selectedStation,
  onSelectStation,
  layers,
  setLayers,
  selectedDepth,
  setSelectedDepth,
  opacity,
  colorScale,
  primaryVariable,
  setPrimaryVariable,
  currentTimeHour,
  setCurrentTimeHour,
  availableDepths = [],
  isPlaying = true,
  setIsPlaying,
  simulationScenario = 'baseline',
  setSimulationScenario,
  startDate = '2026-06-17',
  endDate = '2026-06-23',
  selectedDate = '2026-06-23',
  setSelectedDate,
  dataSource = 'model',
  setDataSource
}) {
  const [activePreset, setActivePreset] = useState('CB01');

  // Camera region presets
  const presets = [
    { id: 'CB01', name: 'Lakshadweep (CB01)', code: 'CB01', desc: 'Nine Degree Channel & Lagoons' },
    { id: 'BD08', name: 'Arabian Sea (BD08)', code: 'BD08', desc: 'Central Arabian Upwelling' },
    { id: 'BD11', name: 'Bay of Bengal (BD11)', code: 'BD11', desc: 'Monsoon Depressions' },
    { id: 'AD02', name: 'North Arabian (AD02)', code: 'AD02', desc: 'Gulf of Oman Front' },
    { id: 'ARGO-1844', name: 'South Shelf (Argo)', code: 'ARGO-1844', desc: 'Deep Ocean Profiler' },
    { id: 'TB05', name: 'Equatorial Jet (TB05)', code: 'TB05', desc: 'Tsunami Early Warning' },
  ];

  const handleSelectPreset = (p) => {
    setActivePreset(p.code);
    const found = stations.find(s => s.code === p.code || s.id === p.id);
    if (found && onSelectStation) {
      onSelectStation(found);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 text-slate-100 max-w-[1920px] mx-auto w-full px-3 py-1 select-none animate-in fade-in duration-300">
      
      {/* SCENARIO ENGINE: CYCLONE & MONSOON SIMULATOR */}
      {setSimulationScenario && (
        <SimulationControls
          simulationScenario={simulationScenario}
          setSimulationScenario={setSimulationScenario}
        />
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="bg-[#0b1325]/95 border border-slate-800/90 rounded-2xl px-4 py-3 shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Left: View Title & Description */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                3D Ocean Volumetric Explorer
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/40 uppercase font-mono">
                Copernicus GLORYS12V1
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 3D Digital Twin (Surface Circulation) + 3D Subsurface Water Column (0.49m - 11.40m Copernicus Depth)
            </p>
          </div>
        </div>

        {/* Center: Quick Region / Station Bookmarks */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full md:max-w-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mr-1 shrink-0 flex items-center gap-1">
            <Compass className="h-3 w-3 text-sky-400" /> Focus:
          </span>
          {presets.map(p => {
            const isSel = selectedStation?.code === p.code;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold ring-1 ring-blue-300'
                    : 'bg-[#060c18] hover:bg-[#0f1b34] text-slate-300 border border-slate-800'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* Right: Parameter Quick Chips */}
        {setPrimaryVariable && (
          <div className="flex items-center gap-1 bg-[#060c18] p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setPrimaryVariable('thetao')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                primaryVariable === 'thetao'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Thermometer className="h-3 w-3" />
              <span>Temp (°C)</span>
            </button>
            <button
              onClick={() => setPrimaryVariable('so')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                primaryVariable === 'so'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Droplets className="h-3 w-3" />
              <span>Salinity</span>
            </button>
            <button
              onClick={() => setPrimaryVariable('uo')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                primaryVariable === 'uo' || primaryVariable === 'current_speed'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wind className="h-3 w-3" />
              <span>Currents</span>
            </button>
          </div>
        )}

      </div>

      {/* DUAL 3D VIEWPORT CONTAINER */}
      <div className="flex-1 w-full min-h-[640px] flex flex-col">
        <OceanScene
          stations={stations}
          gridPoints={gridPoints}
          selectedStation={selectedStation}
          onSelectStation={onSelectStation}
          layers={layers || {}}
          selectedDepth={selectedDepth}
          setSelectedDepth={setSelectedDepth}
          opacity={opacity}
          colorScale={colorScale}
          primaryVariable={primaryVariable}
          setPrimaryVariable={setPrimaryVariable}
          currentTimeHour={currentTimeHour}
          setCurrentTimeHour={setCurrentTimeHour}
          availableDepths={availableDepths}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isCyclone={simulationScenario === 'cyclone'}
          isMonsoonUpwelling={simulationScenario === 'monsoon'}
          startDate={startDate}
          endDate={endDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          dataSource={dataSource}
          setDataSource={setDataSource}
        />
      </div>

    </div>
  );
}
