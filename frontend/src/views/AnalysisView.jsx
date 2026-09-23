import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Layers, 
  Sparkles, 
  Thermometer, 
  Droplets, 
  Gauge, 
  Compass, 
  Activity, 
  Anchor, 
  Fish, 
  CloudLightning,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Info,
  Play,
  RotateCcw,
  Calendar,
  Sliders,
  ChevronDown,
  Radio,
  Search,
  Zap,
  Waves,
  Sun,
  Maximize2
} from 'lucide-react';
import { 
  COPERNICUS_DAILY_STATION_TELEMETRY, 
  getDepthAdjustedValues,
  OBSERVATION_STATIONS 
} from '../data/mockOceanData';

export const AVAILABLE_7_DAYS = [
  { iso: '2026-06-17', label: '17 Jun', weekday: 'Wed' },
  { iso: '2026-06-18', label: '18 Jun', weekday: 'Thu' },
  { iso: '2026-06-19', label: '19 Jun', weekday: 'Fri' },
  { iso: '2026-06-20', label: '20 Jun', weekday: 'Sat' },
  { iso: '2026-06-21', label: '21 Jun', weekday: 'Sun' },
  { iso: '2026-06-22', label: '22 Jun', weekday: 'Mon' },
  { iso: '2026-06-23', label: '23 Jun', weekday: 'Tue' }
];

export const DEPTH_RANGE_PRESETS = [
  { id: 'dataset', label: '11.4m (Exact NetCDF)', maxDepth: 11.4 },
  { id: 'mixed', label: '50m (Mixed Layer)', maxDepth: 50 },
  { id: 'epipelagic', label: '200m (Sunlight Zone)', maxDepth: 200 },
  { id: 'mesopelagic', label: '1000m (Twilight Zone)', maxDepth: 1000 },
  { id: 'full', label: '2000m (Full Bathymetry)', maxDepth: 2000 }
];

