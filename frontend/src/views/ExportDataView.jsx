import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Radio, 
  Compass, 
  Activity, 
  Thermometer, 
  Droplets, 
  Waves,
  ArrowDownToLine,
  Filter,
  Sparkles,
  Info,
  TrendingUp,
  GitCompare,
  BarChart2
} from 'lucide-react';
import { OBSERVATION_STATIONS, generateDepthProfileData, generateTimeSeriesData } from '../data/mockOceanData';
import { COPERNICUS_REAL_DEPTHS } from '../components/OceanCrossSection';
import ModelObservationComparisonCard from '../components/ModelObservationComparisonCard';
import DataCharts from '../components/DataCharts';
import { 
  buildExportRecords, 
  buildComparisonData, 
  exportStationToCSV, 
  exportStationToPDF 
} from '../utils/exportUtils';

const NETCDF_DATES = [
  '2026-06-17',
  '2026-06-18',
  '2026-06-19',
  '2026-06-20',
  '2026-06-21',
  '2026-06-22',
  '2026-06-23'
];

export default function ExportDataView({
  stations = OBSERVATION_STATIONS,
  selectedStation = null,
  onSelectStation = null,
  selectedDate: propDate = '2026-06-23',
  setSelectedDate: propSetDate = null,
  selectedDepth: propDepth = 0.49,
  setSelectedDepth: propSetDepth = null,
  verticalProfile = [],
  timeSeriesData: propTimeSeries = [],
  simulationScenario = 'baseline',
  dataSource = 'model',
  setDataSource = null
}) {
  const [internalStationId, setInternalStationId] = useState(
    selectedStation?.id || stations[3]?.id || 'station-04'
  );
  const [internalDate, setInternalDate] = useState(propDate || '2026-06-23');
  const [internalDepth, setInternalDepth] = useState('all'); // 'all' or numeric
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [lastExported, setLastExported] = useState(null);

  const activeDate = propSetDate ? propDate : internalDate;
  const setActiveDate = propSetDate || setInternalDate;

  // Active station object
  const currentStn = useMemo(() => {
    return stations.find(s => s.id === (selectedStation?.id || internalStationId)) || stations[0];
  }, [stations, selectedStation, internalStationId]);

  // Derived vertical and time series data
  const activeTimeSeries = useMemo(() => {
    if (propTimeSeries && propTimeSeries.length > 0) return propTimeSeries;
    return generateTimeSeriesData(currentStn, 'thetao', activeDate, propDepth || 0.49);
  }, [propTimeSeries, currentStn, activeDate, propDepth]);

  const activeDepthProfile = useMemo(() => {
    if (verticalProfile && verticalProfile.length > 0) return verticalProfile;
    return generateDepthProfileData(currentStn);
  }, [verticalProfile, currentStn]);

  // Live preview records for CSV / PDF export
  const records = useMemo(() => {
    return buildExportRecords(currentStn, activeDate, internalDepth);
  }, [currentStn, activeDate, internalDepth]);

  // Handle CSV Download
  const handleDownloadCSV = () => {
    setIsExportingCSV(true);
    try {
      exportStationToCSV(currentStn, activeDate, internalDepth);
      setLastExported({ type: 'CSV', time: new Date().toLocaleTimeString() });
    } catch (e) {
      console.error('CSV export failed:', e);
    } finally {
      setTimeout(() => setIsExportingCSV(false), 600);
    }
  };

  // Handle PDF Download
  const handleDownloadPDF = () => {
    setIsExportingPDF(true);
    try {
      exportStationToPDF(currentStn, activeDate, internalDepth);
      setLastExported({ type: 'PDF', time: new Date().toLocaleTimeString() });
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      setTimeout(() => setIsExportingPDF(false), 800);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-4 max-w-7xl mx-auto py-2">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-[#03152d]/85 backdrop-blur-md rounded-2xl border border-cyan-500/25 p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Station Telemetry, Model Comparison & Data Export
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Copernicus + INCOIS
                </span>
              </h1>
              <p className="text-xs text-slate-300">
                Explore analytical graphs, model vs in-situ comparison tables, and download verified telemetry in CSV or PDF format.
              </p>
            </div>
          </div>
        </div>

        {/* Export Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={isExportingCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{isExportingCSV ? 'Generating CSV...' : 'Download CSV (.csv)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/30 cursor-pointer disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            <span>{isExportingPDF ? 'Building PDF...' : 'Download PDF Report (.pdf)'}</span>
          </button>
        </div>
      </div>

      {/* 2. PARAMETERS CONFIGURATION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Param 1: Station Selector */}
        <div className="bg-[#03152d]/85 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Radio className="h-3.5 w-3.5" />
              1. Select Station ({stations.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">{currentStn?.code}</span>
          </div>
          
          <select
            value={currentStn?.id}
            onChange={(e) => {
              setInternalStationId(e.target.value);
              const found = stations.find(s => s.id === e.target.value);
              if (found && onSelectStation) onSelectStation(found);
            }}
            className="w-full bg-[#020b18] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {stations.map(st => (
              <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                {st.name} ({st.code}) — {st.type || 'Buoy'}
              </option>
            ))}
          </select>

          {/* Station details mini-badge */}
          <div className="bg-[#020b18]/70 rounded-xl p-2 border border-slate-800 text-[11px] font-mono flex flex-col gap-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Position:</span>
              <span className="text-cyan-300 font-bold">{currentStn?.lat}°N, {currentStn?.lon}°E</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Region:</span>
              <span className="text-slate-200">{currentStn?.region || 'Indian Ocean'}</span>
            </div>
          </div>
        </div>

        {/* Param 2: Date Selector (Copernicus 7-Day Slices) */}
        <div className="bg-[#03152d]/85 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Calendar className="h-3.5 w-3.5" />
              2. Observation Date
            </span>
            <span className="text-[10px] font-mono text-cyan-300">{activeDate}</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {NETCDF_DATES.map(d => {
              const isSelected = activeDate === d;
              const shortLabel = d.slice(5);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setActiveDate(d)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 font-bold ring-1 ring-sky-300'
                      : 'bg-[#020b18]/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Param 3: Depth Level Selector */}
        <div className="bg-[#03152d]/85 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-4 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Layers className="h-3.5 w-3.5" />
              3. Vertical Depth Scope
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {internalDepth === 'all' ? 'All 9 Layers' : `${internalDepth}m`}
            </span>
          </div>

          <select
            value={internalDepth}
            onChange={(e) => setInternalDepth(e.target.value)}
            className="w-full bg-[#020b18] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
          >
            <option value="all">All Depths (0.49m to 11.40m — Full Column)</option>
            {COPERNICUS_REAL_DEPTHS.map(d => (
              <option key={d} value={String(d)}>
                {d.toFixed(2)}m Layer ({d === 0.49 ? 'Surface Layer' : d === 11.40 ? 'Floor Layer' : 'Subsurface'})
              </option>
            ))}
          </select>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#020b18]/70 p-2 rounded-xl border border-slate-800">
            <span>Export Scope:</span>
            <span className="text-cyan-300 font-bold">{records.length} layer{records.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* 3. SUITE 1: NUMERICAL MODEL VS IN-SITU COMPARISON TABLE & DIURNAL TELEMETRY GRAPHS */}
      <div className="w-full flex flex-col gap-2">
        <ModelObservationComparisonCard
          station={currentStn}
          timeSeriesData={activeTimeSeries}
          selectedDepth={internalDepth === 'all' ? (propDepth || 0.49) : Number(internalDepth)}
          selectedDate={activeDate}
          setSelectedDate={setActiveDate}
          simulationScenario={simulationScenario}
          dataSource={dataSource}
          setDataSource={setDataSource}
        />
      </div>

      {/* 4. SUITE 2: VERTICAL DEPTH PROFILE GRAPHS (TEMPERATURE, SALINITY, SPEED VS DEPTH TO 2000M) */}
      <div className="w-full flex flex-col gap-2">
        <DataCharts
          verticalProfile={activeDepthProfile}
          depthProfileData={activeDepthProfile}
          timeSeriesData={activeTimeSeries}
          selectedStation={currentStn}
          isLiveCopernicus={true}
          dataSource={dataSource}
          selectedDate={activeDate}
          setSelectedDate={setActiveDate}
        />
      </div>

      {/* 5. STRATIFIED DEPTH PROFILE EXPORT TABLE (DOWNLOAD SCOPE) */}
      <div className="bg-[#03152d]/85 backdrop-blur-md rounded-2xl border border-cyan-500/25 p-4 shadow-2xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Vertical Stratification Depth Profile Table (Export Scope)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-cyan-300 border border-sky-500/40">
                {records.length} layer{records.length > 1 ? 's' : ''} selected
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Calibrated oceanographic variables across the active vertical depth scope for date {activeDate}.
            </p>
          </div>

          {lastExported && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Exported {lastExported.type} at {lastExported.time}</span>
            </div>
          )}
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#020b18] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-3.5 py-2.5">Depth</th>
                <th className="px-3.5 py-2.5">Temperature</th>
                <th className="px-3.5 py-2.5">Salinity</th>
                <th className="px-3.5 py-2.5">Density</th>
                <th className="px-3.5 py-2.5">Current Velocity</th>
                <th className="px-3.5 py-2.5">U / V Vector</th>
                <th className="px-3.5 py-2.5">Heading</th>
                <th className="px-3.5 py-2.5">Wave Ht</th>
                <th className="px-3.5 py-2.5">Model vs Buoy Bias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
              {records.map((r, idx) => (
                <tr 
                  key={`record-${idx}`}
                  className="hover:bg-sky-950/30 transition-colors"
                >
                  <td className="px-3.5 py-2 text-cyan-300 font-bold">{r.depth_m.toFixed(2)}m</td>
                  <td className="px-3.5 py-2 text-amber-300 font-semibold">{r.temperature_c.toFixed(2)} °C</td>
                  <td className="px-3.5 py-2 text-teal-300">{r.salinity_psu.toFixed(2)} PSU</td>
                  <td className="px-3.5 py-2 text-pink-300">{r.density_kg_m3.toFixed(2)} kg/m³</td>
                  <td className="px-3.5 py-2 text-sky-200">{r.current_speed_ms.toFixed(3)} m/s</td>
                  <td className="px-3.5 py-2 text-slate-400">{r.u_current_ms} / {r.v_current_ms}</td>
                  <td className="px-3.5 py-2 text-slate-300">{r.current_direction}</td>
                  <td className="px-3.5 py-2 text-slate-300">{r.wave_height_m.toFixed(2)} m</td>
                  <td className="px-3.5 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      Math.abs(r.model_bias_c) < 0.25 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                    }`}>
                      {r.model_bias_c > 0 ? '+' : ''}{r.model_bias_c.toFixed(2)} °C
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Provenance Note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-[#020b18]/60 p-3 rounded-xl border border-slate-800/80">
          <Info className="h-4 w-4 text-sky-400 shrink-0" />
          <span>
            The exported CSV and PDF files include the comparison table, 7-day trend metrics, and full depth stratification compliant with Copernicus Marine Service and INCOIS Indian Ocean Moored Buoy standards.
          </span>
        </div>
      </div>
    </div>
  );
}
