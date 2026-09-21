import React from 'react';
import { 
  CloudLightning, 
  Wind, 
  ShieldCheck, 
  RotateCcw, 
  AlertTriangle,
  Flame,
  Activity
} from 'lucide-react';

export default function SimulationControls({
  simulationScenario = 'baseline', // 'baseline' | 'cyclone' | 'monsoon'
  setSimulationScenario
}) {
  return (
    <div className="w-full bg-[#020814]/10 backdrop-blur-[2px] rounded-2xl p-3 border border-cyan-400/20 shadow-xl flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Title & Badge */}
      <div className="flex items-center gap-2.5">
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-md ${
          simulationScenario === 'cyclone'
            ? 'bg-rose-600 animate-pulse'
            : simulationScenario === 'monsoon'
              ? 'bg-purple-600'
              : 'bg-blue-600'
        }`}>
          {simulationScenario === 'cyclone' ? (
            <CloudLightning className="h-4 w-4" />
          ) : simulationScenario === 'monsoon' ? (
            <Wind className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-white uppercase tracking-wider">
              Ocean Scenario Engine:
            </span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase font-mono ${
              simulationScenario === 'cyclone'
                ? 'bg-rose-950 text-rose-300'
                : simulationScenario === 'monsoon'
                  ? 'bg-purple-950 text-purple-300'
                  : 'bg-emerald-950 text-emerald-300'
            }`}>
              {simulationScenario === 'cyclone' ? '🔴 Extreme Cat-4 Cyclone' : simulationScenario === 'monsoon' ? '🟣 SW Monsoon Upwelling' : '🟢 Copernicus Baseline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {simulationScenario === 'cyclone'
              ? 'Vortex spinning at 86.5°E, 16.5°N • Cold wake thermocline pumping • Wave surge 6.5m'
              : simulationScenario === 'monsoon'
                ? 'Strong offshore Ekman transport • Intense nutrient upwelling along Malabar & Somali coast'
                : 'Real-time GLORYS12V1 ocean reanalysis and in-situ buoy telemetry'}
          </p>
        </div>
      </div>

      {/* Scenario Action Buttons & Right Watermark */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSimulationScenario('baseline')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              simulationScenario === 'baseline'
                ? 'bg-[#0d9488] text-white shadow-[0_0_15px_rgba(13,148,136,0.4)] ring-1 ring-cyan-300/40'
                : 'bg-[#060c18]/80 hover:bg-[#101b34] text-slate-300'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
            <span>Baseline</span>
          </button>

          <button
            type="button"
            onClick={() => setSimulationScenario('cyclone')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              simulationScenario === 'cyclone'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-1 ring-rose-400'
                : 'bg-[#3b0d19]/80 hover:bg-[#451221] text-rose-300 border border-rose-500/30'
            }`}
          >
            <CloudLightning className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
            <span>Simulate Cat-4 Cyclone</span>
          </button>

          <button
            type="button"
            onClick={() => setSimulationScenario('monsoon')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              simulationScenario === 'monsoon'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 ring-1 ring-purple-400'
                : 'bg-[#250d45]/80 hover:bg-[#2e1065] text-purple-300 border border-purple-500/30'
            }`}
          >
            <Wind className="h-3.5 w-3.5 text-purple-400" />
            <span>SW Monsoon Upwelling</span>
          </button>

          {simulationScenario !== 'baseline' && (
            <button
              type="button"
              onClick={() => setSimulationScenario('baseline')}
              title="Reset to baseline"
              className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