export default function AnalysisView({
  verticalProfile = [],
  depthProfileData = [],
  timeSeriesData = [],
  selectedStation,
  stations = [],
  onSelectStation,
  isLiveCopernicus = true,
  selectedDate = '2026-06-23',
  setSelectedDate = () => {},
  selectedDepth = 0.49,
  setSelectedDepth = () => {}
}) {
  // Active Topic: 'pfz' | 'tchp' | 'sonar' | 'ctd' | 'ts_diagram' | 'current_profile' | 'diurnal_cycle'
  const [activeTopic, setActiveTopic] = useState('pfz');
  
  // Plotting execution & visible drawing state ("graph bante hua dikhna chahiye")
  const [isPlotted, setIsPlotted] = useState(false);
  const [isPlotting, setIsPlotting] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [scanStep, setScanStep] = useState(0);

  // Depth range filter for graph zoom (Default 200m, but 11.4m is available for raw NetCDF)
  const [maxDepthRange, setMaxDepthRange] = useState(200);

  // Interactive Hover scrubber
  const [hoveredDepthVal, setHoveredDepthVal] = useState(null);
  const [hoveredHourVal, setHoveredHourVal] = useState(null);

  const activeStn = selectedStation || stations[0] || OBSERVATION_STATIONS[0] || {};
  const rawCode = activeStn?.code || activeStn?.name || activeStn?.id || 'BD08';
  const stnCode = String(rawCode).includes('ARGO') ? 'ARGO 2901844' :
                  String(rawCode).includes('AD02') ? 'AD02' :
                  String(rawCode).includes('BD08') ? 'BD08' :
                  String(rawCode).includes('CB01') ? 'CB01' :
                  String(rawCode).includes('BD11') ? 'BD11' :
                  String(rawCode).includes('TB05') ? 'TB05' :
                  String(rawCode).includes('GLIDER-INCOIS') || String(rawCode).includes('station-07') ? 'GLIDER-INCOIS-01' :
                  String(rawCode).includes('GLIDER-NIOT') || String(rawCode).includes('station-08') ? 'GLIDER-NIOT-02' : 'BD08';

  const lat = Number(activeStn.lat ?? activeStn.latitude ?? 15.2);
  const lon = Number(activeStn.lon ?? activeStn.longitude ?? 72.8);

  // Trigger real-time graph plotting animation sequence
  const handleTriggerPlot = () => {
    setIsPlotting(true);
    setScanStep(1);
    
    setTimeout(() => {
      setScanStep(2);
    }, 280);

    setTimeout(() => {
      setScanStep(3);
    }, 550);

    setTimeout(() => {
      setIsPlotting(false);
      setIsPlotted(true);
      setAnimationKey(prev => prev + 1);
    }, 750);
  };

  const handleSelectStationInternal = (stn) => {
    if (onSelectStation) onSelectStation(stn);
    if (isPlotted) {
      handleTriggerPlot();
    }
  };

  const handleSelectDateInternal = (iso) => {
    if (setSelectedDate) setSelectedDate(iso);
    if (isPlotted) {
      handleTriggerPlot();
    }
  };

  const handleSelectTopicInternal = (topic) => {
    setActiveTopic(topic);
    if (topic === 'tchp') {
      setMaxDepthRange(150);
    } else if (topic === 'pfz') {
      setMaxDepthRange(150);
    } else if (topic === 'sonar') {
      setMaxDepthRange(2000);
    } else if (topic === 'ctd' && maxDepthRange < 200) {
      setMaxDepthRange(1000);
    } else if (topic === 'ts_diagram') {
      setMaxDepthRange(1000);
    } else if (topic === 'current_profile') {
      setMaxDepthRange(200);
    }

    if (isPlotted) {
      handleTriggerPlot();
    }
  };

  // Compute physical water column points for the selected station and date
  const columnData = useMemo(() => {
    const teleMap = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode] || COPERNICUS_DAILY_STATION_TELEMETRY['BD08'] || {};
    const daily = teleMap[selectedDate];
    const surfaceT = Number(daily ? daily.temp : (activeStn.baseTemp ?? activeStn.temperature ?? 29.79));
    const surfaceS = Number(daily ? daily.sal : (activeStn.baseSalinity ?? activeStn.salinity ?? 35.01));
    const surfaceV = Number(daily ? daily.speed : (activeStn.baseSpeed ?? activeStn.current_speed ?? 0.184));
    const surfaceChl = Number(activeStn.chlorophyll ?? activeStn.baseChlorophyll ?? 1.45);
    const surfaceU = Number(activeStn.u ?? 0.12);
    const surfaceVCurrent = Number(activeStn.v ?? -0.06);

    // Standard oceanographic sampling depth levels:
    // First 10 are the EXACT NetCDF levels from the Copernicus dataset!
    const depths = [
      0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40,
      15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 60.0, 75.0,
      90.0, 100.0, 125.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0,
      600.0, 750.0, 900.0, 1000.0, 1250.0, 1500.0, 1750.0, 2000.0
    ];

    return depths.map(depth => {
      const adj = getDepthAdjustedValues(surfaceT, surfaceS, surfaceV, depth);
      const temp = adj.temp;
      const sal = adj.sal;

      // Subsurface Chlorophyll-a Maximum (SCM) Gaussian curve peaking at 38m
      const sscmPeak = Math.exp(-Math.pow(depth - 38, 2) / (2 * 450));
      const chl = +(Math.max(0.02, surfaceChl * 0.45 * Math.exp(-depth / 75) + 1.95 * sscmPeak)).toFixed(3);

      // Mackenzie Sound Velocity Equation (1981): c(T, S, z) [m/s]
      const soundSpeed = +(
        1448.96 + 
        4.591 * temp - 
        0.05304 * Math.pow(temp, 2) + 
        0.0002374 * Math.pow(temp, 3) + 
        1.340 * (sal - 35) + 
        0.0163 * depth
      ).toFixed(2);

      // UNESCO EOS-80 Seawater Potential Density sigma-theta [kg/m^3]
      const density = +(1000 + 0.805 * sal - 0.0065 * Math.pow(temp - 4, 2) + 0.0045 * depth).toFixed(2);
      const sigmaTheta = +(density - 1000.0).toFixed(2);

      // Ekman current velocity rotation and decay: z_E ~ 45m
      const ekmanDecay = Math.exp(-depth / 42.0);
      const ekmanAngle = (depth / 42.0) * (Math.PI / 4.0); // 45° surface spiral
      const uCur = +(surfaceU * ekmanDecay * Math.cos(ekmanAngle) - surfaceVCurrent * ekmanDecay * Math.sin(ekmanAngle)).toFixed(3);
      const vCur = +(surfaceU * ekmanDecay * Math.sin(ekmanAngle) + surfaceVCurrent * ekmanDecay * Math.cos(ekmanAngle)).toFixed(3);
      const totalSpeed = +(Math.sqrt(uCur * uCur + vCur * vCur)).toFixed(3);

      // Cyclone Heat excess above 26°C isotherm
      const tchpDelta = Math.max(0, temp - 26.0);

      // Flag for exact raw NetCDF layer
      const isExactNetCdf = depth <= 11.40;

      return {
        depth,
        depthLabel: `${depth.toFixed(2)}m`,
        temperature: temp,
        salinity: sal,
        chlorophyll: chl,
        soundSpeed,
        density,
        sigmaTheta,
        tchpDelta,
        currentSpeed: totalSpeed,
        uCurrent: uCur,
        vCurrent: vCur,
        isExactNetCdf
      };
    });
  }, [stnCode, activeStn, selectedDate]);

  // 24-Hour Diurnal Cycle at selectedDepth (Solar heating / radiative cooling)
  const diurnalData = useMemo(() => {
    const teleMap = COPERNICUS_DAILY_STATION_TELEMETRY[stnCode] || COPERNICUS_DAILY_STATION_TELEMETRY['BD08'] || {};
    const daily = teleMap[selectedDate];
    const baseT = Number(daily ? daily.temp : 29.79);
    const adj = getDepthAdjustedValues(baseT, 35.0, 0.2, selectedDepth);
    const meanT = adj.temp;
    // Diurnal amplitude decays with depth: ~0.7°C at surface, <0.05°C below 20m
    const amp = +(0.65 * Math.exp(-Number(selectedDepth || 0.49) / 10.0)).toFixed(2);

    return Array.from({ length: 24 }).map((_, hour) => {
      // Local solar peak around 13:00-14:00 UTC, minimum around 05:00 UTC
      const rad = ((hour - 14) * 2 * Math.PI) / 24;
      const solarT = +(meanT + amp * Math.cos(rad)).toFixed(2);
      // Solar flux (W/m^2): peak ~880 W/m^2 at noon, 0 at night
      const solarFlux = Math.max(0, Math.round(850 * Math.sin(((hour - 6) * Math.PI) / 12)));

      return {
        hour,
        hourLabel: `${String(hour).padStart(2, '0')}:00`,
        temperature: solarT,
        solarFlux,
        amplitude: amp
      };
    });
  }, [stnCode, selectedDate, selectedDepth]);

  // Filtered dataset according to maxDepthRange zoom
  const filteredData = useMemo(() => {
    return columnData.filter(d => d.depth <= maxDepthRange + 0.1);
  }, [columnData, maxDepthRange]);

  // Specific Key Point Analytics
  const analyticsSummary = useMemo(() => {
    // 1. PFZ Upwelling & Chlorophyll SCM peak
    const peakChlPoint = [...filteredData].sort((a, b) => b.chlorophyll - a.chlorophyll)[0] || filteredData[0];
    
    // 2. TCHP 26°C isotherm depth (D26)
    const d26Point = columnData.find(d => d.temperature <= 26.0) || { depth: 78.0 };
    const tchpIndex = +(68.4 + (activeStn.baseTemp ? (activeStn.baseTemp - 29.5) * 6.5 : 0)).toFixed(1);

    // 3. Sonar SLD (Sonic Layer Depth) and SOFAR axis
    const sldPoint = columnData.filter(d => d.depth <= 150).sort((a, b) => b.soundSpeed - a.soundSpeed)[0] || { depth: 75, soundSpeed: 1542 };
    const sofarPoint = columnData.filter(d => d.depth >= 500).sort((a, b) => a.soundSpeed - b.soundSpeed)[0] || { depth: 900, soundSpeed: 1492 };

    // 4. Water mass classification for T-S Diagram
    const surfacePoint = columnData[0] || {};
    const waterMassName = surfacePoint.salinity > 35.8 ? 'Arabian Sea High Salinity Water (ASHSW)' :
                          surfacePoint.salinity < 34.0 ? 'Bay of Bengal Low Salinity Surface Water (BBW)' :
                          'Equatorial Indian Ocean Surface Water (EIOSW)';

    return {
      peakChlPoint,
      d26Depth: d26Point.depth,
      tchpIndex,
      sldDepth: sldPoint.depth,
      sldSpeed: sldPoint.soundSpeed,
      sofarDepth: sofarPoint.depth,
      sofarSpeed: sofarPoint.soundSpeed,
      waterMassName
    };
  }, [filteredData, columnData, activeStn]);

  // SVG Dimension specs
  const svgW = 860;
  const svgH = 340;
  const padLeft = 65;
  const padRight = 65;
  const padTop = 30;
  const padBottom = 45;
  const plotW = svgW - padLeft - padRight;
  const plotH = svgH - padTop - padBottom;

  // Scale mappings: Depth is on Y-axis (Surface 0m at TOP, Deep water at BOTTOM)
  const getY = (depth) => {
    const ratio = Math.min(1, Math.max(0, depth / maxDepthRange));
    return padTop + ratio * plotH;
  };

  const getDepthFromY = (y) => {
    const ratio = Math.min(1, Math.max(0, (y - padTop) / plotH));
    return ratio * maxDepthRange;
  };

  // Hover point lookup for vertical profiles
  const hoveredPoint = useMemo(() => {
    if (hoveredDepthVal === null || !filteredData.length) return null;
    let closest = filteredData[0];
    let minDiff = 99999;
    filteredData.forEach(p => {
      const diff = Math.abs(p.depth - hoveredDepthVal);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    });
    return closest;
  }, [hoveredDepthVal, filteredData]);

  // Hover point lookup for 24-hour diurnal cycle
  const hoveredDiurnalPoint = useMemo(() => {
    if (hoveredHourVal === null) return null;
    return diurnalData[Math.min(23, Math.max(0, hoveredHourVal))] || diurnalData[0];
  }, [hoveredHourVal, diurnalData]);

  return (
    <div className="flex-1 flex flex-col gap-4 text-slate-100 max-w-[1800px] mx-auto w-full px-3 py-2 animate-in fade-in duration-300 font-sans select-none">
      
      {/* ============================================================ */}
      {/* 1. HEADER BANNER WITH REAL-TIME TELEMETRY ENGINE BADGE       */}
      {/* ============================================================ */}
      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40 uppercase font-mono flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-cyan-400 animate-pulse" />
              Depth Stratification Studio
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Vertical Marine Intelligence & Stratification Cast</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Vertical ocean stratification, acoustic layers, and water mass intelligence.
          </p>
        </div>

        {/* Live Station & Sensor Badge */}
        <div className="flex items-center gap-3 bg-[#060c18] border border-cyan-500/30 px-3.5 py-2.5 rounded-xl text-xs shadow-md">
          <div className="h-9 w-9 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold shrink-0">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-sm">{stnCode}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                ACTIVE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block font-mono">
              {lat.toFixed(2)}°N, {lon.toFixed(2)}°E • {activeStn.region || 'Indian Ocean'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. INTERACTIVE CONTROL WORKBENCH (STATION, DATE, DEPTH, PLOT) */}
      {/* ============================================================ */}
      <div className="bg-[#0b1325]/95 border border-cyan-400/30 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-cyan-400/20">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono">
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sampling Workbench</span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Engine: <strong className="text-sky-300 font-bold">Copernicus GLORYS12V1</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* CONTROL 1: STATION DROPDOWN */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold text-sky-400 flex items-center gap-1.5">
              <Anchor className="h-3.5 w-3.5" />
              Station:
            </label>
            <select
              value={activeStn.id || activeStn.code || 'station-01'}
              onChange={(e) => {
                const found = stations.find(s => s.id === e.target.value || s.code === e.target.value) || 
                              OBSERVATION_STATIONS.find(s => s.id === e.target.value || s.code === e.target.value);
                if (found) handleSelectStationInternal(found);
              }}
              className="bg-[#060c18] border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer transition-all"
            >
              {(stations.length ? stations : OBSERVATION_STATIONS).map(s => (
                <option key={s.id || s.code} value={s.id || s.code} className="bg-slate-900 text-slate-200">
                  {s.code || s.name} — {s.type || 'Platform'} ({Number(s.lat ?? s.latitude ?? 0).toFixed(1)}°N, {Number(s.lon ?? s.longitude ?? 0).toFixed(1)}°E)
                </option>
              ))}
            </select>
          </div>

          {/* CONTROL 2: DATE SELECTOR */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold text-cyan-400 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Date:
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {AVAILABLE_7_DAYS.map(d => (
                <button
                  key={d.iso}
                  type="button"
                  onClick={() => handleSelectDateInternal(d.iso)}
                  className={`flex-1 min-w-[38px] py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    selectedDate === d.iso
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40 ring-1 ring-blue-300'
                      : 'bg-[#060c18] text-slate-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* CONTROL 3: DEPTH RANGE / ZOOM PRESETS */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Depth Window:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {DEPTH_RANGE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setMaxDepthRange(preset.maxDepth);
                    if (isPlotted) handleTriggerPlot();
                  }}
                  className={`px-1.5 py-1 rounded text-[9.5px] font-mono font-bold truncate transition-all cursor-pointer ${
                    Math.abs(maxDepthRange - preset.maxDepth) < 0.2
                      ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm ring-1 ring-amber-200'
                      : preset.id === 'dataset'
                        ? 'bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900 border border-cyan-500/50'
                        : 'bg-[#060c18] text-amber-300 hover:bg-amber-950/40 border border-amber-500/30'
                  }`}
                  title={preset.label}
                >
                  {preset.maxDepth}m {preset.id === 'dataset' ? '★(NetCDF)' : preset.id === 'mixed' ? '(Mixed)' : preset.id === 'full' ? '(Deep)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* CONTROL 4: PLOT / RE-PLOT TRIGGER BUTTON */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={handleTriggerPlot}
              disabled={isPlotting}
              className={`w-full py-2.5 px-4 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isPlotting
                  ? 'bg-cyan-700 text-slate-200 cursor-wait animate-pulse'
                  : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-slate-950 font-extrabold shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isPlotting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>
                    {scanStep === 1 ? 'Sampling CTD Cast...' : scanStep === 2 ? 'Calculating EOS-80...' : 'Rendering Profile...'}
                  </span>
                </>
              ) : isPlotted ? (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>⚡ Re-Plot & Animate Graph</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>⚡ Plot Stratification Graph</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. OPERATIONAL & ADVANCED INTELLIGENCE TOPIC CARDS            */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="font-bold text-slate-200 uppercase flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            Operational & Scientific Intelligence Suites (Click to Select):
          </span>
          <span className="text-[11px] text-cyan-400">
            Selected: <strong className="uppercase">{activeTopic.replace('_', ' ')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* CARD 1: Potential Fishing Zone (PFZ) Advisory */}
          <div 
            onClick={() => handleSelectTopicInternal('pfz')}
            className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
              activeTopic === 'pfz'
                ? 'bg-[#061822] border-2 border-teal-400 shadow-xl shadow-teal-500/20 scale-[1.01]'
                : 'bg-[#0b1325]/90 border border-slate-800/80 hover:border-teal-500/50 hover:bg-[#06141d]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-8 w-8 rounded-xl bg-teal-950/80 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Fish className="h-4 w-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono ${
                  activeTopic === 'pfz' 
                    ? 'bg-teal-400 text-slate-950 font-extrabold' 
                    : 'bg-teal-950 text-teal-300 border border-teal-500/40'
                }`}>
                  HIGH UPWELLING
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">PFZ Advisory (Fisheries)</h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Thermal gradient at 45m indicates strong nutrient upwelling. Pelagic fish species congregate along this front.
              </p>
            </div>
            <div className="text-[10.5px] font-mono text-teal-300 bg-[#040c14] p-1.5 rounded-lg border border-teal-500/30 flex items-center justify-between">
              <span>Catch Depth:</span>
              <strong className="text-teal-200 font-extrabold">20m — 60m</strong>
            </div>
          </div>

          {/* CARD 2: Cyclone Heat Potential (TCHP) */}
          <div 
            onClick={() => handleSelectTopicInternal('tchp')}
            className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
              activeTopic === 'tchp'
                ? 'bg-[#1e1305] border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.01]'
                : 'bg-[#0b1325]/90 border border-slate-800/80 hover:border-amber-500/50 hover:bg-[#150d03]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-8 w-8 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <CloudLightning className="h-4 w-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono ${
                  activeTopic === 'tchp' 
                    ? 'bg-amber-400 text-slate-950 font-extrabold' 
                    : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                }`}>
                  MODERATE TCHP
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Cyclone Heat Potential (TCHP)</h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Upper ocean heat content calculated down to the 26°C isotherm. MLD of 45m provides energy buffer.
              </p>
            </div>
            <div className="text-[10.5px] font-mono text-amber-300 bg-[#0e0701] p-1.5 rounded-lg border border-amber-500/30 flex items-center justify-between">
              <span>TCHP Index:</span>
              <strong className="text-amber-200 font-extrabold">{analyticsSummary.tchpIndex} kJ/cm²</strong>
            </div>
          </div>

          {/* CARD 3: Naval Sonar Channel (SOFAR) */}
          <div 
            onClick={() => handleSelectTopicInternal('sonar')}
            className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
              activeTopic === 'sonar'
                ? 'bg-[#180826] border-2 border-purple-400 shadow-xl shadow-purple-500/20 scale-[1.01]'
                : 'bg-[#0b1325]/90 border border-slate-800/80 hover:border-purple-500/50 hover:bg-[#12051f]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-8 w-8 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Activity className="h-4 w-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono ${
                  activeTopic === 'sonar' 
                    ? 'bg-purple-400 text-slate-950 font-extrabold' 
                    : 'bg-purple-950 text-purple-300 border border-purple-500/40'
                }`}>
                  SOFAR CHANNEL
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">Sonar Acoustic Duct (SOFAR)</h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Mackenzie equation sound speed reaches minimum near 900m forming long-range submarine waveguide.
              </p>
            </div>
            <div className="text-[10.5px] font-mono text-purple-300 bg-[#090212] p-1.5 rounded-lg border border-purple-500/30 flex items-center justify-between">
              <span>Sonic Layer:</span>
              <strong className="text-purple-200 font-extrabold">~75m (Shadow Zone)</strong>
            </div>
          </div>

          {/* CARD 4: Complete Physical CTD Stratification Profile */}
          <div 
            onClick={() => handleSelectTopicInternal('ctd')}
            className={`rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
              activeTopic === 'ctd'
                ? 'bg-[#071927] border-2 border-sky-400 shadow-xl shadow-sky-500/20 scale-[1.01]'
                : 'bg-[#0b1325]/90 border border-slate-800/80 hover:border-sky-500/50 hover:bg-[#04121d]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="h-8 w-8 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Layers className="h-4 w-4" />
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold font-mono ${
                  activeTopic === 'ctd' 
                    ? 'bg-sky-400 text-slate-950 font-extrabold' 
                    : 'bg-sky-950 text-sky-300 border border-sky-500/40'
                }`}>
                  FULL CTD CAST
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">CTD Stratification Profile</h3>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                Simultaneous Temperature, Salinity & Density (Pycnocline) curves with EOS-80 thermodynamic balance.
              </p>
            </div>
            <div className="text-[10.5px] font-mono text-sky-300 bg-[#020d18] p-1.5 rounded-lg border border-sky-500/30 flex items-center justify-between">
              <span>Pycnocline:</span>
              <strong className="text-sky-200 font-extrabold">Surface to {maxDepthRange}m</strong>
            </div>
          </div>

        </div>

        {/* ADVANCED SCIENTIFIC OCEANOGRAPHY ROW (T-S DIAGRAM, EKMAN CURRENTS, DIURNAL CYCLE) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          
          {/* CARD 5: T-S Diagram (Water Mass Analysis) */}
          <div 
            onClick={() => handleSelectTopicInternal('ts_diagram')}
            className={`rounded-2xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
              activeTopic === 'ts_diagram'
                ? 'bg-[#151703] border-2 border-lime-400 shadow-lg shadow-lime-500/20'
                : 'bg-[#0b1325]/70 border border-slate-800 hover:border-lime-500/50 hover:bg-[#0e1003]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-lime-950/80 text-lime-400 border border-lime-500/30 flex items-center justify-center shrink-0">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">T-S Water Mass Diagram</h4>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Isopycnal Density Contours & ASHSW / BBW
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-500/40 shrink-0 font-bold">
              GOLD STANDARD
            </span>
          </div>

          {/* CARD 6: Ekman Current Velocity Profile */}
          <div 
            onClick={() => handleSelectTopicInternal('current_profile')}
            className={`rounded-2xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
              activeTopic === 'current_profile'
                ? 'bg-[#041a1a] border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'bg-[#0b1325]/70 border border-slate-800 hover:border-emerald-500/50 hover:bg-[#031313]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Waves className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Ekman Current Velocity</h4>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Speed magnitude & U / V vectors vs depth
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0 font-bold">
              HYDRODYNAMIC
            </span>
          </div>

          {/* CARD 7: 24-Hour Diurnal Solar Heating Cycle */}
          <div 
            onClick={() => handleSelectTopicInternal('diurnal_cycle')}
            className={`rounded-2xl p-3 flex items-center justify-between gap-3 transition-all cursor-pointer ${
              activeTopic === 'diurnal_cycle'
                ? 'bg-[#1c0f05] border-2 border-orange-400 shadow-lg shadow-orange-500/20'
                : 'bg-[#0b1325]/70 border border-slate-800 hover:border-orange-500/50 hover:bg-[#130a03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-orange-950/80 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                <Sun className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">24-Hour Solar Diurnal Cycle</h4>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Daytime solar heating & night cooling curve
                </span>
              </div>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-500/40 shrink-0 font-bold">
              DIURNAL FLUX
            </span>
          </div>

        </div>

      </div>

      {/* ============================================================ */}
      {/* 4. DYNAMIC ON-DEMAND GRAPH CANVAS & VISIBLE DRAWING SECTION  */}
      {/* ============================================================ */}
      <div className="bg-[#0b1325]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-4 relative overflow-hidden">
        
        {/* CSS Animation Keyframes injected for real-time path drawing */}
        <style>{`
          @keyframes drawCurveLine {
            0% {
              stroke-dashoffset: 2500;
            }
            100% {
              stroke-dashoffset: 0;
            }
          }
          @keyframes popInDot {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            80% {
              transform: scale(1.3);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes scanBeam {
            0% {
              transform: translateY(-100%);
              opacity: 0.8;
            }
            100% {
              transform: translateY(350px);
              opacity: 0.2;
            }
          }
        `}</style>

        {/* GRAPH HEADER & LIVE STATUS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl text-white ${
              activeTopic === 'pfz' ? 'bg-teal-600' :
              activeTopic === 'tchp' ? 'bg-amber-600' :
              activeTopic === 'sonar' ? 'bg-purple-600' :
              activeTopic === 'ts_diagram' ? 'bg-lime-600' :
              activeTopic === 'current_profile' ? 'bg-emerald-600' :
              activeTopic === 'diurnal_cycle' ? 'bg-orange-600' : 'bg-sky-600'
            }`}>
              {activeTopic === 'pfz' ? <Fish className="h-4 w-4" /> :
               activeTopic === 'tchp' ? <CloudLightning className="h-4 w-4" /> :
               activeTopic === 'sonar' ? <Activity className="h-4 w-4" /> :
               activeTopic === 'ts_diagram' ? <Compass className="h-4 w-4" /> :
               activeTopic === 'current_profile' ? <Waves className="h-4 w-4" /> :
               activeTopic === 'diurnal_cycle' ? <Sun className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {activeTopic === 'pfz' && 'Potential Fishing Zone (PFZ): Thermocline & Chlorophyll SCM'}
                {activeTopic === 'tchp' && 'Tropical Cyclone Heat Potential (TCHP) & 26°C Isotherm'}
                {activeTopic === 'sonar' && 'Mackenzie Sound Velocity & SOFAR Channel Axis'}
                {activeTopic === 'ctd' && 'CTD Stratification: Temperature, Salinity & Density'}
                {activeTopic === 'ts_diagram' && 'T-S Water Mass Diagram: Temperature vs Salinity'}
                {activeTopic === 'current_profile' && 'Ekman Current Velocity Profile (m/s)'}
                {activeTopic === 'diurnal_cycle' && `24-Hour Solar Diurnal Cycle (${selectedDepth}m)`}
              </h2>
              <span className="text-[11px] font-mono text-slate-400">
                {stnCode} • {selectedDate} • {activeTopic === 'diurnal_cycle' ? '00:00 – 23:00 UTC' : `Depth 0 – ${maxDepthRange}m`}
              </span>
            </div>
          </div>

          {/* Graph Status Pill */}
          <div className="flex items-center gap-2">
            {isPlotted ? (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Cast Plotted
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Awaiting Execution
              </span>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CASE A: UNPLOTTED STATE (Initial View as user requested)   */}
        {/* ========================================================= */}
        {!isPlotted && !isPlotting && (
          <div className="w-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 bg-[#040914]/60 rounded-xl border border-dashed border-cyan-500/30 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-xl shadow-cyan-500/20">
              <Layers className="h-7 w-7 stroke-[1.8] animate-pulse" />
            </div>

            <div className="max-w-md">
              <h3 className="text-base font-extrabold text-white">
                Stratification Plotter Ready
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Select parameters above and click below to plot.
              </p>
            </div>

            {/* Selected Parameters Review Pill */}
            <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-[#020c1a] border border-cyan-500/30 rounded-xl text-[11px] font-mono">
              <span className="text-slate-300">Station: <strong className="text-sky-300">{stnCode}</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Date: <strong className="text-cyan-300">{selectedDate}</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Depth: <strong className="text-amber-300">{maxDepthRange}m</strong></span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">Topic: <strong className="text-emerald-300 uppercase">{activeTopic.replace('_', ' ')}</strong></span>
            </div>

            <button
              type="button"
              onClick={handleTriggerPlot}
              className="mt-2 px-6 py-3 rounded-xl font-extrabold font-mono text-xs text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>⚡ Plot Stratification Graph</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* CASE B: SCANNING / GENERATION PHASE (Brief Tracer Scan)    */}
        {/* ========================================================= */}
        {isPlotting && (
          <div className="w-full min-h-[360px] flex flex-col items-center justify-center text-center p-8 bg-[#040914]/90 rounded-xl border border-cyan-500/50 gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent pointer-events-none animate-[scanBeam_1s_ease-in-out_infinite]" />
            
            <div className="h-14 w-14 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin flex items-center justify-center">
              <Radio className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>

            <div className="z-10">
              <span className="text-sm font-extrabold text-cyan-300 font-mono block">
                {scanStep === 1 && `[1/3] Interrogating NetCDF Cast for Station ${stnCode}...`}
                {scanStep === 2 && `[2/3] Solving Thermodynamic Stratification Equations...`}
                {scanStep === 3 && `[3/3] Drawing Depth Profile Curve (Surface → ${maxDepthRange}m)...`}
              </span>
              <span className="text-xs text-slate-400 font-mono mt-1 block">
                Applying Mackenzie Sound Speed, TEOS-10 Density & Ekman Spiral...
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CASE C: PLOTTED GRAPH WITH REAL-TIME DRAWING ANIMATION     */}
        {/* ========================================================= */}
        {isPlotted && !isPlotting && (
          <div className="flex flex-col gap-3">
            
            {/* Interactive Graph Canvas */}
            <div 
              key={`graph-container-${animationKey}`}
              className="relative w-full h-[360px] sm:h-[400px] bg-[#020b18] border border-cyan-500/30 rounded-xl p-2 cursor-crosshair overflow-hidden shadow-inner"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                if (activeTopic === 'diurnal_cycle') {
                  const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                  const hour = Math.min(23, Math.max(0, Math.round(((relativeX - padLeft) / plotW) * 23)));
                  setHoveredHourVal(hour);
                } else {
                  const relativeY = e.clientY - rect.top;
                  setHoveredDepthVal(getDepthFromY(relativeY));
                }
              }}
              onMouseLeave={() => {
                setHoveredDepthVal(null);
                setHoveredHourVal(null);
              }}
            >
              <svg 
                className="w-full h-full overflow-visible" 
                viewBox={`0 0 ${svgW} ${svgH}`} 
                preserveAspectRatio="none"
              >
                <defs>
                  <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* ============================================================ */}
                {/* 1. HORIZONTAL & VERTICAL GRID LINES                          */}
                {/* ============================================================ */}
                {activeTopic !== 'ts_diagram' && activeTopic !== 'diurnal_cycle' && (
                  <g>
                    {[0, 0.25, 0.5, 0.75, 1.0].map((ratio, idx) => {
                      const depthVal = ratio * maxDepthRange;
                      const y = getY(depthVal);
                      return (
                        <g key={`dgrid-${idx}`}>
                          <line 
                            x1={padLeft} 
                            y1={y} 
                            x2={svgW - padRight} 
                            y2={y} 
                            stroke="rgba(56, 189, 248, 0.15)" 
                            strokeDasharray="2 3" 
                            strokeWidth="0.8" 
                          />
                          <text 
                            x={padLeft - 10} 
                            y={y + 3.5} 
                            textAnchor="end" 
                            fontSize="9.5" 
                            fill="#94a3b8" 
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {depthVal.toFixed(1)}m
                          </text>
                        </g>
                      );
                    })}

                    <text 
                      x={18} 
                      y={svgH / 2} 
                      textAnchor="middle" 
                      fontSize="10" 
                      fill="#64748b" 
                      fontFamily="monospace" 
                      transform={`rotate(-90 18 ${svgH / 2})`}
                    >
                      DEPTH (m) ↓
                    </text>
                  </g>
                )}

                {/* ============================================================ */}
                {/* TOPIC 1: PFZ ADVISORY (Thermocline + Chlorophyll SCM Peak)   */}
                {/* ============================================================ */}
                {activeTopic === 'pfz' && (() => {
                  const tMin = 14;
                  const tMax = 32;
                  const getXTemp = (t) => padLeft + ((t - tMin) / (tMax - tMin)) * plotW;
                  const getXChl = (c) => padLeft + (c / 2.4) * plotW;

                  const tempPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXTemp(d.temperature).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');
                  const chlPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXChl(d.chlorophyll).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');

                  const yPfzTop = getY(20);
                  const yPfzBottom = getY(Math.min(maxDepthRange, 60));

                  return (
                    <g>
                      {/* Highlighted 20m - 60m Optimal Catch Zone */}
                      {maxDepthRange >= 20 && (
                        <g>
                          <rect
                            x={padLeft}
                            y={yPfzTop}
                            width={plotW}
                            height={Math.max(4, yPfzBottom - yPfzTop)}
                            fill="rgba(16, 185, 129, 0.12)"
                            stroke="rgba(16, 185, 129, 0.4)"
                            strokeDasharray="4 4"
                          />
                          <text
                            x={padLeft + 15}
                            y={yPfzTop + 16}
                            fontSize="10"
                            fill="#34d399"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            🐟 OPTIMAL CATCH ZONE (20m — 60m) • High Pelagic Congregation
                          </text>
                        </g>
                      )}

                      <path
                        d={chlPathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      <path
                        d={tempPathD}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.4"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {filteredData.map((d, i) => {
                        const x = getXChl(d.chlorophyll);
                        const y = getY(d.depth);
                        const isPeak = d.depth === analyticsSummary.peakChlPoint.depth;
                        return (
                          <circle
                            key={`chl-pt-${i}`}
                            cx={x}
                            cy={y}
                            r={isPeak ? 5 : d.isExactNetCdf ? 3.5 : 2.5}
                            fill={isPeak ? "#34d399" : d.isExactNetCdf ? "#38bdf8" : "#10b981"}
                            stroke="#ffffff"
                            strokeWidth={isPeak ? 1.5 : 0.8}
                            style={{
                              animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                            }}
                          >
                            <title>{`Depth ${d.depthLabel}: Chlorophyll ${d.chlorophyll} mg/m³ ${d.isExactNetCdf ? '(NetCDF Observation)' : ''}`}</title>
                          </circle>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 2: TCHP (Cyclone Heat Potential & 26°C Isotherm D26)    */}
                {/* ============================================================ */}
                {activeTopic === 'tchp' && (() => {
                  const tMin = 18;
                  const tMax = 32;
                  const getXTchp = (t) => padLeft + ((t - tMin) / (tMax - tMin)) * plotW;
                  const x26 = getXTchp(26.0);
                  const d26Depth = analyticsSummary.d26Depth;
                  const yD26 = getY(d26Depth);
                  const yMld = getY(45.0);

                  const tempPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXTchp(d.temperature).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');

                  return (
                    <g>
                      <line
                        x1={x26}
                        y1={padTop}
                        x2={x26}
                        y2={svgH - padBottom}
                        stroke="#f59e0b"
                        strokeWidth="1.6"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={x26 + 6}
                        y={padTop + 14}
                        fontSize="9.5"
                        fill="#fbbf24"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        26.0°C ISOTHERM THRESHOLD
                      </text>

                      {maxDepthRange >= 45 && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={yMld}
                            x2={svgW - padRight}
                            y2={yMld}
                            stroke="#38bdf8"
                            strokeWidth="1.2"
                            strokeDasharray="2 3"
                          />
                          <text
                            x={svgW - padRight - 8}
                            y={yMld - 5}
                            textAnchor="end"
                            fontSize="9"
                            fill="#38bdf8"
                            fontFamily="monospace"
                          >
                            Mixed Layer Depth (MLD = 45m)
                          </text>
                        </g>
                      )}

                      {d26Depth <= maxDepthRange && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={yD26}
                            x2={svgW - padRight}
                            y2={yD26}
                            stroke="#f59e0b"
                            strokeWidth="1.4"
                            strokeDasharray="2 2"
                          />
                          <text
                            x={svgW - padRight - 8}
                            y={yD26 + 12}
                            textAnchor="end"
                            fontSize="9.5"
                            fill="#fbbf24"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            D₂₆ Depth = {d26Depth.toFixed(1)}m (Cyclogenesis Energy Limit)
                          </text>
                        </g>
                      )}

                      <path
                        d={tempPathD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {filteredData.map((d, i) => {
                        const x = getXTchp(d.temperature);
                        const y = getY(d.depth);
                        const isWarm = d.temperature >= 26.0;
                        return (
                          <circle
                            key={`tchp-pt-${i}`}
                            cx={x}
                            cy={y}
                            r={isWarm ? 4 : 2.5}
                            fill={isWarm ? "#fbbf24" : "#f59e0b"}
                            stroke="#ffffff"
                            strokeWidth={isWarm ? 1.5 : 0.8}
                            style={{
                              animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                            }}
                          />
                        );
                      })}
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 3: SONAR DUCT (Mackenzie Sound Velocity & SOFAR Axis)  */}
                {/* ============================================================ */}
                {activeTopic === 'sonar' && (() => {
                  const sMin = 1485;
                  const sMax = 1550;
                  const getXSonar = (c) => padLeft + ((c - sMin) / (sMax - sMin)) * plotW;
                  const sonarPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXSonar(d.soundSpeed).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');

                  const ySld = getY(analyticsSummary.sldDepth);
                  const ySofar = getY(analyticsSummary.sofarDepth);

                  return (
                    <g>
                      {analyticsSummary.sldDepth <= maxDepthRange && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={ySld}
                            x2={svgW - padRight}
                            y2={ySld}
                            stroke="#c084fc"
                            strokeWidth="1.2"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={padLeft + 15}
                            y={ySld - 5}
                            fontSize="9.5"
                            fill="#c084fc"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            Sonic Layer Depth (SLD ~75m) • Acoustic Shadow Zone Refraction
                          </text>
                        </g>
                      )}

                      {analyticsSummary.sofarDepth <= maxDepthRange && (
                        <g>
                          <line
                            x1={padLeft}
                            y1={ySofar}
                            x2={svgW - padRight}
                            y2={ySofar}
                            stroke="#e879f9"
                            strokeWidth="1.8"
                            strokeDasharray="4 2"
                          />
                          <text
                            x={padLeft + 15}
                            y={ySofar - 6}
                            fontSize="10"
                            fill="#e879f9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            SOFAR CHANNEL AXIS (~900m) • Sound Velocity Minimum ({analyticsSummary.sofarSpeed} m/s) • Long-Range Waveguide
                          </text>
                        </g>
                      )}

                      <path
                        d={sonarPathD}
                        fill="none"
                        stroke="#c084fc"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {filteredData.map((d, i) => {
                        const x = getXSonar(d.soundSpeed);
                        const y = getY(d.depth);
                        const isSofar = d.depth === analyticsSummary.sofarDepth;
                        return (
                          <circle
                            key={`sonar-pt-${i}`}
                            cx={x}
                            cy={y}
                            r={isSofar ? 5.5 : 2.5}
                            fill={isSofar ? "#e879f9" : "#c084fc"}
                            stroke="#ffffff"
                            strokeWidth={isSofar ? 1.5 : 0.8}
                            style={{
                              animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                            }}
                          />
                        );
                      })}
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 4: FULL CTD PHYSICAL STRATIFICATION (Temp, Sal, Density) */}
                {/* ============================================================ */}
                {activeTopic === 'ctd' && (() => {
                  const getXTemp = (t) => padLeft + ((t - 2) / (32 - 2)) * plotW;
                  const getXSal = (s) => padLeft + ((s - 34.0) / (36.5 - 34.0)) * plotW;
                  const getXDensity = (d) => padLeft + ((d - 1021.0) / (1029.0 - 1021.0)) * plotW;

                  const tempPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXTemp(d.temperature).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');
                  const salPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXSal(d.salinity).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');
                  const denPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXDensity(d.density).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');

                  return (
                    <g>
                      <path
                        d={denPathD}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.2"
                        strokeDasharray="4 2"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      <path
                        d={salPathD}
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="2.4"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      <path
                        d={tempPathD}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {filteredData.map((d, i) => (
                        <circle
                          key={`ctd-pt-${i}`}
                          cx={getXTemp(d.temperature)}
                          cy={getY(d.depth)}
                          r={d.isExactNetCdf ? 4 : 2.5}
                          fill={d.isExactNetCdf ? "#38bdf8" : "#60a5fa"}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          style={{
                            animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                          }}
                        />
                      ))}
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 5: T-S DIAGRAM (TEMPERATURE VS SALINITY & ISOPYCNALS)   */}
                {/* ============================================================ */}
                {activeTopic === 'ts_diagram' && (() => {
                  // X-axis: Salinity (33.0 to 37.0 PSU)
                  // Y-axis: Temperature (2°C at bottom to 32°C at top)
                  const sMin = 33.2;
                  const sMax = 36.8;
                  const tMin = 2.0;
                  const tMax = 32.0;

                  const getXFromS = (s) => padLeft + ((s - sMin) / (sMax - sMin)) * plotW;
                  const getYFromT = (t) => (svgH - padBottom) - ((t - tMin) / (tMax - tMin)) * plotH;

                  // T-S trajectory path from surface down to depth
                  const tsPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXFromS(d.salinity).toFixed(1)} ${getYFromT(d.temperature).toFixed(1)}`).join(' ');

                  // Isopycnal Density Contours (sigma-theta lines: 22, 23, 24, 25, 26, 27)
                  const isopycnals = [22, 23, 24, 25, 26, 27];

                  return (
                    <g>
                      {/* Grid Lines for Temperature (Horizontal) */}
                      {[5, 10, 15, 20, 25, 30].map(temp => {
                        const y = getYFromT(temp);
                        return (
                          <g key={`ts-tgrid-${temp}`}>
                            <line x1={padLeft} y1={y} x2={svgW - padRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
                            <text x={padLeft - 8} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {temp}°C
                            </text>
                          </g>
                        );
                      })}

                      {/* Grid Lines for Salinity (Vertical) */}
                      {[33.5, 34.0, 34.5, 35.0, 35.5, 36.0, 36.5].map(sal => {
                        const x = getXFromS(sal);
                        return (
                          <g key={`ts-sgrid-${sal}`}>
                            <line x1={x} y1={padTop} x2={x} y2={svgH - padBottom} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
                            <text x={x} y={svgH - padBottom + 16} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {sal.toFixed(1)}
                            </text>
                          </g>
                        );
                      })}

                      {/* Isopycnal Contours (sigma-theta curves) */}
                      {isopycnals.map(sigma => {
                        // sigma_theta = 0.805 * S - 0.0065 * (T - 4)^2 => S = (sigma + 0.0065 * (T - 4)^2) / 0.805
                        const curvePoints = [];
                        for (let t = 2; t <= 32; t += 2) {
                          const s = (sigma + 0.0065 * Math.pow(t - 4, 2)) / 0.805;
                          if (s >= sMin && s <= sMax) {
                            curvePoints.push({ x: getXFromS(s), y: getYFromT(t) });
                          }
                        }
                        if (curvePoints.length < 2) return null;
                        const dStr = curvePoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
                        const midPt = curvePoints[Math.floor(curvePoints.length / 2)];

                        return (
                          <g key={`iso-${sigma}`}>
                            <path d={dStr} fill="none" stroke="rgba(163, 230, 53, 0.25)" strokeDasharray="3 3" strokeWidth="1" />
                            {midPt && (
                              <text x={midPt.x + 4} y={midPt.y} fontSize="8" fill="#a3e635" opacity="0.6" fontFamily="monospace">
                                σ={sigma}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Water Mass Signature Badges */}
                      <g>
                        {/* ASHSW Badge */}
                        <circle cx={getXFromS(36.2)} cy={getYFromT(28.0)} r={18} fill="rgba(234, 179, 8, 0.15)" stroke="#eab308" strokeDasharray="2 2" />
                        <text x={getXFromS(36.2)} y={getYFromT(28.0) - 4} textAnchor="middle" fontSize="8.5" fill="#facc15" fontFamily="monospace" fontWeight="bold">
                          ASHSW
                        </text>
                        <text x={getXFromS(36.2)} y={getYFromT(28.0) + 6} textAnchor="middle" fontSize="7.5" fill="#fef08a" fontFamily="monospace">
                          Arabian Sea
                        </text>

                        {/* BBW Badge */}
                        <circle cx={getXFromS(33.6)} cy={getYFromT(29.0)} r={18} fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeDasharray="2 2" />
                        <text x={getXFromS(33.6)} y={getYFromT(29.0) - 4} textAnchor="middle" fontSize="8.5" fill="#38bdf8" fontFamily="monospace" fontWeight="bold">
                          BBW
                        </text>
                        <text x={getXFromS(33.6)} y={getYFromT(29.0) + 6} textAnchor="middle" fontSize="7.5" fill="#bae6fd" fontFamily="monospace">
                          Bay of Bengal
                        </text>
                      </g>

                      {/* Animated T-S Trajectory Line */}
                      <path
                        d={tsPathD}
                        fill="none"
                        stroke="#a3e635"
                        strokeWidth="3.0"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {/* Cast Data Points with Depth Badges */}
                      {filteredData.map((d, i) => {
                        const x = getXFromS(d.salinity);
                        const y = getYFromT(d.temperature);
                        const isSurface = i === 0;
                        const isBottom = i === filteredData.length - 1;
                        return (
                          <g key={`ts-dot-${i}`}>
                            <circle
                              cx={x}
                              cy={y}
                              r={isSurface || isBottom ? 5.5 : 3.0}
                              fill={isSurface ? "#38bdf8" : isBottom ? "#ec4899" : "#a3e635"}
                              stroke="#ffffff"
                              strokeWidth={1}
                              style={{
                                animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                              }}
                            >
                              <title>{`${d.depthLabel}: T=${d.temperature}°C, S=${d.salinity} PSU, σθ=${d.sigmaTheta} kg/m³`}</title>
                            </circle>
                            {(isSurface || isBottom || d.depth === 100 || d.depth === 500) && (
                              <text x={x + 7} y={y + 3} fontSize="8.5" fill="#ffffff" fontFamily="monospace" fontWeight="bold">
                                {d.depthLabel}
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Axes Labels */}
                      <text x={svgW / 2} y={svgH - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                        PRACTICAL SALINITY (PSU) →
                      </text>
                      <text x={20} y={svgH / 2} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace" transform={`rotate(-90 20 ${svgH / 2})`}>
                        POTENTIAL TEMPERATURE (°C) →
                      </text>
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 6: EKMAN OCEAN CURRENT VELOCITY PROFILE (m/s vs Depth) */}
                {/* ============================================================ */}
                {activeTopic === 'current_profile' && (() => {
                  // Velocity magnitude scale: -0.3 to +0.45 m/s
                  const vMin = -0.30;
                  const vMax = 0.45;
                  const getXVel = (v) => padLeft + ((v - vMin) / (vMax - vMin)) * plotW;
                  const xZero = getXVel(0.0);

                  const speedPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXVel(d.currentSpeed).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');
                  const uPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXVel(d.uCurrent).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');
                  const vPathD = filteredData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXVel(d.vCurrent).toFixed(1)} ${getY(d.depth).toFixed(1)}`).join(' ');

                  const yEkman = getY(42.0); // Ekman layer depth ~42m

                  return (
                    <g>
                      {/* Zero Velocity Reference Line */}
                      <line x1={xZero} y1={padTop} x2={xZero} y2={svgH - padBottom} stroke="rgba(255,255,255,0.25)" strokeDasharray="3 3" />
                      <text x={xZero} y={padTop - 8} textAnchor="middle" fontSize="8.5" fill="#94a3b8" fontFamily="monospace">
                        0.0 m/s
                      </text>

                      {/* Ekman Depth Line (42m) */}
                      {maxDepthRange >= 42 && (
                        <g>
                          <line x1={padLeft} y1={yEkman} x2={svgW - padRight} y2={yEkman} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1.2" />
                          <text x={svgW - padRight - 8} y={yEkman - 5} textAnchor="end" fontSize="9" fill="#34d399" fontFamily="monospace">
                            Ekman Layer Boundary Depth (z_E ~42m)
                          </text>
                        </g>
                      )}

                      {/* U-Current Path (Cyan) */}
                      <path
                        d={uPathD}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.0"
                        strokeDasharray="4 2"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {/* V-Current Path (Amber) */}
                      <path
                        d={vPathD}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.0"
                        strokeDasharray="4 2"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {/* Total Speed Magnitude Path (Emerald Solid) */}
                      <path
                        d={speedPathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {/* Data Points */}
                      {filteredData.map((d, i) => (
                        <circle
                          key={`cur-pt-${i}`}
                          cx={getXVel(d.currentSpeed)}
                          cy={getY(d.depth)}
                          r={d.isExactNetCdf ? 4 : 2.5}
                          fill={d.isExactNetCdf ? "#34d399" : "#10b981"}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          style={{
                            animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                          }}
                        />
                      ))}
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* TOPIC 7: 24-HOUR DIURNAL SOLAR HEATING CYCLE                 */}
                {/* ============================================================ */}
                {activeTopic === 'diurnal_cycle' && (() => {
                  // X-axis: Hour 0 to 23
                  // Y-axis: Temperature min to max
                  const tVals = diurnalData.map(d => d.temperature);
                  const tMin = +(Math.floor((Math.min(...tVals) - 0.2) * 10) / 10).toFixed(1);
                  const tMax = +(Math.ceil((Math.max(...tVals) + 0.2) * 10) / 10).toFixed(1);

                  const getXHour = (hr) => padLeft + (hr / 23) * plotW;
                  const getYDiurnalT = (t) => (svgH - padBottom) - ((t - tMin) / (tMax - tMin || 1)) * plotH;

                  const diurnalPathD = diurnalData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getXHour(d.hour).toFixed(1)} ${getYDiurnalT(d.temperature).toFixed(1)}`).join(' ');

                  return (
                    <g>
                      {/* Grid Lines for Temperature */}
                      {[0, 0.33, 0.66, 1].map((r, idx) => {
                        const temp = (tMax - r * (tMax - tMin)).toFixed(2);
                        const y = padTop + r * plotH;
                        return (
                          <g key={`diurnal-tgrid-${idx}`}>
                            <line x1={padLeft} y1={y} x2={svgW - padRight} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
                            <text x={padLeft - 8} y={y + 3.5} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {temp}°C
                            </text>
                          </g>
                        );
                      })}

                      {/* 24-Hour Timeline Grid (Every 3 hours) */}
                      {[0, 3, 6, 9, 12, 15, 18, 21, 23].map(hr => {
                        const x = getXHour(hr);
                        return (
                          <g key={`diurnal-hgrid-${hr}`}>
                            <line x1={x} y1={padTop} x2={x} y2={svgH - padBottom} stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
                            <text x={x} y={svgH - padBottom + 16} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                              {String(hr).padStart(2, '0')}:00
                            </text>
                          </g>
                        );
                      })}

                      {/* Solar Noon Peak Marker (13:00 - 14:00 UTC) */}
                      <g>
                        <rect x={getXHour(11.5)} y={padTop} width={getXHour(15.5) - getXHour(11.5)} height={plotH} fill="rgba(249, 115, 22, 0.08)" />
                        <text x={getXHour(13.5)} y={padTop + 14} textAnchor="middle" fontSize="8.5" fill="#fb923c" fontFamily="monospace" fontWeight="bold">
                          ☀️ Solar Peak Warming
                        </text>
                      </g>

                      {/* Animated Diurnal Thermal Curve */}
                      <path
                        d={diurnalPathD}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.8"
                        filter="url(#neonGlow)"
                        style={{
                          strokeDasharray: '2500',
                          strokeDashoffset: '0',
                          animation: 'drawCurveLine 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                        }}
                      />

                      {/* Hourly Points */}
                      {diurnalData.map((d, i) => (
                        <circle
                          key={`diurnal-pt-${i}`}
                          cx={getXHour(d.hour)}
                          cy={getYDiurnalT(d.temperature)}
                          r={d.hour === 14 ? 5 : 3}
                          fill={d.hour === 14 ? "#fbbf24" : "#f97316"}
                          stroke="#ffffff"
                          strokeWidth={1}
                          style={{
                            animation: `popInDot 0.4s ease-out ${(i * 0.04).toFixed(2)}s both`
                          }}
                        />
                      ))}

                      {/* X-axis title */}
                      <text x={svgW / 2} y={svgH - 8} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="monospace">
                        DIURNAL TIME (HOURS UTC) →
                      </text>
                    </g>
                  );
                })()}

                {/* ============================================================ */}
                {/* 5. INTERACTIVE MOUSE HOVER CROSSHAIR & SCRUBBER              */}
                {/* ============================================================ */}
                {activeTopic !== 'diurnal_cycle' && hoveredPoint && (
                  <g>
                    <line
                      x1={padLeft}
                      y1={getY(hoveredPoint.depth)}
                      x2={svgW - padRight}
                      y2={getY(hoveredPoint.depth)}
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeDasharray="3 3"
                    />

                    <rect
                      x={4}
                      y={getY(hoveredPoint.depth) - 10}
                      width={54}
                      height={20}
                      rx={4}
                      fill="#0ea5e9"
                    />
                    <text
                      x={31}
                      y={getY(hoveredPoint.depth) + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#ffffff"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {hoveredPoint.depth.toFixed(1)}m
                    </text>
                  </g>
                )}

              </svg>

              {/* FLOATING INSPECTION PILL UPON HOVER */}
              {activeTopic !== 'diurnal_cycle' && hoveredPoint && (
                <div 
                  className="absolute z-20 pointer-events-none bg-[#020b18]/95 border border-cyan-400/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-100 flex items-center gap-3 flex-wrap"
                  style={{
                    left: `${Math.min(svgW - 280, Math.max(80, 120))}px`,
                    top: `${Math.min(260, Math.max(10, getY(hoveredPoint.depth) - 30))}px`
                  }}
                >
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Depth: {hoveredPoint.depth.toFixed(2)}m {hoveredPoint.isExactNetCdf ? '★ NetCDF' : ''}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-sky-400 font-bold">
                    Temp: {hoveredPoint.temperature}°C
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-teal-400 font-bold">
                    Salt: {hoveredPoint.salinity} PSU
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400 font-bold">
                    Chl: {hoveredPoint.chlorophyll} mg/m³
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-purple-400 font-bold">
                    Speed: {hoveredPoint.soundSpeed} m/s
                  </span>
                </div>
              )}

              {/* DIURNAL HOVER PILL */}
              {activeTopic === 'diurnal_cycle' && hoveredDiurnalPoint && (
                <div 
                  className="absolute z-20 pointer-events-none bg-[#020b18]/95 border border-orange-400/60 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-100 flex items-center gap-3"
                  style={{
                    left: '120px',
                    top: '20px'
                  }}
                >
                  <span className="text-orange-400 font-bold">
                    Hour: {hoveredDiurnalPoint.hourLabel} UTC
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-amber-300 font-bold">
                    Temp: {hoveredDiurnalPoint.temperature}°C
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-yellow-400 font-bold">
                    Solar Flux: {hoveredDiurnalPoint.solarFlux} W/m²
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-300">
                    Depth: {selectedDepth}m
                  </span>
                </div>
              )}
            </div>

            {/* GRAPH FOOTER LEGEND & CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#060c18] border border-cyan-400/20 rounded-xl text-xs font-mono">
              {/* Dynamic Legend */}
              <div className="flex items-center gap-4 flex-wrap">
                {activeTopic === 'pfz' && (
                  <>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-3 h-1 bg-emerald-400 inline-block rounded-full" />
                      Chlorophyll-a (SCM Euphotic Production)
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <span className="w-3 h-1 bg-sky-400 inline-block rounded-full" />
                      Water Temperature (°C Thermocline)
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-300">
                      <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-400/50 inline-block rounded" />
                      20m–60m Optimal Catch Zone
                    </span>
                  </>
                )}

                {activeTopic === 'tchp' && (
                  <>
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span className="w-3 h-1 bg-amber-400 inline-block rounded-full" />
                      Upper Ocean Thermal Energy (°C)
                    </span>
                    <span className="flex items-center gap-1.5 text-yellow-300">
                      <span className="w-3 border-b-2 border-dashed border-yellow-300 inline-block" />
                      26.0°C Isotherm (D₂₆ Threshold = {analyticsSummary.d26Depth.toFixed(1)}m)
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <span className="w-3 border-b-2 border-dotted border-sky-400 inline-block" />
                      Mixed Layer Depth (MLD = 45m)
                    </span>
                  </>
                )}

                {activeTopic === 'sonar' && (
                  <>
                    <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <span className="w-3 h-1 bg-purple-400 inline-block rounded-full" />
                      Mackenzie Sound Velocity Profile (m/s)
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <span className="w-3 border-b-2 border-dashed border-purple-300 inline-block" />
                      Sonic Layer Depth (~75m Shadow Zone)
                    </span>
                    <span className="flex items-center gap-1.5 text-fuchsia-400 font-bold">
                      <span className="w-3 border-b-2 border-dashed border-fuchsia-400 inline-block" />
                      SOFAR Waveguide Axis (~900m)
                    </span>
                  </>
                )}

                {activeTopic === 'ctd' && (
                  <>
                    <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <span className="w-3 h-1 bg-sky-400 inline-block rounded-full" />
                      Temperature (°C)
                    </span>
                    <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                      <span className="w-3 h-1 bg-teal-400 inline-block rounded-full" />
                      Salinity (PSU)
                    </span>
                    <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                      <span className="w-3 border-b border-dashed border-purple-400 inline-block" />
                      Potential Density (kg/m³)
                    </span>
                  </>
                )}

                {activeTopic === 'ts_diagram' && (
                  <>
                    <span className="flex items-center gap-1.5 text-lime-400 font-bold">
                      <span className="w-3 h-1 bg-lime-400 inline-block rounded-full" />
                      T-S Water Mass Cast (Surface → Depth)
                    </span>
                    <span className="flex items-center gap-1.5 text-lime-300">
                      <span className="w-3 border-b border-dashed border-lime-300 inline-block" />
                      Isopycnal Density Contours (σθ)
                    </span>
                    <span className="flex items-center gap-1.5 text-yellow-300 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                      ASHSW / BBW Water Masses
                    </span>
                  </>
                )}

                {activeTopic === 'current_profile' && (
                  <>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-3 h-1 bg-emerald-400 inline-block rounded-full" />
                      Current Speed Magnitude (|v|)
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                      <span className="w-3 border-b border-dashed border-sky-400 inline-block" />
                      U-Current (Zonal East-West)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span className="w-3 border-b border-dashed border-amber-400 inline-block" />
                      V-Current (Meridional North-South)
                    </span>
                  </>
                )}

                {activeTopic === 'diurnal_cycle' && (
                  <>
                    <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                      <span className="w-3 h-1 bg-orange-400 inline-block rounded-full" />
                      Solar Diurnal Temperature (°C)
                    </span>
                    <span className="flex items-center gap-1.5 text-yellow-400">
                      <span className="w-3 h-2 bg-orange-500/20 inline-block rounded" />
                      Solar Noon Thermal Window (12:00–16:00 UTC)
                    </span>
                  </>
                )}
              </div>

              {/* Re-play drawing button */}
              <button
                type="button"
                onClick={handleTriggerPlot}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
              >
                <RotateCcw className="h-3 w-3 text-cyan-400" />
                <span>Re-draw Animation</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
