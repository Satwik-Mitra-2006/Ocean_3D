import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OceanScene from './components/OceanScene';
import DataPanel from './components/DataPanel';
import DataCharts from './components/DataCharts';
import SettingsModal from './components/SettingsModal';
import SimulationControls from './components/SimulationControls';
import ModelObservationComparisonCard from './components/ModelObservationComparisonCard';
import { 
  OBSERVATION_STATIONS, 
  getStationObservationAtTime,
  generateTimeSeriesData,
  generateDepthProfileData
} from './data/mockOceanData';
import { oceanDataService } from './services/oceanDataService';
import Ocean3DView from './views/Ocean3DView';
import ObservationsView from './views/ObservationsView';
import ModelDataView from './views/ModelDataView';
import AnalysisView from './views/AnalysisView';
import AboutView from './views/AboutView';
import './App.css';

export default function App() {
  // Navigation & Modal state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  const [primaryVariable, setPrimaryVariable] = useState('thetao');

  // Data Source mode: 'model' (Numerical Model / Copernicus GLORYS12V1) or 'insitu' (In-Situ Observation Buoys)
  const [dataSource, setDataSource] = useState('model');

  // Time & Date dimension state (strictly bound to user dataset: 17/06/2026 to 23/06/2026)
  const [startDate, setStartDate] = useState('2026-06-17');
  const [endDate, setEndDate] = useState('2026-06-23');
  const [selectedDate, setSelectedDate] = useState('2026-06-23');
  const [currentTimeHour, setCurrentTimeHour] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Real Copernicus Backend Data & Metadata
  const [backendHealth, setBackendHealth] = useState({
    status: 'connecting',
    dataset_available: false,
    metadata: null,
  });
  const [gridPoints, setGridPoints] = useState([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState(true);
  const [availableDepths, setAvailableDepths] = useState([0.49, 1.54, 2.65, 3.82, 5.08, 6.44, 7.93, 9.57, 11.40]);

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

    // 2. Fetch stations for initial date
    try {
      const stationList = await oceanDataService.getStations({ date: selectedDate });
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
        setAvailableDepths(depthRes.available_depths);
        setSelectedDepth(prev => depthRes.available_depths.includes(prev) ? prev : depthRes.available_depths[0]);
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

  // Compute live station observation adjusted for selected depth & time & scenario
  const liveStationData = useMemo(() => {
    if (!selectedStation) return null;
    let base = getStationObservationAtTime(selectedStation, currentTimeHour, selectedDate || '2026-06-23', selectedDepth);

    // If we have a vertical profile from backend, interpolate physical parameters at selectedDepth
    if (verticalProfile && verticalProfile.length > 0) {
      const nearest = verticalProfile.reduce((prev, curr) => 
        Math.abs(curr.depth - selectedDepth) < Math.abs(prev.depth - selectedDepth) ? curr : prev
      );
      if (nearest) {
        // Add subtle diurnal wave to the profile point so time of day is reflected
        const hourAngle = ((currentTimeHour - 6) / 24) * 2 * Math.PI;
        const thermalDamp = Math.exp(-Number(selectedDepth) / 5.0);
        const tVar = Math.sin(hourAngle) * (0.45 * thermalDamp);
        const sVar = Math.sin(hourAngle * 0.5) * (0.05 * thermalDamp);

        base = {
          ...base,
          depth: selectedDepth,
          temperature: +(nearest.temperature + tVar).toFixed(2),
          salinity: +(nearest.salinity + sVar).toFixed(2),
          current_speed: nearest.current_speed,
          density: nearest.density
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

    // Synchronize exact selected date and time in timestamp
    const dateFormatted = selectedDate || '2026-06-23';
    const hourStr = String(Math.floor(currentTimeHour)).padStart(2, '0');
    base = {
      ...base,
      timestamp: `${dateFormatted} ${hourStr}:00 UTC`
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
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* 1. TOP NAVBAR */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        backendHealth={backendHealth}
        pointsCount={gridPoints.length || 1122}
      />

      {/* 2. MAIN APPLICATION VIEWS (ROUTED BY activeTab) */}
      <main className="flex-1 w-full px-3 sm:px-4 py-3 flex flex-col gap-3 max-w-[1920px] mx-auto">
        
        {/* TAB 1: UNIFIED DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* SCENARIO ENGINE: CYCLONE & MONSOON SIMULATOR */}
            <SimulationControls
              simulationScenario={simulationScenario}
              setSimulationScenario={setSimulationScenario}
            />

            {/* TOP ROW: 4-COLUMN VIEWPORT LAYOUT */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch w-full">
              {/* Left Column: Sidebar Parameters & Controls */}
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
              />

              {/* Center Viewport: 3D Earth Globe with Thermal Colormap & Streamlines + Live Marine Sea-State HUD */}
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
                />

                {/* DEDICATED MODEL VS IN-SITU VALIDATION TABLE & COMPACT DIURNAL SPARKLINE CHARTS */}
                <ModelObservationComparisonCard
                  station={liveStationData || selectedStation}
                  timeSeriesData={timeSeriesData}
                  currentTimeHour={currentTimeHour}
                  selectedDepth={selectedDepth}
                  selectedDate={selectedDate}
                  simulationScenario={simulationScenario}
                  dataSource={dataSource}
                  setDataSource={setDataSource}
                />
              </div>

              {/* Right Column: Selected Station Telemetry Card */}
              <DataPanel
                selectedStation={selectedStation}
                selectedStationData={liveStationData}
                onClearSelection={() => handleSelectStation(stations[0])}
                selectedDepth={selectedDepth}
                stations={stations}
                onSelectStation={handleSelectStation}
                backendHealth={backendHealth}
                startDate={startDate}
                endDate={endDate}
                selectedDate={selectedDate}
                currentTimeHour={currentTimeHour}
                dataSource={dataSource}
                setDataSource={setDataSource}
              />
            </div>

            {/* BOTTOM ROW: ANALYTICS & AI DIAGNOSIS */}
            <DataCharts
              verticalProfile={verticalProfile}
              depthProfileData={depthProfileData}
              timeSeriesData={timeSeriesData}
              selectedStation={selectedStation}
              isLiveCopernicus={Boolean(backendHealth.dataset_available)}
              dataSource={dataSource}
            />
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
          />
        )}

        {/* TAB 6: ABOUT & SIH 2026 PRESENTATION GUIDE */}
        {activeTab === 'about' && (
          <AboutView />
        )}

      </main>

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

    </div>
  );
}
