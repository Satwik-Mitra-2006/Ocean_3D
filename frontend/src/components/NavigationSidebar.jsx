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
      id: 'model-studio',
      label: 'Model vs In-Situ',
      sublabel: 'Real-time Validation Studio',
      icon: Sparkles,
      badge: 'ΔT -0.26°',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    {
      id: 'analytics',
      label: 'Depth Analytics',
      sublabel: 'CTD & Thermocline Curves',
      icon: Layers,
      badge: 'CTD 4D',
      badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30'
    },
    {
      id: 'insitu-data',
      label: 'In-Situ Data',
      sublabel: 'Argo Floats & Moored Buoys',
      icon: Radio,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      id: 'numerical-data',
      label: 'Ocean Model Data',
      sublabel: 'Indian Ocean Computer Model',
      icon: Database,
      badge: 'SIMULATION',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'download-data',
      label: 'Download Data',
      sublabel: 'Export NetCDF, CSV & JSON',
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
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Waves className="h-5 w-5 stroke-[2.4]" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-extrabold tracking-tight text-white font-sans">
                    Ocean<span className="text-indigo-400">3D</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold">
                    SIH'26
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate">
                  3D Ocean Digital Twin
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-900 border border-transparent hover:border-indigo-500/30 transition-all cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Live Copernicus Connection Status Badge */}
        {!isCollapsed && (
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/70 border border-indigo-500/20 text-[10.5px] font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-slate-300 truncate max-w-[130px]">
                  {isLive ? 'GLORYS12V1 Live' : 'Copernicus Stream'}
                </span>
              </div>
              <span className="text-indigo-400 font-bold">0-2000m</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MAIN NAVIGATION ASPECTS */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 flex flex-col gap-1.5 scrollbar-thin">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/15 text-white border border-indigo-400/50 shadow-lg shadow-indigo-500/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
              title={isCollapsed ? aspect.label : undefined}
            >
              {/* Active Left Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}

              <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/35' 
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
        {/* Judge 1-Click Science Tour Button */}
        <button
          type="button"
          onClick={onOpenScienceTour}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer ${
            isCollapsed ? 'p-2' : ''
          }`}
          title="Start 1-Click Guided Science Tour for Judges"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-slate-950" />
          {!isCollapsed && <span className="font-extrabold uppercase tracking-wide">Judge Tour</span>}
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
