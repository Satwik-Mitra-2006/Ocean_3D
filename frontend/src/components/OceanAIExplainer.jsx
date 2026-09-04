import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Fish, 
  Ship, 
  CloudRain, 
  ChevronRight,
  HelpCircle,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';

/**
 * Generates scientific, beginner-friendly Explainable AI insights
 * based on physical ocean parameters (SST, Salinity, Current, Waves).
 */
export function generateOceanExplanation(stationOrPoint) {
  if (!stationOrPoint) return null;

  const temp = stationOrPoint.currentTemp ?? stationOrPoint.temperature ?? stationOrPoint.baseTemp ?? 28.0;
  const salinity = stationOrPoint.currentSalinity ?? stationOrPoint.salinity ?? stationOrPoint.baseSalinity ?? 35.0;
  const speed = stationOrPoint.currentSpeed ?? stationOrPoint.current_speed ?? stationOrPoint.baseSpeed ?? 1.0;
  const wave = stationOrPoint.currentWave ?? stationOrPoint.baseWave ?? 1.8;
  const name = stationOrPoint.name || 'Selected Ocean Coordinate';
  const region = stationOrPoint.region || 'Indian Ocean Basin';

  // 1. Cyclone & Heat Content Assessment
  let cycloneRisk = 'Low';
  let cycloneColor = 'emerald';
  let cycloneText = 'Ocean surface temperature is below the 28°C threshold. Low atmospheric convection energy.';
  if (temp >= 29.0) {
    cycloneRisk = 'High Potential';
    cycloneColor = 'rose';
    cycloneText = `SST is very warm (${temp}°C > 28.5°C). High Ocean Thermal Energy (TCHP) acts as fuel for cyclonic disturbances.`;
  } else if (temp >= 28.0) {
    cycloneRisk = 'Moderate Watch';
    cycloneColor = 'amber';
    cycloneText = `SST is ${temp}°C, exceeding the 28°C convective trigger. Favorable for monsoon low-pressure formation.`;
  }

  // 2. Salinity & River Runoff Analysis
  let salinityState = 'Normal Marine';
  let salinityText = `Standard open ocean salinity (${salinity} PSU). Good thermohaline stability.`;
  if (salinity < 33.0) {
    salinityState = 'Freshwater Influx (Low)';
    salinityText = `Low salinity (${salinity} PSU). Heavy river runoff (Ganga-Brahmaputra in Bay of Bengal) creates a buoyant barrier layer.`;
  } else if (salinity > 36.0) {
    salinityState = 'High Evaporative (Saline)';
    salinityText = `Elevated salinity (${salinity} PSU) characteristic of Arabian Sea due to high evaporation and low precipitation.`;
  }

  // 3. Navigation & Fishermen Safety
  let safetyStatus = 'Safe for all vessels';
  let safetyBadge = 'Green (Normal)';
  let safetyColor = 'emerald';
  if (wave >= 2.5 || speed >= 1.5) {
    safetyStatus = 'Rough Sea Warning';
    safetyBadge = 'Caution (Rough)';
    safetyColor = 'rose';
  } else if (wave >= 1.8 || speed >= 1.0) {
    safetyStatus = 'Moderate Sea State';
    safetyBadge = 'Advisory (Moderate)';
    safetyColor = 'amber';
  }

  // Common Beginner Q&A Presets
  const faqs = [
    {
      q: 'Why is this ocean data important?',
      a: 'Ocean temperatures and currents directly control the Indian Monsoon, cyclone intensity, and fish migration. Monitoring these helps disaster authorities (NDRF/IMD) and fishermen save lives.'
    },
    {
      q: `Why is temperature ${temp}°C significant?`,
      a: temp >= 28.0
        ? `Water above 28°C evaporates rapidly, creating moist updrafts that form monsoon depressions and cyclones across Bay of Bengal and Arabian Sea.`
        : `Water below 28°C helps stabilize coastal temperatures and indicates healthy ocean upwelling bringing nutrients from the deep.`
    },
    {
      q: `What does salinity ${salinity} PSU mean?`,
      a: salinity < 34.0
        ? `Bay of Bengal receives 1.6 trillion cubic meters of river freshwater annually, making it much less salty than the Arabian Sea. This traps heat at the surface.`
        : `Arabian Sea has high salinity (35-37 PSU) because dry desert winds cause immense evaporation without large incoming freshwater rivers.`
    },
    {
      q: 'Is this area safe for fishing right now?',
      a: wave > 2.2 
        ? `⚠️ Caution: Waves are ${wave}m high with ${speed} m/s currents. Small traditional fishing boats should remain near coastal shelters.`
        : `✅ Safe: Current speed (${speed} m/s) and wave height (${wave}m) are within standard operational limits for mechanized and small craft.`
    }
  ];

  return {
    name,
    region,
    temp,
    salinity,
    speed,
    wave,
    cycloneRisk,
    cycloneColor,
    cycloneText,
    salinityState,
    salinityText,
    safetyStatus,
    safetyBadge,
    safetyColor,
    faqs
  };
}

