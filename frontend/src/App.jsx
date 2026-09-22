import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sliders, 
  BarChart2, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Maximize2 
} from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OceanScene from './components/OceanScene';
import DataPanel from './components/DataPanel';
import DataCharts from './components/DataCharts';
import ModelObservationComparisonCard from './components/ModelObservationComparisonCard';
import SettingsModal from './components/SettingsModal';
import TimeControls from './components/TimeControls';
import Footer from './components/Footer';
import { 
  OBSERVATION_STATIONS, 
  getStationObservationAtTime,
  generateTimeSeriesData,
  generateDepthProfileData,
  formatHourAmPm
} from './data/mockOceanData';
import { oceanDataService } from './services/oceanDataService';
import Ocean3DView from './views/Ocean3DView';
import ObservationsView from './views/ObservationsView';
import ModelDataView from './views/ModelDataView';
import AnalysisView from './views/AnalysisView';
import ExportDataView from './views/ExportDataView';
import ExportModal from './components/ExportModal';
import DataIngestionModal from './components/DataIngestionModal';
import ScienceTourModal from './components/ScienceTourModal';
import './App.css';

export default function App() {
  // Navigation & Modal state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isScienceTourOpen, setIsScienceTourOpen] = useState(false);

  // Responsive sidebar collapse controls
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Volumetric & Isosurface 3D Rendering State
  const [verticalExaggeration, setVerticalExaggeration] = useState(10);
  const [showIsosurface, setShowIsosurface] = useState(false);
  const [isosurfaceTemp, setIsosurfaceTemp] = useState(28.0);

  // Interactive Simulation & What-If Scenario State ('baseline' | 'cyclone' | 'monsoon')
  const [simulationScenario, setSimulationScenario] = useState('baseline');

  // Ocean Layers state
  const [layers, setLayers] = useState({
    stations: true,
    currents: true,
    coastline: true,
    bathymetry: false,
    grid: false,
  });

  // Layer & Visual controls
  const [selectedDepth, setSelectedDepth] = useState(0.49); // Default to real Copernicus surface layer
  const [opacity, setOpacity] = useState(0.85);
  const [colorScale, setColorScale] = useState('turbo');
  const [scaleType, setScaleType] = useState('linear');
  const [primaryVariable, setPrimaryVariable] = useState('thetao');

  // Data Source mode: 'model' (Numerical Model / Copernicus GLORYS12V1) or 'insitu' (In-Situ Observation Buoys)
  const [dataSource, setDataSource] = useState('model');

  // Time & Date dimension state (strictly bound to user dataset: 17/06/2026 to 23/06/2026)
  const [startDate, setStartDate] = useState('2026-06-17');
  const [endDate, setEndDate] = useState('2026-06-23');
  const [selectedDate, setSelectedDate] = useState('2026-06-19');
  const [currentTimeHour, setCurrentTimeHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Real Copernicus Backend Data & Metadata
  const [backendHealth, setBackendHealth] = useState({
    status: 'connecting',
    dataset_available: false,
    metadata: null,
  });
  const [gridPoints, setGridPoints] = useState([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [availableDepths, setAvailableDepths] = useState([
    0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40,
    25.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0
  ]);

  // Observation Stations state (Defaulting to Station CB01 - Coastal Radar matching mockup)
  const [stations, setStations] = useState(OBSERVATION_STATIONS);
  const [selectedStation, setSelectedStation] = useState(
    OBSERVATION_STATIONS.find(s => s.code === 'CB01') || OBSERVATION_STATIONS[3]
  );
  const [verticalProfile, setVerticalProfile] = useState([]);

  // Fetch real vertical profile when selected station changes
  const fetchStationProfile = useCallback(async (st, date = selectedDate) => {
    if (!st) return;
    try {
      const lat = st.lat ?? st.latitude ?? 10.57;
      const lon = st.lon ?? st.longitude ?? 72.63;
      const res = await oceanDataService.getVerticalProfile(lat, lon, st.id, date);
      if (res && res.profile && res.profile.length > 0) {
        setVerticalProfile(res.profile);
      }
    } catch (e) {
      console.warn('Error fetching station vertical profile:', e);
    }
  }, [selectedDate]);

  // Initial load: fetch health, available depths, stations, and grid
  const loadData = useCallback(async () => {
    setIsLoadingGrid(true);

    // 1. Health check & metadata
    const health = await oceanDataService.checkHealth();
    setBackendHealth(health);

    // 2. Fetch stations for initial date and selected depth
    try {
      const stationList = await oceanDataService.getStations({ date: selectedDate, depth: selectedDepth });
      if (stationList && stationList.length > 0) {
        setStations(stationList);
        const cb01 = stationList.find(s => s.code === 'CB01') || stationList[0];
        setSelectedStation(cb01);
        fetchStationProfile(cb01, selectedDate);
      }
    } catch (err) {
      console.error('Error fetching stations:', err);
    }

    // 3. Fetch real available depths from Copernicus NetCDF
    try {
      const depthRes = await oceanDataService.getAvailableDepths();
      if (depthRes && depthRes.available_depths && depthRes.available_depths.length > 0) {
        const fullDepths = Array.from(new Set([
          ...depthRes.available_depths,
          25.0, 50.0, 100.0, 200.0, 500.0, 1000.0, 2000.0
        ])).sort((a, b) => a - b);
        setAvailableDepths(fullDepths);
        setSelectedDepth(prev => fullDepths.includes(prev) ? prev : fullDepths[0]);
      }
    } catch (err) {
      console.error('Error fetching available depths:', err);
    }

    // 4. Fetch 3D Copernicus Marine grid
    try {
      const gridRes = await oceanDataService.getOceanGrid({ stride: 20, date: selectedDate, depth: selectedDepth });
      if (gridRes && gridRes.points) {
        setGridPoints(gridRes.points);
      }
    } catch (err) {
      console.error('Error fetching Copernicus grid:', err);
    } finally {
      setIsLoadingGrid(false);
    }
  }, [fetchStationProfile, selectedDate, selectedDepth]);

  useEffect(() => {
    loadData();
  }, []);

  // Synchronize stations, vertical profile, and 3D grid whenever selectedDate changes
  useEffect(() => {
    let isCancelled = false;

    async function syncDateData() {
      try {
        const updatedStations = await oceanDataService.getStations({
          date: selectedDate,
          depth: selectedDepth
        });
        if (!isCancelled && updatedStations && updatedStations.length > 0) {
          setStations(updatedStations);
          setSelectedStation(prev => {
            const currentCode = prev?.code || prev?.id;
            const found = updatedStations.find(s => s.code === currentCode || s.id === currentCode);
            return found || updatedStations[0];
          });
        }

        if (selectedStation) {
          const lat = selectedStation.lat ?? selectedStation.latitude ?? 10.57;
          const lon = selectedStation.lon ?? selectedStation.longitude ?? 72.63;
          const res = await oceanDataService.getVerticalProfile(lat, lon, selectedStation.id, selectedDate);
          if (!isCancelled && res && res.profile && res.profile.length > 0) {
            setVerticalProfile(res.profile);
          }
        }

        const gridRes = await oceanDataService.getOceanGrid({
          stride: 20,
          depth: selectedDepth,
          date: selectedDate
        });
        if (!isCancelled && gridRes && gridRes.points) {
          setGridPoints(gridRes.points);
        }
      } catch (err) {
        console.warn('Date synchronization notice:', err);
      }
    }

    syncDateData();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate, selectedDepth]);

  // Handle station selection
  const handleSelectStation = useCallback((st) => {
    setSelectedStation(st);
    fetchStationProfile(st, selectedDate);
  }, [fetchStationProfile, selectedDate]);

  // Compute live station observation adjusted for selected depth & time & scenario (strictly exact to NetCDF dataset)
  const liveStationData = useMemo(() => {
    if (!selectedStation) return null;
    let base = getStationObservationAtTime(selectedStation, currentTimeHour, selectedDate || '2026-06-23', selectedDepth);

    // If we have a vertical profile with an exact layer match, sync it safely
    if (verticalProfile && verticalProfile.length > 0) {
      const match = verticalProfile.find(curr => Math.abs(curr.depth - selectedDepth) <= 0.15);
      if (match && match.depth > 0) {
        base = {
          ...base,
          depth: Number(selectedDepth),
          temperature: Number(match.temperature),
          currentTemp: Number(match.temperature),
          salinity: Number(match.salinity),
          currentSalinity: Number(match.salinity),
          current_speed: Number(match.current_speed ?? base.current_speed),
          currentSpeed: Number(match.current_speed ?? base.current_speed),
          density: Number(match.density ?? base.density),
          u_current: match.u_current ?? base.u_current,
          v_current: match.v_current ?? base.v_current
        };
      }
    }

    // Apply What-If Scenario Shifts
    if (simulationScenario === 'cyclone') {
      const isBayOfBengal = (base.lon ?? base.longitude ?? 80) >= 78.0;
      if (isBayOfBengal) {
        base = {
          ...base,
          status: 'Warning',
          temperature: +(base.temperature - 2.2).toFixed(1), // Cold wake
          wave_height: +(Math.max(base.wave_height || 2.0, 6.4)).toFixed(1), // Storm surge
          current_speed: +(Math.max(base.current_speed || 0.5, 2.75)).toFixed(2),
          pressure: 942.0
        };
      }
    } else if (simulationScenario === 'monsoon') {
      const isWestCoast = (base.lon ?? base.longitude ?? 72) <= 78.0;
      if (isWestCoast) {
        base = {
          ...base,
          temperature: +(base.temperature - 3.2).toFixed(1), // Coastal upwelling
          salinity: +(base.salinity + 0.7).toFixed(1),
          current_speed: +(Math.max(base.current_speed || 0.4, 1.85)).toFixed(2),
          wave_height: 3.2
        };
      }
    }

    // Synchronize exact selected date and time in AM/PM timestamp
    const dateFormatted = selectedDate || '2026-06-23';
    const amPmStr = formatHourAmPm(currentTimeHour);
    const hourStr = String(Math.floor(currentTimeHour)).padStart(2, '0');
    base = {
      ...base,
      timeAmPm: amPmStr,
      timestamp: `${dateFormatted} • ${amPmStr} UTC (${hourStr}:00)`
    };

    return base;
  }, [selectedStation, currentTimeHour, selectedDepth, verticalProfile, simulationScenario, selectedDate]);

  // Compute time series and vertical profiles for analytics charts (dynamically responds to date AND depth)
  const timeSeriesData = useMemo(() => {
    return generateTimeSeriesData(selectedStation, primaryVariable, selectedDate || '2026-06-23', selectedDepth);
  }, [selectedStation, primaryVariable, selectedDate, selectedDepth]);

  const depthProfileData = useMemo(() => {
    return generateDepthProfileData(selectedStation);
  }, [selectedStation]);

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">

      {/* 1. RELATIVE ELEVATED CONTAINER FOR ALL UI COMPONENTS & GLASS PANELS */}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        {/* TOP NAVBAR */}
        <Navbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenIngest={() => setIsIngestModalOpen(true)}
          onOpenScienceTour={() => setIsScienceTourOpen(true)}
          backendHealth={backendHealth}
          pointsCount={gridPoints.length || 1122}
        />

      {/* 2. MAIN APPLICATION VIEWS (ROUTED BY activeTab) */}
      <main className="flex-1 w-full px-3 sm:px-4 py-3 flex flex-col gap-3 max-w-[1920px] mx-auto">
        
        {/* TAB 1: UNIFIED DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* 3-COLUMN VIEWPORT LAYOUT MATCHING REFERENCE MOCKUP */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch w-full relative">
              
              {/* Left Column: Sidebar Parameters & Controls */}
              {isLeftCollapsed ? (
                <div className="hidden lg:flex flex-col justify-start">
                  <button
                    type="button"
                    onClick={() => setIsLeftCollapsed(false)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                    title="Expand Controls Sidebar"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="[writing-mode:vertical-lr] tracking-wider uppercase text-[10px] font-mono py-2">Controls</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col relative transition-all duration-300">
                  {/* Quick Collapse Header */}
                  <div className="hidden lg:flex items-center justify-between px-2 py-1 mb-1 text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-400/80 font-bold uppercase tracking-wider">Control Panel</span>
                    <button
                      type="button"
                      onClick={() => setIsLeftCollapsed(true)}
                      className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-500/20"
                      title="Collapse sidebar to expand 3D view"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Minimize</span>
                    </button>
                  </div>
                  <Sidebar
                    layers={layers}
                    setLayers={setLayers}
                    selectedDepth={selectedDepth}
                    setSelectedDepth={setSelectedDepth}
                    primaryVariable={primaryVariable}
                    setPrimaryVariable={setPrimaryVariable}
                    currentTimeHour={currentTimeHour}
                    setCurrentTimeHour={setCurrentTimeHour}
                    isPlaying={isPlaying}
                    setIsPlaying={setIsPlaying}
                    availableDepths={availableDepths}
                    opacity={opacity}
                    setOpacity={setOpacity}
                    stations={stations}
                    selectedStation={selectedStation}
                    onSelectStation={handleSelectStation}
                    startDate={startDate}
                    endDate={endDate}
                    selectedDate={selectedDate}
                    setStartDate={setStartDate}
                    setEndDate={setEndDate}
                    setSelectedDate={setSelectedDate}
                    dataSource={dataSource}
                    setDataSource={setDataSource}
                    verticalExaggeration={verticalExaggeration}
                    setVerticalExaggeration={setVerticalExaggeration}
                    showIsosurface={showIsosurface}
                    setShowIsosurface={setShowIsosurface}
                    isosurfaceTemp={isosurfaceTemp}
                    setIsosurfaceTemp={setIsosurfaceTemp}
                    colorScale={colorScale}
                    setColorScale={setColorScale}
                    scaleType={scaleType}
                    setScaleType={setScaleType}
                  />
                </div>
              )}

              {/* Center Viewport: 3D Earth Globe with Thermal Colormap & Depth Scrubber */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <OceanScene
                  stations={stations}
                  gridPoints={gridPoints}
                  selectedStation={liveStationData || selectedStation}
                  onSelectStation={handleSelectStation}
                  layers={layers}
                  selectedDepth={selectedDepth}
                  setSelectedDepth={setSelectedDepth}
                  opacity={opacity}
                  colorScale={colorScale}
                  primaryVariable={primaryVariable}
                  setPrimaryVariable={setPrimaryVariable}
                  currentTimeHour={currentTimeHour}
                  setCurrentTimeHour={setCurrentTimeHour}
                  availableDepths={availableDepths}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  isCyclone={simulationScenario === 'cyclone'}
                  isMonsoonUpwelling={simulationScenario === 'monsoon'}
                  startDate={startDate}
                  endDate={endDate}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  dataSource={dataSource}
                  setDataSource={setDataSource}
                  verticalExaggeration={verticalExaggeration}
                  showIsosurface={showIsosurface}
                  isosurfaceTemp={isosurfaceTemp}
                />

                {/* Model vs Observation In-Situ Validation Card */}
                <ModelObservationComparisonCard
                  station={liveStationData || selectedStation}
                  timeSeriesData={timeSeriesData}
                  currentTimeHour={currentTimeHour}
                  selectedDepth={selectedDepth}
                  setSelectedDepth={setSelectedDepth}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  simulationScenario={simulationScenario}
                  dataSource={dataSource}
                  setDataSource={setDataSource}
                />
              </div>

              {/* Right Column: Selected Station Telemetry Card & 7-Day Trend Chart */}
              {isRightCollapsed ? (
                <div className="hidden lg:flex flex-col justify-start">
                  <button
                    type="button"
                    onClick={() => setIsRightCollapsed(false)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105"
                    title="Expand Telemetry Panel"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="[writing-mode:vertical-lr] tracking-wider uppercase text-[10px] font-mono py-2">Telemetry</span>
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              ) : (
                <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col relative transition-all duration-300">
                  {/* Quick Collapse Header */}
                  <div className="hidden lg:flex items-center justify-between px-2 py-1 mb-1 text-[11px] text-slate-400">
                    <span className="font-mono text-cyan-400/80 font-bold uppercase tracking-wider">Live Telemetry</span>
                    <button
                      type="button"
                      onClick={() => setIsRightCollapsed(true)}
                      className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-500/20"
                      title="Collapse telemetry to expand 3D view"
                    >
                      <span>Minimize</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <DataPanel
                    selectedStation={selectedStation}
                    selectedStationData={liveStationData}
                    onClearSelection={() => handleSelectStation(stations[0])}
                    selectedDepth={selectedDepth}
                    setSelectedDepth={setSelectedDepth}
                    stations={stations}
                    onSelectStation={handleSelectStation}
                    backendHealth={backendHealth}
                    startDate={startDate}
                    endDate={endDate}
                    selectedDate={selectedDate}
                    currentTimeHour={currentTimeHour}
                    dataSource={dataSource}
                    setDataSource={setDataSource}
                    primaryVariable={primaryVariable}
                    setPrimaryVariable={setPrimaryVariable}
                  />
                </div>
              )}
            </div>

            {/* BOTTOM ROW: ANALYTICS & AI DIAGNOSIS */}
            <DataCharts
              verticalProfile={verticalProfile}
              depthProfileData={depthProfileData}
              timeSeriesData={timeSeriesData}
              selectedStation={liveStationData || selectedStation}
              isLiveCopernicus={Boolean(backendHealth.dataset_available)}
              dataSource={dataSource}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedDepth={selectedDepth}
              setSelectedDepth={setSelectedDepth}
            />

            {/* BOTTOM FOOTER: 3 PILLARS & MOES QUOTE */}
            <Footer />
          </>
        )}

        {/* TAB 2: DEDICATED 3D OCEAN VIEW */}
        {activeTab === '3d-ocean' && (
          <Ocean3DView
            stations={stations}
            gridPoints={gridPoints}
            selectedStation={liveStationData || selectedStation}
            onSelectStation={handleSelectStation}
            layers={layers}
            setLayers={setLayers}
            selectedDepth={selectedDepth}
            setSelectedDepth={setSelectedDepth}
            opacity={opacity}
            colorScale={colorScale}
            primaryVariable={primaryVariable}
            setPrimaryVariable={setPrimaryVariable}
            currentTimeHour={currentTimeHour}
            setCurrentTimeHour={setCurrentTimeHour}
            availableDepths={availableDepths}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            simulationScenario={simulationScenario}
            setSimulationScenario={setSimulationScenario}
            startDate={startDate}
            endDate={endDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dataSource={dataSource}
            setDataSource={setDataSource}
            verticalExaggeration={verticalExaggeration}
            showIsosurface={showIsosurface}
            isosurfaceTemp={isosurfaceTemp}
          />
        )}

        {/* TAB 3: OBSERVATIONS IN-SITU NETWORK */}
        {activeTab === 'observations' && (
          <ObservationsView
            stations={stations}
            selectedStation={liveStationData || selectedStation}
            onSelectStation={handleSelectStation}
            onNavigateTo3D={() => setActiveTab('dashboard')}
            selectedDepth={selectedDepth}
          />
        )}

        {/* TAB 4: COPERNICUS MODEL DATA EXPLORER */}
        {activeTab === 'model-data' && (
          <ModelDataView
            backendHealth={backendHealth}
            availableDepths={availableDepths}
            selectedStation={liveStationData || selectedStation}
            stations={stations}
            onSelectStation={handleSelectStation}
            selectedDepth={selectedDepth}
            setSelectedDepth={setSelectedDepth}
            verticalProfile={verticalProfile}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentTimeHour={currentTimeHour}
            setCurrentTimeHour={setCurrentTimeHour}
          />
        )}

        {/* TAB 5: OCEANOGRAPHIC ANALYSIS & STRATIFICATION */}
        {activeTab === 'analysis' && (
          <AnalysisView
            verticalProfile={verticalProfile}
            depthProfileData={depthProfileData}
            timeSeriesData={timeSeriesData}
            selectedStation={selectedStation}
            stations={stations}
            onSelectStation={handleSelectStation}
            isLiveCopernicus={Boolean(backendHealth.dataset_available)}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedDepth={selectedDepth}
            setSelectedDepth={setSelectedDepth}
          />
        )}

        {/* TAB 6: STATION DATA DOWNLOAD & EXPORT CENTER */}
        {activeTab === 'export-data' && (
          <ExportDataView
            stations={stations}
            selectedStation={selectedStation}
            onSelectStation={handleSelectStation}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedDepth={selectedDepth}
            setSelectedDepth={setSelectedDepth}
            verticalProfile={verticalProfile}
            timeSeriesData={timeSeriesData}
            simulationScenario={simulationScenario}
            dataSource={dataSource}
            setDataSource={setDataSource}
          />
        )}

      </main>

      {/* Quick Station Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        station={selectedStation}
        initialDate={selectedDate}
        initialDepth={selectedDepth}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendHealth={backendHealth}
        selectedDepth={selectedDepth}
        setSelectedDepth={setSelectedDepth}
        colorScale={colorScale}
        setColorScale={setColorScale}
      />

      {/* Multi-format Ocean Data Ingestion Modal (.nc, .csv, .txt, OPeNDAP) */}
      <DataIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestSuccess={(res) => {
          console.log('Ingested ocean dataset:', res);
          loadData();
        }}
      />

      {/* Public Science Outreach & Interactive Storytelling Walkthrough */}
      <ScienceTourModal
        isOpen={isScienceTourOpen}
        onClose={() => setIsScienceTourOpen(false)}
        onSelectStation={handleSelectStation}
        stations={stations}
      />
      </div>

    </div>
  );
}
