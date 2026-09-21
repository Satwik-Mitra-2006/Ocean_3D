import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Radio, 
  Info 
} from 'lucide-react';
import { COPERNICUS_REAL_DEPTHS } from './OceanCrossSection';
import { exportStationToCSV, exportStationToPDF, buildExportRecords } from '../utils/exportUtils';

const NETCDF_DATES = [
  '2026-06-17',
  '2026-06-18',
  '2026-06-19',
  '2026-06-20',
  '2026-06-21',
  '2026-06-22',
  '2026-06-23'
];

export default function ExportModal({
  isOpen,
  onClose,
  station,
  initialDate = '2026-06-23',
  initialDepth = 0.49
}) {
  const [date, setDate] = useState(initialDate);
  const [depth, setDepth] = useState('all');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen || !station) return null;

  const handleCSV = () => {
    try {
      exportStationToCSV(station, date, depth);
      setStatusMsg('CSV downloaded successfully!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg('CSV export failed.');
    }
  };

  const handlePDF = () => {
    try {
      exportStationToPDF(station, date, depth);
      setStatusMsg('PDF report generated & saved!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (e) {
      console.error(e);
      setStatusMsg('PDF export failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#03152d] border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Export Station Telemetry</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {station.name} ({station.code}) • {station.lat}°N, {station.lon}°E
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 flex flex-col gap-3.5">
          {/* 1. Date Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              Observation Date
            </label>
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#020b18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
            >
              {NETCDF_DATES.map(d => (
                <option key={d} value={d}>
                  {d} (Copernicus Daily Slice)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Depth Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              Depth Layer Scope
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              className="w-full bg-[#020b18] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
            >
              <option value="all">All Depths (0.49m to 11.40m — Full Column)</option>
              {COPERNICUS_REAL_DEPTHS.map(d => (
                <option key={d} value={String(d)}>
                  {d.toFixed(2)}m Layer ({d === 0.49 ? 'Surface Layer' : d === 11.40 ? 'Floor Layer' : 'Subsurface'})
                </option>
              ))}
            </select>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className="flex items-center gap-2 p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Format Selection Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              onClick={handleCSV}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold transition-all shadow cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Download CSV (.csv)</span>
            </button>

            <button
              type="button"
              onClick={handlePDF}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              <span>Download PDF (.pdf)</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-[#020b18] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Standards: NetCDF CF-1.8 & INCOIS Level-3 QC</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white cursor-pointer underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
