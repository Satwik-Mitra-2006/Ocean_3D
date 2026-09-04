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
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings, 
  backendHealth, 
  pointsCount = 0 
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isLive = Boolean(backendHealth?.dataset_available);
  const datasetId = backendHealth?.metadata?.dataset_id || 'cmems_mod_glo_phy_my_0.083deg_P1D-m';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: '3d-ocean', label: '3D Ocean', icon: Globe2 },
    { id: 'observations', label: 'Observations', icon: Radio },
    { id: 'model-data', label: 'Model Data', icon: Database },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
              <Waves className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Ocean<span className="text-sky-400">3D</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-950 text-sky-300 border border-sky-500/40">
                  SIH 2026
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 tracking-wide">
                Ocean Visualization Platform
              </p>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Connection Status & Controls */}
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
              isLive 
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
              <span className="font-bold">
                {isLive ? 'Copernicus Live' : 'Demo Mode'}
              </span>
              {isLive && pointsCount > 0 && (
                <span className="hidden lg:inline text-[10px] text-emerald-400 font-mono">
                  | {pointsCount} 3D Points
                </span>
              )}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

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
                title="User Profile & SIH Presentation Guide"
                className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-sky-500/25 border border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <User className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* ================= USER / SCIENTIST PROFILE & OPERATOR MODAL ================= */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white relative flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 font-bold">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Ocean Analyst Profile</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/40">
                      SIH 2026
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lead Researcher & Marine Intelligence Operator
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Operator Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Organization</span>
                <span className="font-semibold text-slate-200">MoES / INCOIS & Copernicus</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Access Tier</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Level-4 Reanalysis
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Active Region</span>
                <span className="font-semibold text-sky-300">Indian Ocean, Arabian Sea & Bay of Bengal</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1">Real Depth Range</span>
                <span className="font-semibold text-amber-300">0.49 m to 11.40 m (9 Levels)</span>
              </div>
            </div>

            {/* What this Platform Does */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
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
