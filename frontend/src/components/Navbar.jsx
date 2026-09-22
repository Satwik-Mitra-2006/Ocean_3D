import React, { useState } from 'react';
import { 
  Waves, 
  Globe2, 
  Radio, 
  Layers, 
  Settings, 
  User, 
  Activity, 
  Database,
  X,
  Award,
  ShieldCheck,
  Cpu,
  Download,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  onOpenIngest,
  onOpenScienceTour,
  backendHealth, 
  pointsCount = 0,
  activeStation = null
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isLive = Boolean(backendHealth?.dataset_available);
  const datasetId = backendHealth?.metadata?.dataset_id || 'cmems_mod_glo_phy_my_0.083deg_P1D-m';

  const aspectTitles = {
    '3d-twin': '3D Digital Twin (Globe & Subsurface)',
    'model-studio': 'Model vs In-Situ Validation Studio',
    'analytics': 'Depth & CTD Stratification Analytics',
    'insitu-data': 'In-Situ Observation Fleet & Sensor Telemetry',
    'observations': 'In-Situ Observation Fleet & Sensor Telemetry',
    'numerical-data': 'Numerical Ocean Model (Copernicus GLORYS12V1)',
    'download-data': 'Data Download & Export Center'
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#090b14]/85 backdrop-blur-md border-b border-indigo-500/25 shadow-[0_4px_20px_rgba(0,0,0,0.4)] text-white">
        <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
          
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Waves className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Ocean<span className="text-indigo-400">3D</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                  SIH'26
                </span>
              </div>
            </div>
          </div>

          {/* Center: Active Aspect Breadcrumb & Telemetry Badge */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs font-mono shadow-inner">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
              <span className="text-indigo-300 font-bold tracking-wide">
                {aspectTitles[activeTab] || '3D Digital Twin'}
              </span>
              {activeStation && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="text-amber-400 font-bold">Stn: {activeStation.code || activeStation.name}</span>
                  <span className="text-slate-400 text-[11px]">({activeStation.temperature || '30.1'}°C)</span>
                </>
              )}
            </div>
          </div>

          {/* Right: Connection Status & Controls */}
          <div className="flex items-center gap-2">

            {/* Science Tour Mode Button (Outreach) */}
            <button
              type="button"
              onClick={onOpenScienceTour}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Interactive Science Storytelling & Public Outreach"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Tour</span>
            </button>

            {/* Ingest Data Button */}
            <button
              type="button"
              onClick={onOpenIngest}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Upload NetCDF / CSV or Connect OPeNDAP"
            >
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span>Ingest</span>
            </button>

            {/* Connection Status */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-[#051a14]/80 text-emerald-300 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Copernicus Live Feed</span>
            </div>

            <div className="h-5 w-px bg-indigo-500/20 hidden sm:block" />

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenSettings}
                title="Platform Settings & NetCDF Config"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Interactive User Avatar Button */}
              <button
                onClick={() => setIsProfileOpen(true)}
                title="User Profile & System Specs"
                className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/25 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <User className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* ================= USER / SCIENTIST PROFILE & OPERATOR MODAL ================= */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010814]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#03152c]/90 backdrop-blur-xl border border-cyan-400/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-cyan-400/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 font-bold">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Ocean Analyst Profile</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead Researcher & Marine Intelligence Operator
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-cyan-900/40 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Operator Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#02132b]/60 p-3 rounded-xl border border-cyan-400/20">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Organization</span>
                <span className="font-semibold text-slate-200">MoES / INCOIS & Copernicus</span>
              </div>
              <div className="bg-[#02132b]/60 p-3 rounded-xl border border-cyan-400/20">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Access Tier</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Level-4 Reanalysis
                </span>
              </div>
              <div className="bg-[#02132b]/60 p-3 rounded-xl border border-cyan-400/20">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Active Region</span>
                <span className="font-semibold text-sky-300">Indian Ocean, Arabian Sea & Bay of Bengal</span>
              </div>
              <div className="bg-[#02132b]/60 p-3 rounded-xl border border-cyan-400/20">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Real Depth Range</span>
                <span className="font-semibold text-amber-300">0.49 m to 11.40 m (9 Levels)</span>
              </div>
            </div>

            {/* What this Platform Does */}
            <div className="bg-[#02132b]/60 p-4 rounded-xl border border-cyan-400/20 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sparkles className="h-3.5 w-3.5" /> Platform Capabilities
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-sky-400 mt-0.5">•</span>
                  <span><strong>Real NetCDF Processing:</strong> FastAPI backend lazily slices real 262MB Copernicus Marine dataset.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span><strong>3D Ocean Model Cutaway:</strong> Volumetric water column visualization of temperature, salinity, currents, and calculated density.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span><strong>Explainable AI (XAI):</strong> Plain-language environmental risk diagnosis for fishermen and coastal disaster teams.</span>
                </li>
              </ul>
            </div>

            {/* Close / OK button */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </>
  );
}
