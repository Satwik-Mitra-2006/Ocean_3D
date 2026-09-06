import React, { useState } from 'react';
import { 
  BookOpen, 
  Award, 
  Waves, 
  Cpu, 
  Globe2, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function AboutView() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'Q: Data kahan se aa raha hai? (Where is the data sourced from?)',
      a: 'Copernicus Marine Service (GLORYS12V1 global physical ocean reanalysis) se 262MB NetCDF-4 binary dataset backend/data me mounted hai. Hamara Python FastAPI backend xarray ke sath lazily query karta hai, isliye browser 60 FPS par smooth chalta hai without memory overflow.'
    },
    {
      q: 'Q: 2D maps se better 3D visualization kyu hai? (Why 3D instead of 2D?)',
      a: 'Samundar ki 90% heat depth (subsurface) me store hoti hai. Flat 2D maps sirf surface dikhate hain, par underwater thermoclines, barrier layers, aur internal waves gayab ho jate hain. 3D visualization se cyclone rapid intensification aur naval submarine acoustics pehle se samajh aate hain.'
    },
    {
      q: 'Q: Real-world impact kya hoga is project ka? (Real-world Impact & Beneficiaries)',
      a: '1) IMD & INCOIS ke liye Tropical Cyclone Heat Potential (TCHP) alert, 2) Coastal fishermen ke liye Potential Fishing Zones (PFZ) thermal front detection, 3) Indian Navy ke liye underwater sonar sound channel (SOFAR) acoustic shadow zone calculation.'
    },
    {
      q: 'Q: Station CB01 kya hai aur iska status Warning kyu hai?',
      a: 'Coastal Radar CB01 Lakshadweep Sea (Nine Degree Channel) me sthit ek High-Frequency oceanographic radar aur coastal station hai. Warning status ka matlab sensor calibration quality control routine chal raha hai (salinity within 0.15 PSU conformance).'
    }
  ];

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-100 max-w-[1800px] mx-auto w-full px-3 py-2 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-950 text-sky-400 border border-sky-500/40 uppercase font-mono">
              Smart India Hackathon 2026
            </span>
            <span className="text-xs text-slate-400">• Ministry of Earth Sciences (MoES)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Ocean3D — Indian Ocean Digital Twin Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            A state-of-the-art interactive 3D volumetric Digital Twin bridging real Copernicus NetCDF physical ocean reanalysis with INCOIS buoy telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-sky-500/30 px-4 py-3 rounded-2xl">
          <Award className="h-6 w-6 text-amber-400 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-white">SIH 2026 Problem Statement</div>
            <div className="text-sky-300 font-mono text-[11px]">3D Volumetric Subsurface Visualization</div>
          </div>
        </div>
      </div>

      {/* 3 PILLARS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Pillar 1 */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-500/30 flex items-center justify-center">
            <Globe2 className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">3D Indian Ocean Digital Twin</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real-time interactive 3D globe showing surface circulation, current velocity vectors, and active in-situ buoy markers with horizon-aware camera occlusion.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-500/30 flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">Volumetric Water Column Cutaway</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            True 3D depth slice (0.49m to 11.40m) revealing the thermal mixed layer, thermocline gradient, and halocline salinity variations across 9 Copernicus vertical layers.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-white">FastAPI + xarray Lazy Slicing</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            High-performance backend reading raw 262MB Copernicus NetCDF-4 datasets on-the-fly, returning sliced multidimensional profiles in under 75 milliseconds.
          </p>
        </div>

      </div>

      {/* BEGINNER-FRIENDLY PITCH & DEMO SCRIPT (FOR JUDGES) */}
      <div className="bg-[#0b1325]/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Project Presentation Guide & Judge Pitch (बोलने का तरीका)
          </h2>
        </div>

        {/* Pitch Script Box */}
        <div className="bg-[#060c18] border border-sky-500/30 rounded-xl p-4 flex flex-col gap-2">
          <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider font-mono">
            30-Second Elevator Pitch
          </span>
          <p className="text-xs sm:text-sm text-slate-100 italic leading-relaxed">
            "Respected judges, flat 2D maps completely hide underwater heat and currents where 90% of ocean energy is stored. We built <strong>Ocean3D</strong> — an interactive 3D volumetric Digital Twin of the Indian Ocean. It streams real Copernicus NetCDF physics data and INCOIS buoy telemetry to visualize underwater thermoclines, salinity stratification, and currents in true 3D space."
          </p>
          <div className="text-xs text-amber-300/90 font-medium bg-amber-950/30 p-2.5 rounded-lg border border-amber-500/20 mt-1">
            <strong>सरल हिन्दी में:</strong> "Judges ko batayein ki normal maps sirf samundar ka surface dikhate hain. Lekin cyclone aur machhliyon ka pata lagane ke liye gehrai (depth) dekhna zaroori hota hai. Ocean3D me real NetCDF physics data se samundar ka 3D slice dikhta hai."
          </div>
        </div>

        {/* Top Questions & Answers Accordion */}
        <div className="space-y-2 mt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-sky-400" />
            Key Questions & Prepared Answers (Q&A)
          </h3>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-[#060c18] border border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left text-xs font-bold text-white flex items-center justify-between gap-2 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="text-sky-300">{faq.q}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-3.5 pb-3.5 text-xs text-slate-300 leading-relaxed font-sans border-t border-slate-800/80 pt-2.5">
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
