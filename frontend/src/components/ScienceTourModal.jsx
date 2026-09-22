import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Compass, 
  Waves, 
  Thermometer, 
  Radio, 
  Activity, 
  X, 
  Globe2,
  GraduationCap
} from 'lucide-react';

const TOUR_CHAPTERS = [
  {
    id: 'thermocline',
    title: "1. The Ocean's Hidden Thermocline",
    subtitle: 'Thermal Stratification from Surface to 2000m Depth',
    icon: Thermometer,
    badge: 'Vertical Structure',
    color: 'from-amber-500 to-rose-600',
    description: "Tropical surface ocean waters are warmed by solar radiation up to 30°C. But just 150 meters below, temperatures plummet rapidly into the 'Thermocline', reaching a near-freezing 3.5°C in the deep abyssal layers. This boundary prevents surface and deep waters from freely mixing.",
    keyFacts: [
      'Upper Mixed Layer: 0 to 40 meters (~29°C uniform)',
      'Thermocline Layer: Rapid temperature drop from 28°C down to 12°C',
      'Abyssal Abyss: 1000m to 2000m (perpetual near-freezing at 3°C to 4°C)'
    ],
    recommendedPreset: 'CB01'
  },
  {
    id: 'gliders-argo',
    title: '2. Autonomous Gliders & Argo Floats',
    subtitle: 'How Underwater Robotic Fleets Sample the Seas',
    icon: Radio,
    badge: 'Autonomous Sensing',
    color: 'from-emerald-500 to-cyan-600',
    description: "Instead of burning fuel with propellers, autonomous ocean gliders pump oil between internal and external bladders to change their buoyancy. This allows them to glide up and down in a 'sawtooth' trajectory from the surface to 1000m depth, measuring temperature, salinity, and chlorophyll continuously for months.",
    keyFacts: [
      'Sawtooth Dive Profile: Yo-yo cycles between 0.5m and 1000m',
      'Satellite Telemetry: Surfacing every 6-12 hours to beam data via Iridium',
      'Bio-Optical Fluorometers: Measure real-time Chlorophyll-a productivity'
    ],
    recommendedPreset: 'GLIDER-INCOIS-01'
  },
  {
    id: 'upwelling',
    title: '3. Monsoon Coastal Upwelling & Fisheries',
    subtitle: 'Why India\'s West Coast is Rich with Marine Life',
    icon: Waves,
    badge: 'Marine Ecology',
    color: 'from-teal-500 to-emerald-600',
    description: "During the Southwest Monsoon, strong coastal winds push warm surface waters offshore. To replace them, cold, nutrient-rich deep water 'wells up' to the surface along Kerala, Karnataka, and Goa. This triggers massive phytoplankton blooms (high Chlorophyll), attracting schools of sardines and pelagic fish.",
    keyFacts: [
      'Chlorophyll Spike: Increases from 0.2 to over 2.5 mg/m³',
      'Sea Surface Cooling: Drops 2°C to 3°C during active upwelling',
      'INCOIS Advisory: Directly feeds the Potential Fishing Zone (PFZ) forecasts'
    ],
    recommendedPreset: 'GLIDER-NIOT-02'
  },
  {
    id: 'cyclones',
    title: '4. Tropical Cyclone Heat Potential (TCH)',
    subtitle: 'How Ocean Thermal Energy Fuels Monsoon Storms',
    icon: Activity,
    badge: 'Disaster Early Warning',
    color: 'from-rose-500 to-purple-600',
    description: "Cyclones in the Bay of Bengal and Arabian Sea draw energy from deep warm water ($>26^\circ\text{C}$). If the 26°C isotherm is deep (thick warm layer), cyclones rapidly intensify. After passage, cyclones leave a signature 'cold wake' where intense winds churn up cold deep water to the surface.",
    keyFacts: [
      'Threshold Sea Surface Temp: 26.5°C required for cyclogenesis',
      'Tropical Cyclone Heat Potential: Measures heat stored above 26°C depth',
      'Cold Wake Formation: Rapid SST cooling of 2°C to 4°C in the storm track'
    ],
    recommendedPreset: 'BD11'
  }
];

export default function ScienceTourModal({
  isOpen,
  onClose,
  onSelectStation,
  stations = []
}) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!isOpen) return null;

  const chapter = TOUR_CHAPTERS[currentIdx];
  const IconComp = chapter.icon;

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % TOUR_CHAPTERS.length;
    setCurrentIdx(nextIdx);
    triggerPreset(TOUR_CHAPTERS[nextIdx].recommendedPreset);
  };

  const handlePrev = () => {
    const prevIdx = (currentIdx - 1 + TOUR_CHAPTERS.length) % TOUR_CHAPTERS.length;
    setCurrentIdx(prevIdx);
    triggerPreset(TOUR_CHAPTERS[prevIdx].recommendedPreset);
  };

  const triggerPreset = (code) => {
    if (!onSelectStation || !stations) return;
    const found = stations.find(s => s.code === code || s.id === code);
    if (found) onSelectStation(found);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1325] border border-cyan-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070e1c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Ocean Science & Outreach Tour
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                  Interactive Storytelling
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Educational walkthrough designed for students, public exhibitions, and INCOIS decision makers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter Progress Indicators */}
        <div className="grid grid-cols-4 gap-1 p-3 bg-slate-900/60 border-b border-slate-800">
          {TOUR_CHAPTERS.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => {
                setCurrentIdx(i);
                triggerPreset(ch.recommendedPreset);
              }}
              className={`py-1.5 px-2 rounded-lg text-left text-[11px] font-semibold transition-all cursor-pointer truncate ${
                i === currentIdx
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <span className="block text-[9px] font-mono text-slate-500 uppercase">Part {i + 1}</span>
              <span className="truncate block">{ch.title.split('. ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Chapter Body */}
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {chapter.badge}
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {chapter.title}
              </h3>
              <p className="text-xs text-cyan-300 font-medium">
                {chapter.subtitle}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${chapter.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
              <IconComp className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
            {chapter.description}
          </p>

          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2 font-mono uppercase tracking-wider">
              Key Science Insights:
            </h4>
            <div className="flex flex-col gap-1.5">
              {chapter.keyFacts.map((fact, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900/30 px-3 py-1.5 rounded-lg border border-slate-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070e1c] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-[11px] font-mono text-slate-400">
            Chapter {currentIdx + 1} of {TOUR_CHAPTERS.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
