import React from 'react';
import { 
  Layers, 
  Thermometer, 
  Droplets, 
  Wind, 
  Waves, 
  Radio, 
  Sliders, 
  Palette, 
  RotateCcw, 
  ChevronDown,
  Info,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import { DEPTH_LEVELS, COLOR_SCALES, OCEAN_MODELS } from '../data/mockOceanData';

export default function Sidebar({
  layers,
  setLayers,
  selectedDepth,
  setSelectedDepth,
  opacity,
  setOpacity,
  colorScale,
  setColorScale,
  onResetView,
  selectedModel,
  setSelectedModel,
  primaryVariable,
  setPrimaryVariable,
  stations = [],
  selectedStation,
  onSelectStation
}) {
  const toggleLayer = (layerKey) => {
    setLayers(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const layerItems = [
    {
      key: 'sst',
      name: 'Sea Surface Temperature',
      short: 'SST (°C)',
      icon: Thermometer,
      activeColor: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      key: 'salinity',
      name: 'Ocean Salinity',
      short: 'SSS (PSU)',
      icon: Droplets,
      activeColor: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      key: 'currents',
      name: 'Ocean Currents',
      short: 'Velocity (m/s)',
      icon: Wind,
      activeColor: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      key: 'waves',
      name: 'Wave Height',
      short: 'Hs (m)',
      icon: Waves,
      activeColor: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    },
    {
      key: 'observations',
      name: 'In-Situ Observations',
      short: 'Buoys & Argo',
      icon: Radio,
      activeColor: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-4">
      {/* Main Layers Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Ocean Layers
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {Object.values(layers).filter(Boolean).length} Active
          </span>
        </div>

        {/* Layer Toggles */}
        <div className="mt-4 space-y-2">
          {layerItems.map(item => {
            const Icon = item.icon;
            const isEnabled = layers[item.key];
            const isPrimary = primaryVariable === item.key;

            return (
              <div
                key={item.key}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 ${
                  isEnabled 
                    ? 'bg-slate-50/90 border-slate-300/80 shadow-2xs' 
                    : 'bg-white border-slate-200/60 opacity-70 hover:opacity-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    toggleLayer(item.key);
                    if (!isEnabled) {
                      setPrimaryVariable(item.key);
                    }
                  }}
                  className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                >
                  <div className={`p-1.5 rounded-lg border ${isEnabled ? item.activeColor : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.short}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  {/* Primary view radio */}
                  {isEnabled && item.key !== 'observations' && (
                    <button
                      type="button"
                      title="Set as primary globe heat overlay"
                      onClick={() => setPrimaryVariable(item.key)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition-colors cursor-pointer ${
                        isPrimary
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {isPrimary ? 'ACTIVE' : 'HEAT'}
                    </button>
                  )}

                  {/* Toggle switch button */}
                  <button
                    type="button"
                    onClick={() => toggleLayer(item.key)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isEnabled ? 'text-sky-600 hover:bg-sky-50' : 'text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Depth Level Selector — REAL COPERNICUS DEPTHS ONLY */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1.5">
            <span>Ocean Depth Layer</span>
            <span className="font-mono text-sky-600 text-[11px] font-bold">
              {DEPTH_LEVELS.find(d => d.value === selectedDepth)?.label || `${selectedDepth} m`}
            </span>
          </label>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 mb-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-emerald-700 font-semibold">
              REAL DATA: 0.49 – 11.40 m (9 levels from Copernicus NetCDF)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {DEPTH_LEVELS.map(depth => (
              <button
                key={depth.id}
                type="button"
                onClick={() => setSelectedDepth(depth.value)}
                className={`px-1.5 py-1.5 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                  selectedDepth === depth.value
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {depth.value} m
              </button>
            ))}
          </div>
          <div className="mt-1 text-[9px] text-slate-400 font-mono">
            ⚠ Deeper data not loaded in current dataset
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Layer Opacity</span>
            <span className="font-mono text-xs font-bold text-sky-700">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
          />
        </div>

        {/* Color Scale Selector */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-slate-400" />
              Color Scale
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {COLOR_SCALES.find(c => c.id === colorScale)?.name.split(' ')[0]}
            </span>
          </div>

          <div className="space-y-1.5">
            {COLOR_SCALES.map(scale => (
              <button
                key={scale.id}
                type="button"
                onClick={() => setColorScale(scale.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                  colorScale === scale.id
                    ? 'border-sky-500 bg-sky-50/50 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-medium text-slate-700">
                  {scale.name.split(' ')[0]}
                </span>
                
                {/* Visual Color Bar Palette */}
                <div 
                  className="h-2.5 w-24 rounded-full overflow-hidden border border-black/10"
                  style={{
                    background: `linear-gradient(to right, ${scale.colors.join(', ')})`
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Reset View Button */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onResetView}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer active:scale-98"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            Reset 3D Camera View
          </button>
        </div>

      </div>

      {/* Model Selection Card (Requirement 10) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
            <Sliders className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Numerical Model Data
          </h2>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Active Simulation Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              {OCEAN_MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Grid: {OCEAN_MODELS.find(m => m.id === selectedModel)?.grid}</span>
              <span>Rate: {OCEAN_MODELS.find(m => m.id === selectedModel)?.updateRate}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Primary Variable
            </label>
            <select
              value={primaryVariable}
              onChange={(e) => setPrimaryVariable(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="sst">Sea Surface Temperature (SST)</option>
              <option value="salinity">Sea Surface Salinity (SSS)</option>
              <option value="currents">Current Velocity (u, v)</option>
              <option value="waves">Significant Wave Height (Hs)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 1-Click Station Quick Selector for Beginners */}
      {stations && stations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Radio className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Select Station / Buoy
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 mb-2.5">
            Click any buoy to inspect with Explainable AI:
          </p>

          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {stations.map(st => {
              const isSelected = selectedStation?.id === st.id;
              const statusColor = st.status === 'Active' ? 'bg-emerald-500' : st.status === 'Warning' ? 'bg-amber-500' : 'bg-rose-500';

              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStation && onSelectStation(st)}
                  className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-sky-50 border-sky-400/80 shadow-xs ring-1 ring-sky-300' 
                      : 'bg-slate-50/60 hover:bg-slate-100/80 border-slate-200/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
                    <div className="truncate">
                      <div className={`text-xs truncate ${isSelected ? 'font-bold text-sky-900' : 'font-semibold text-slate-800'}`}>
                        {st.code || st.name.split('—')[1] || st.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {st.region}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {st.baseTemp ?? st.temperature ?? 28}°C
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
