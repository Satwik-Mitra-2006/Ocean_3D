import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import Sidebar from './components/Sidebar';
import OceanScene from './components/OceanScene';
import DataPanel from './components/DataPanel';
import TimeControls from './components/TimeControls';
import DataCharts from './components/DataCharts';
import SettingsModal from './components/SettingsModal';
import OceanAIExplainer from './components/OceanAIExplainer';
import { 
  OBSERVATION_STATIONS, 
  getStationObservationAtTime,
  generateTimeSeriesData,
  generateDepthProfileData
} from './data/mockOceanData';
import { oceanDataService } from './services/oceanDataService';
import './App.css';

export default function App() {
  // Navigation & Modal state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Ocean Layers state
  const [layers, setLayers] = useState({
    sst: true,
    salinity: true,
    currents: true,
    waves: false,
    observations: true,
  });

  // Layer & Visual controls
  const [selectedDepth, setSelectedDepth] = useState(0.49); // 0.49m (first real Copernicus NetCDF depth)
  const [opacity, setOpacity] = useState(0.85);
  const [colorScale, setColorScale] = useState('turbo');
  const [primaryVariable, setPrimaryVariable] = useState('sst');
  const [selectedModel, setSelectedModel] = useState('incois-roms');
  const [resetTrigger, setResetTrigger] = useState(0);

  // Time dimension state (0 to 24 hours)
  const [currentTimeHour, setCurrentTimeHour] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);

  // Real Copernicus Backend Data & Metadata
  const [backendHealth, setBackendHealth] = useState({
    status: 'connecting',
    dataset_available: false,
    metadata: null,
  });
  const [gridPoints, setGridPoints] = useState([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState(true);
  const [availableDepths, setAvailableDepths] = useState([]);

  // Observation Stations state
  const [stations, setStations] = useState(OBSERVATION_STATIONS);
  const [selectedStation, setSelectedStation] = useState(OBSERVATION_STATIONS[0]);

  // Initial load: fetch health, Copernicus 3D grid, and stations
  const loadData = useCallback(async () => {
    setIsLoadingGrid(true);

    // 1. Health check & metadata
    const health = await oceanDataService.checkHealth();
    setBackendHealth(health);

    // 2. Fetch stations
    try {
      const stationList = await oceanDataService.getStations();
      if (stationList && stationList.length > 0) {
        setStations(stationList);
        setSelectedStation(stationList[0]);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }

    // 3. Fetch real available depths from Copernicus NetCDF
    try {
      const depthRes = await oceanDataService.getAvailableDepths();
      if (depthRes && depthRes.available_depths) {
        setAvailableDepths(depthRes.available_depths);
      }
    } catch (err) {
      console.error('Error fetching available depths:', err);
    }

    // 4. Fetch 3D Copernicus Marine grid
    try {
      const gridRes = await oceanDataService.getOceanGrid({ stride: 20 });
      if (gridRes && gridRes.points) {
        setGridPoints(gridRes.points);
      }
    } catch (err) {
      console.error('Error fetching Copernicus grid:', err);
    } finally {
      setIsLoadingGrid(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute live station observation adjusted for time slider
  const liveStationData = useMemo(() => {
    if (!selectedStation) return null;
    return getStationObservationAtTime(selectedStation, currentTimeHour);
  }, [selectedStation, currentTimeHour]);

  // Compute time series and vertical profiles for analytics charts
  const timeSeriesData = useMemo(() => {
    return generateTimeSeriesData(selectedStation, primaryVariable);
  }, [selectedStation, primaryVariable]);

  const depthProfileData = useMemo(() => {
    return generateDepthProfileData(selectedStation);
  }, [selectedStation]);

  // Station counts
  const stationsCount = useMemo(() => {
    return {
      total: stations.length,
      active: stations.filter(s => s.status === 'Active').length,
      warning: stations.filter(s => s.status === 'Warning').length,
      offline: stations.filter(s => s.status === 'Offline').length
    };
  }, [stations]);

  const handleResetCamera = () => {
    setResetTrigger(prev => prev + 1);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === '3d-ocean') {
      const el = document.getElementById('ocean-viewport');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLayers(prev => ({ ...prev, sst: true, currents: true, observations: true }));
    } else if (tabId === 'observations') {
      const el = document.getElementById('ocean-viewport');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLayers(prev => ({ ...prev, observations: true }));
    } else if (tabId === 'model-data') {
      const el = document.getElementById('analytics-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setLayers(prev => ({ ...prev, sst: true, salinity: true }));
    }
  };

  const isLiveCopernicus = Boolean(backendHealth?.dataset_available);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20">
      {/* Top Navigation Bar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        backendHealth={backendHealth}
        pointsCount={gridPoints.length}
      />

      {/* Main Scientific Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Section 8: Summary Cards */}
        <SummaryCards 
          selectedStationData={liveStationData} 
          stationsCount={stationsCount}
          backendHealth={backendHealth}
        />

        {/* Core Layout: Sidebar | 3D Ocean Scene | Right Data Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Ocean Layers & Model Control (3 cols) */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <Sidebar
              layers={layers}
              setLayers={setLayers}
              selectedDepth={selectedDepth}
              setSelectedDepth={setSelectedDepth}
              opacity={opacity}
              setOpacity={setOpacity}
              colorScale={colorScale}
              setColorScale={setColorScale}
              onResetView={handleResetCamera}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              primaryVariable={primaryVariable}
              setPrimaryVariable={setPrimaryVariable}
              stations={stations}
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
            />
          </div>

          {/* Center Column: 3D Visualization Area (6 cols) */}
          <div id="ocean-viewport" className="lg:col-span-6 flex flex-col gap-4 order-1 lg:order-2 scroll-mt-20">
            <OceanScene
              stations={stations}
              gridPoints={gridPoints}
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
              onSelectGridPoint={(pt) => setSelectedStation(pt)}
              layers={layers}
              selectedDepth={selectedDepth}
              opacity={opacity}
              colorScale={colorScale}
              primaryVariable={primaryVariable}
              currentTimeHour={currentTimeHour}
              resetTrigger={resetTrigger}
              availableDepths={availableDepths}
            />

            {/* Bottom Time Control (Directly below 3D viewport) */}
            <TimeControls
              currentTimeHour={currentTimeHour}
              setCurrentTimeHour={setCurrentTimeHour}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          </div>

          {/* Right Column: Information Panel (3 cols) */}
          <div className="lg:col-span-3 order-3">
            <DataPanel
              selectedStation={selectedStation}
              selectedStationData={liveStationData}
              onClearSelection={() => setSelectedStation(null)}
              allStations={stations}
              onSelectStation={setSelectedStation}
              backendHealth={backendHealth}
            />
          </div>

        </div>

        {/* Explainable AI (XAI) Marine Intelligence Assistant */}
        <OceanAIExplainer 
          stationOrPoint={liveStationData || selectedStation} 
        />

        {/* Section 7: Analytics & Validation Charts Area */}
        <div id="analytics-section" className="scroll-mt-20">
          <DataCharts
            timeSeriesData={timeSeriesData}
            depthProfileData={depthProfileData}
            selectedStation={selectedStation}
            currentTimeHour={currentTimeHour}
            isLiveCopernicus={isLiveCopernicus}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 mt-12 py-6 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Ocean3D Platform</span>
            <span>—</span>
            <span>Copernicus Marine NetCDF-4 Ocean Physical Reanalysis & In-Situ Observation System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className={isLiveCopernicus ? "text-emerald-600 font-bold" : "text-slate-400"}>
              {isLiveCopernicus ? "● Copernicus NetCDF Connected" : "○ Demo Mode"}
            </span>
            <span>•</span>
            <span>FastAPI: /api/ocean/grid</span>
            <span>•</span>
            <span className="text-sky-600 font-semibold">Smart India Hackathon</span>
          </div>
        </div>
      </footer>

      {/* Backend Integration & Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        backendHealth={backendHealth}
        onRefresh={loadData}
      />
    </div>
  );
}
