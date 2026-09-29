import React from 'react';
import { 
  Waves, 
  Globe2, 
  Sparkles, 
  Layers, 
  Radio, 
  Database, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  CloudLightning, 
  Wind,
  ShieldCheck,
  Activity,
  FileDown
} from 'lucide-react';

export function OceanLogo({ className = "w-6 h-6" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer subtle orbital navigation ring */}
      <circle cx="20" cy="20" r="17.5" stroke="url(#navLogoGrad1)" strokeWidth="1.6" strokeDasharray="3 2" opacity="0.65" />
      {/* 3D Earth Globe latitude & longitude contours */}
      <ellipse cx="20" cy="20" rx="14" ry="7.5" stroke="url(#navLogoGrad2)" strokeWidth="1.2" opacity="0.8" />
      <path d="M20 2.5V37.5" stroke="url(#navLogoGrad2)" strokeWidth="1.2" opacity="0.5" strokeDasharray="2 2" />
      {/* Dynamic Hydrodynamic Wave Crests (Ocean Currents) */}
      <path d="M7 23C11 19 14.5 25.5 19 22C23.5 18.5 27 24.5 33 20" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 27C13 24 16 28 20 25.5C24 23 27 27 30 25" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
      {/* Central Pulsing Oceanographic Beacon Core */}
      <circle cx="20" cy="20" r="2.8" fill="#38bdf8" />
      <circle cx="20" cy="20" r="5" stroke="#c084fc" strokeWidth="0.8" opacity="0.65" />
      <defs>
        <linearGradient id="navLogoGrad1" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38bdf8" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="navLogoGrad2" x1="6" y1="12" x2="34" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function NavigationSidebar({
  activeAspect,
  setActiveAspect,
  isCollapsed,
  setIsCollapsed,
  onOpenScienceTour,
  onOpenSettings,
  backendHealth,
  simulationScenario,
  setSimulationScenario
}) {
  const isLive = Boolean(backendHealth?.dataset_available);

  const aspects = [
    {
      id: '3d-twin',
      label: '3D Digital Twin',
      sublabel: 'Globe & Subsurface Column',
      icon: Globe2,
      badge: 'HERO',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'numerical-data',
      label: 'Ocean Model Data',
      sublabel: 'Copernicus GLORYS12V1 Grid',
      icon: Database,
      badge: 'SIMULATION',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'insitu-data',
      label: 'In-Situ Observation Data',
      sublabel: 'Argo Floats & Moored Buoys',
      icon: Radio,
      badge: 'LIVE SENSORS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'model-studio',
      label: 'Model vs In-Situ Validation',
      sublabel: 'Real-time Difference & Bias',
      icon: Sparkles,
      badge: 'ΔT VALIDATION',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      id: 'analytics',
      label: 'Depth Analysis & Curves',
      sublabel: 'CTD & Thermocline Stratification',
      icon: Layers,
      badge: 'CTD CAST',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    },
    {
      id: 'download-data',
      label: 'Download & Export Data',
      sublabel: 'NetCDF, CSV, GeoJSON & WMS',
      icon: FileDown,
      badge: 'EXPORT',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    }
  ];

  return (
    <aside 
      className={`shrink-0 flex flex-col justify-between h-screen sticky top-0 z-40 bg-[#090b14]/95 backdrop-blur-2xl border-r border-indigo-500/20 shadow-[10px_0_30px_rgba(99,102,241,0.06)] transition-all duration-300 select-none ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 1. TOP HEADER / BRAND */}
      <div className="flex flex-col border-b border-indigo-500/20">
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
              title="Expand Navigation Sidebar"
            >
              <OceanLogo className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 bg-slate-950 p-0.5 rounded-full border border-cyan-400/60 shadow-sm">
                <ChevronRight className="w-2.5 h-2.5 text-cyan-300" />
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-700 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                  <OceanLogo className="w-6 h-6" />
                </div>

                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-extrabold tracking-tight text-white font-sans">
                      Ocean<span className="text-cyan-400">3D</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 truncate">
                    3D Ocean Digital Twin
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-transparent hover:border-cyan-500/30 transition-all cursor-pointer"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Live Copernicus Connection Status Badge */}
        {!isCollapsed && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-cyan-500/20 text-[10.5px] font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-300 truncate max-w-[130px]">
                  {isLive ? 'GLORYS12V1 Live' : 'Copernicus Stream'}
                </span>
              </div>
              <span className="text-cyan-300 font-bold" title="Copernicus GLORYS12V1 NetCDF Grid: 0.49m to 11.40m | Extended Column: 2000m">
                0.49m — 11.4m
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN NAVIGATION ASPECTS */}
      <div className={`flex-1 overflow-y-auto py-4 flex flex-col gap-1.5 scrollbar-thin ${isCollapsed ? 'px-2' : 'px-2.5'}`}>
        {!isCollapsed && (
          <span className="px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
            Workspace Aspects
          </span>
        )}

        {aspects.map(aspect => {
          const Icon = aspect.icon;
          const isActive = activeAspect === aspect.id;

          return (
            <button
              key={aspect.id}
              type="button"
              onClick={() => setActiveAspect(aspect.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5'} rounded-xl text-left transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/15 text-white border border-indigo-400/50 shadow-lg shadow-indigo-500/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
              title={isCollapsed ? `${aspect.label} — ${aspect.sublabel}` : undefined}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}

              <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/35 ring-1 ring-white/20' 
                  : 'bg-slate-900 text-indigo-400 group-hover:text-indigo-300 group-hover:bg-slate-800'
              }`}>
                <Icon className="w-4 h-4" />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col truncate">
                    <span className={`text-xs font-bold font-sans truncate ${
                      isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    }`}>
                      {aspect.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans truncate">
                      {aspect.sublabel}
                    </span>
                  </div>

                  {aspect.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${aspect.badgeColor}`}>
                      {aspect.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* 3. SIMULATION SCENARIO QUICK SWITCHER */}
        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-indigo-500/20 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
              Simulation Scenario
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-xl border border-indigo-500/20 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setSimulationScenario('baseline')}
                className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  simulationScenario === 'baseline'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setSimulationScenario('cyclone')}
                className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  simulationScenario === 'cyclone'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cyclone
              </button>
              <button
                type="button"
                onClick={() => setSimulationScenario('monsoon')}
                className={`py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                  simulationScenario === 'monsoon'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monsoon
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM ACTION UTILITIES */}
      <div className="p-3 border-t border-indigo-500/20 flex flex-col gap-2 bg-[#080a13]/80">
        {/* 1-Click Guided Platform Tour Button */}
        <button
          type="button"
          onClick={onOpenScienceTour}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer ${
            isCollapsed ? 'p-2' : ''
          }`}
          title="Start 1-Click Interactive Guided Platform Tour"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-slate-950" />
          {!isCollapsed && <span className="font-extrabold uppercase tracking-wide">Guided Tour</span>}
        </button>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Open Settings"
        >
          <Settings className="w-4 h-4 text-slate-400 shrink-0" />
          {!isCollapsed && <span>Platform Settings</span>}
        </button>
      </div>
    </aside>
  );
}
