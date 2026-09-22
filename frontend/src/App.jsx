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
import NavigationSidebar from './components/NavigationSidebar';
import Ocean3DView from './views/Ocean3DView';
import ModelStudioView from './views/ModelStudioView';
import ObservationsView from './views/ObservationsView';
import ModelDataView from './views/ModelDataView';
import AnalysisView from './views/AnalysisView';
import ExportDataView from './views/ExportDataView';
import ExportModal from './components/ExportModal';
import DataIngestionModal from './components/DataIngestionModal';
import ScienceTourModal from './components/ScienceTourModal';
import FloatingChatbot from './components/FloatingChatbot';
import './App.css';

export default function App() {
  // Navigation & Modal state
  const [activeAspect, setActiveAspect] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('aspect');
      return p || '3d-twin';
    } catch {
      return '3d-twin';
    }
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
    <div className="min-h-screen bg-[#070913] text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white relative">

      {/* 1. LEFT VERTICAL NAVIGATION SIDEBAR RAIL (OPTION A) */}
      <NavigationSidebar
        activeAspect={activeAspect}
        setActiveAspect={setActiveAspect}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenScienceTour={() => setIsScienceTourOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        backendHealth={backendHealth}
        simulationScenario={simulationScenario}
        setSimulationScenario={setSimulationScenario}
      />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* TOP STREAMLINED NAVBAR */}
        <Navbar 
          activeTab={activeAspect}
          setActiveTab={setActiveAspect}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenIngest={() => setIsIngestModalOpen(true)}
          onOpenScienceTour={() => setIsScienceTourOpen(true)}
          backendHealth={backendHealth}
          pointsCount={gridPoints.length || 1122}
          activeStation={liveStationData || selectedStation}
        />

        {/* 3. DEDICATED WORKSPACE ASPECTS */}
        <main className="flex-1 w-full px-3 sm:px-5 py-3 flex flex-col gap-4 max-w-[1920px] mx-auto">
          
          {/* ASPECT 1: 3D DIGITAL TWIN (HERO VIEW) */}
          {activeAspect === '3d-twin' && (
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

          {/* ASPECT 2: MODEL VS IN-SITU VALIDATION STUDIO */}
          {activeAspect === 'model-studio' && (
            <ModelStudioView
              selectedStation={selectedStation}
              liveStationData={liveStationData}
              onSelectStation={handleSelectStation}
              selectedDepth={selectedDepth}
              setSelectedDepth={setSelectedDepth}
              stations={stations}
              backendHealth={backendHealth}
              startDate={startDate}
              endDate={endDate}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              currentTimeHour={currentTimeHour}
              dataSource={dataSource}
              setDataSource={setDataSource}
              primaryVariable={primaryVariable}
              setPrimaryVariable={setPrimaryVariable}
              timeSeriesData={timeSeriesData}
              verticalProfile={verticalProfile}
              depthProfileData={depthProfileData}
              simulationScenario={simulationScenario}
            />
          )}

          {/* ASPECT 3: DEPTH & CTD STRATIFICATION ANALYTICS */}
          {activeAspect === 'analytics' && (
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

          {/* ASPECT 4: IN-SITU OBSERVATION DATA */}
          {(activeAspect === 'insitu-data' || activeAspect === 'observations') && (
            <ObservationsView
              stations={stations}
              selectedStation={liveStationData || selectedStation}
              onSelectStation={handleSelectStation}
              onNavigateTo3D={() => setActiveAspect('3d-twin')}
              selectedDepth={selectedDepth}
            />
          )}

          {/* ASPECT 5: NUMERICAL OCEAN MODEL DATA */}
          {(activeAspect === 'numerical-data' || activeAspect === 'model-data') && (
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

          {/* ASPECT 6: DOWNLOAD & EXPORT DATA */}
          {(activeAspect === 'download-data' || activeAspect === 'export-data') && (
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

        <Footer />
      </div>

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

      {/* Floating Ocean AI Chatbot docked at Bottom Right Corner */}
      <FloatingChatbot
        selectedStation={selectedStation}
        selectedDepth={selectedDepth}
        simulationScenario={simulationScenario}
        backendHealth={backendHealth}
        selectedDate={selectedDate}
      />
    </div>
  );
}
