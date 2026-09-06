import React, { useState } from 'react';
import DataCharts from '../components/DataCharts';
import { 
  Layers, 
  Sparkles, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Compass, 
  Activity, 
  ShieldAlert, 
  Anchor, 
  Fish, 
  CloudLightning,
  CheckCircle2,
  TrendingDown,
  Info
} from 'lucide-react';

export default function AnalysisView({
  verticalProfile = [],
  depthProfileData = [],
  timeSeriesData = [],
  selectedStation,
  stations = [],
  onSelectStation,
  isLiveCopernicus = true
}) {
  const [activeAnalysisTopic, setActiveAnalysisTopic] = useState('thermocline');

  const st = selectedStation || stations[0] || {};

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-100 max-w-[1800px] mx-auto w-full px-3 py-2 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-950 text-purple-400 border border-purple-500/40 uppercase font-mono">
              Oceanographic Analysis & XAI
            </span>
            <span className="text-xs text-slate-400">• Stratification & Explainable AI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Vertical Stratification & Marine Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Deep-dive into ocean thermal layers, pycnocline density gradients, diurnal cycles, and explainable AI insights for fisheries and cyclone early warnings.
          </p>
        </div>

        {/* Current Active Station Indicator */}
        <div className="flex items-center gap-2.5 bg-[#060c18] border border-slate-800 p-2.5 rounded-xl text-xs">
          <div className="h-8 w-8 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-mono uppercase">Analyzing Station</span>
            <span className="text-white font-bold">{st.name || 'Coastal Radar CB01'}</span>
          </div>
        </div>
      </div>

      {/* 3 OPERATIONAL AI DECISION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. Potential Fishing Zones */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <Fish className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-950 text-teal-300 border border-teal-500/40">
                HIGH UPWELLING
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Potential Fishing Zone (PFZ) Advisory</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Thermal gradient at 45m depth indicates strong nutrient-rich upwelling. Pelagic fish species (Sardines, Mackerel, Tuna) congregate along this thermal front.
            </p>
          </div>
          <div className="text-[11px] font-mono text-teal-300 bg-[#060c18] p-2 rounded-lg border border-slate-800">
            Recommended Fishing Depth: <strong>20m — 60m</strong>
          </div>
        </div>

        {/* 2. Cyclone Heat Potential */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <CloudLightning className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                MODERATE TCHP
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Tropical Cyclone Heat Potential</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Upper ocean heat content calculated down to the 26°C isotherm. Mixed layer depth of 45m provides moderate energy buffer against rapid storm intensification.
            </p>
          </div>
          <div className="text-[11px] font-mono text-amber-300 bg-[#060c18] p-2 rounded-lg border border-slate-800">
            TCHP Index: <strong>68 kJ/cm² (Sub-Critical)</strong>
          </div>
        </div>

        {/* 3. Naval Sonar Channel */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-9 w-9 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/40">
                SOFAR CHANNEL
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Underwater Sonar Acoustic Duct</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Sound velocity profile (Mackenzie equation) reaches minimum near 900m, forming an acoustic waveguide where sound propagates thousands of kilometers.
            </p>
          </div>
          <div className="text-[11px] font-mono text-purple-300 bg-[#060c18] p-2 rounded-lg border border-slate-800">
            Sonic Layer Depth: <strong>~75m (Shadow Zone)</strong>
          </div>
        </div>

      </div>

      {/* FULL GRAPHICAL ANALYSIS (CHARTS) */}
      <div className="w-full">
        <DataCharts
          verticalProfile={verticalProfile}
          depthProfileData={depthProfileData}
          timeSeriesData={timeSeriesData}
          selectedStation={selectedStation}
          isLiveCopernicus={isLiveCopernicus}
        />
      </div>

    </div>
  );
}
