import React, { useState } from 'react';
import OceanScene from '../components/OceanScene';
import TimeControls from '../components/TimeControls';
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
  Wind,
  ChevronDown
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
  setDataSource,
  verticalExaggeration = 10,
  showIsosurface = false,
  isosurfaceTemp = 28.0
}) {
  const [activePreset, setActivePreset] = useState('CB01');

  // Camera region presets including Gliders
  const presets = [
    { id: 'CB01', name: 'Lakshadweep (CB01)', code: 'CB01', desc: 'Nine Degree Channel & Lagoons' },
    { id: 'BD08', name: 'Arabian Sea (BD08)', code: 'BD08', desc: 'Central Arabian Upwelling' },
    { id: 'BD11', name: 'Bay of Bengal (BD11)', code: 'BD11', desc: 'Monsoon Depressions' },
    { id: 'AD02', name: 'North Arabian (AD02)', code: 'AD02', desc: 'Gulf of Oman Front' },
    { id: 'ARGO-1844', name: 'South Shelf (Argo)', code: 'ARGO-1844', desc: 'Deep Ocean Profiler' },
    { id: 'TB05', name: 'Equatorial Jet (TB05)', code: 'TB05', desc: 'Tsunami Early Warning' },
    { id: 'GLIDER-INCOIS-01', name: 'Bay Glider (GL01)', code: 'GLIDER-INCOIS-01', desc: 'Autonomous Sawtooth Dive' },
    { id: 'GLIDER-NIOT-02', name: 'Arabian Glider (UG02)', code: 'GLIDER-NIOT-02', desc: 'Coastal Bio-Optical Profiler' },
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

      {/* TEMPORAL CONTROLS: TIME DIMENSION (AM/PM SYNCHRONIZED) */}
      <TimeControls
        currentTimeHour={currentTimeHour}
        setCurrentTimeHour={setCurrentTimeHour}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        startDate={startDate}
        endDate={endDate}
        station={selectedStation}
        dataSource={dataSource}
      />

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
              3D ocean circulation and subsurface water column exploration.
            </p>
          </div>
        </div>

        {/* Center: Quick Region / Station Focus Dropdown */}
        <div className="flex items-center gap-2 bg-[#060c18] px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider font-mono shrink-0 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-sky-400" /> Focus:
          </span>
          <div className="relative">
            <select
              value={selectedStation?.code || activePreset}
              onChange={(e) => {
                const targetCode = e.target.value;
                const foundPreset = presets.find(p => p.code === targetCode || p.id === targetCode);
                if (foundPreset) {
                  handleSelectPreset(foundPreset);
                } else {
                  const foundStn = stations.find(s => (s.code || s.id) === targetCode);
                  if (foundStn && onSelectStation) onSelectStation(foundStn);
                }
              }}
              className="bg-[#0e172a] hover:bg-[#14213d] text-white text-xs font-bold font-mono py-1.5 pl-3 pr-8 rounded-lg border border-sky-500/40 focus:border-sky-400 focus:outline-none transition-all cursor-pointer appearance-none shadow-inner"
            >
              {presets.map(p => (
                <option key={p.id} value={p.code} className="bg-[#0b1324] text-slate-200 py-1 font-sans">
                  {p.name} — {p.desc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-sky-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
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
            <button
              onClick={() => setPrimaryVariable('density')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                primaryVariable === 'density'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/40 ring-1 ring-pink-300'
                  : 'text-slate-400 hover:text-pink-300'
              }`}
            >
              <Activity className="h-3 w-3" />
              <span>Density</span>
            </button>
            <button
              onClick={() => setPrimaryVariable('chlorophyll')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                primaryVariable === 'chlorophyll'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/40 ring-1 ring-emerald-300'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>Chlorophyll</span>
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
          verticalExaggeration={verticalExaggeration}
          showIsosurface={showIsosurface}
          isosurfaceTemp={isosurfaceTemp}
        />
      </div>

    </div>
  );
}