export default function OceanAIExplainer({ stationOrPoint, onClose }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const data = generateOceanExplanation(stationOrPoint);

  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 border border-indigo-500/30 shadow-xl relative overflow-hidden">
      {/* Decorative AI Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <BrainCircuit className="h-4 w-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Explainable AI (XAI)
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-cyan-300 border border-indigo-400/30">
                  MoES Intelligent Assistant
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Plain language physical ocean analysis for {data.name}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main 3 Scientific Insights Grid */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
        
        {/* Card 1: Cyclone & Monsoon Heat */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <CloudRain className="h-3.5 w-3.5 text-amber-400" />
                Thermal Energy
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.cycloneRisk.includes('High') 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                  : data.cycloneRisk.includes('Moderate')
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {data.cycloneRisk}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mt-1.5">
              {data.cycloneText}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-white/5 flex justify-between">
            <span>SST Value:</span>
            <strong className="text-white font-bold">{data.temp}°C</strong>
          </div>
        </div>

        {/* Card 2: Salinity & Fresh Water Inflow */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Fish className="h-3.5 w-3.5 text-teal-400" />
                Water Mass & Salinity
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {data.salinityState.split(' ')[0]}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mt-1.5">
              {data.salinityText}
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-white/5 flex justify-between">
            <span>Salinity:</span>
            <strong className="text-white font-bold">{data.salinity} PSU</strong>
          </div>
        </div>

        {/* Card 3: Marine Navigation & Fishermen Safety */}
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <Ship className="h-3.5 w-3.5 text-sky-400" />
                Maritime Advisory
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                data.safetyBadge.includes('Rough')
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {data.safetyBadge.split(' ')[0]}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug mt-1.5">
              {data.safetyStatus} — Wave height {data.wave}m with {data.speed} m/s drift velocity.
            </p>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-white/5 flex justify-between">
            <span>Drift Speed:</span>
            <strong className="text-white font-bold">{data.speed} m/s</strong>
          </div>
        </div>

      </div>

      {/* Interactive Beginner Q&A Section */}
      <div className="mt-3.5 pt-3 border-t border-white/10 relative z-10">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 mb-2">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Ask Explainable AI (Click any question to understand):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {data.faqs.map((faq, idx) => {
            const isSelected = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className={`rounded-xl border transition-all text-xs cursor-pointer ${
                  isSelected 
                    ? 'bg-indigo-950/90 border-cyan-400/80 shadow-md shadow-cyan-500/10' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                }`}
                onClick={() => setActiveFaq(isSelected ? null : idx)}
              >
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-100 flex items-center gap-1.5 text-[11px]">
                    <MessageSquare className="h-3 w-3 text-cyan-400 shrink-0" />
                    {faq.q}
                  </span>
                  <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-cyan-400' : ''}`} />
                </div>
                {isSelected && (
                  <div className="px-2.5 pb-2.5 pt-1 text-[11px] text-cyan-100/90 leading-relaxed border-t border-white/10 bg-indigo-950/40 rounded-b-xl">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
