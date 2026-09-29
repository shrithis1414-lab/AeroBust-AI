import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  ShieldAlert,
  Compass,
  RefreshCw,
  BarChart3,
  Cpu,
  Layers,
  HelpCircle,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

import AeroLogo from './components/AeroLogo';
import MapViewer from './components/MapViewer';
import LeadTimeSlider from './components/LeadTimeSlider';
import EventTagger from './components/EventTagger';
import AlertTable from './components/AlertTable';
import XaiDrawer from './components/XaiDrawer';
import TutorialModal from './components/TutorialModal';

const API_BASE = '/api';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('monsoon_depression');
  const [leadDay, setLeadDay] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('aerobust_theme') || 'dark');

  // Synchronize document theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('aerobust_theme', theme);
  }, [theme]);

  // Data states
  const [gridData, setGridData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [xaiData, setXaiData] = useState(null);

  // Client-side cache to make lead-day scrubbing buttery smooth
  const gridCacheRef = useRef({});
  const alertCacheRef = useRef({});

  // Loading states
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingXai, setIsLoadingXai] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ online: true, version: '1.0.0' });

  // Check if first-time user to show tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('aerobust_seen_tour');
    if (!hasSeenTour) {
      setIsTourOpen(true);
      localStorage.setItem('aerobust_seen_tour', 'true');
    }
  }, []);

  // 1. Fetch available scenarios & health on mount
  useEffect(() => {
    async function initApp() {
      try {
        const [resHealth, resScenarios] = await Promise.all([
          fetch(`${API_BASE}/health`),
          fetch(`${API_BASE}/scenarios`)
        ]);

        if (resHealth.ok) {
          const healthData = await resHealth.json();
          setSystemHealth({ online: true, ...healthData });
        }

        if (resScenarios.ok) {
          const data = await resScenarios.json();
          setScenarios(data.scenarios);
          if (data.scenarios.length > 0) {
            setSelectedScenarioId(data.scenarios[0].id);
          }
        }
      } catch (err) {
        console.error('Failed fetching scenarios:', err);
      }
    }
    initApp();
  }, []);

  // 2. Fetch Forecast Grid for active scenario & lead day (Cached & Non-looping)
  const fetchGrid = useCallback(async () => {
    if (!selectedScenarioId) return;

    const cacheKey = `${selectedScenarioId}_d${leadDay}`;
    if (gridCacheRef.current[cacheKey]) {
      const cached = gridCacheRef.current[cacheKey];
      setGridData(cached.grid);
      setSummary(cached.summary);

      setSelectedPoint((prev) => {
        if (!prev || prev.scenario !== selectedScenarioId) {
          return cached.grid.find((p) => p.bust_probability >= 0.70) || cached.grid[0];
        }
        const updated = cached.grid.find(
          (p) => Math.abs(p.lat - prev.lat) < 0.1 && Math.abs(p.lon - prev.lon) < 0.1
        );
        return updated || prev;
      });
      return;
    }

    setIsLoadingGrid(true);
    try {
      const res = await fetch(
        `${API_BASE}/forecast/grid?scenario=${selectedScenarioId}&day=${leadDay}&resolution=0.75`
      );
      if (res.ok) {
        const data = await res.json();
        gridCacheRef.current[cacheKey] = data;
        setGridData(data.grid);
        setSummary(data.summary);

        setSelectedPoint((prev) => {
          if (!prev || prev.scenario !== selectedScenarioId) {
            return data.grid.find((p) => p.bust_probability >= 0.70) || data.grid[0];
          }
          const updated = data.grid.find(
            (p) => Math.abs(p.lat - prev.lat) < 0.1 && Math.abs(p.lon - prev.lon) < 0.1
          );
          return updated || prev;
        });
      }
    } catch (err) {
      console.error('Error fetching grid:', err);
    } finally {
      setIsLoadingGrid(false);
    }
  }, [selectedScenarioId, leadDay]);

  // 3. Fetch Operational Alerts (Cached)
  const fetchAlerts = useCallback(async () => {
    if (!selectedScenarioId) return;

    const cacheKey = `${selectedScenarioId}_d${leadDay}`;
    if (alertCacheRef.current[cacheKey]) {
      setAlerts(alertCacheRef.current[cacheKey]);
      return;
    }

    setIsLoadingAlerts(true);
    try {
      const res = await fetch(
        `${API_BASE}/alerts?scenario=${selectedScenarioId}&day=${leadDay}&threshold=0.60`
      );
      if (res.ok) {
        const data = await res.json();
        alertCacheRef.current[cacheKey] = data.alerts;
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, [selectedScenarioId, leadDay]);

  // 4. Fetch SHAP XAI for selected coordinate
  const fetchXai = useCallback(async (point, day, scenario) => {
    if (!point) return;
    setIsLoadingXai(true);
    try {
      const res = await fetch(`${API_BASE}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario,
          lead_day: day,
          lat: point.lat,
          lon: point.lon
        })
      });
      if (res.ok) {
        const data = await res.json();
        setXaiData(data);
      }
    } catch (err) {
      console.error('Error fetching XAI:', err);
    } finally {
      setIsLoadingXai(false);
    }
  }, []);

  // Trigger grid and alerts fetch when scenario or leadDay updates
  useEffect(() => {
    fetchGrid();
    fetchAlerts();
  }, [fetchGrid, fetchAlerts]);

  // Trigger XAI whenever selected point or day changes (clean, non-looping)
  useEffect(() => {
    if (selectedPoint) {
      fetchXai(selectedPoint, leadDay, selectedScenarioId);
    }
  }, [selectedPoint?.lat, selectedPoint?.lon, leadDay, selectedScenarioId, fetchXai]);

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white transition-colors duration-200">
      {/* Interactive Guided Tour Modal */}
      <TutorialModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* Top Operational Header */}
      <header className="bg-white/90 dark:bg-[#0e1626]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-[2000] px-4 py-2.5 transition-colors">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Custom AeroLogo & Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-sky-500/10 to-blue-500/10 dark:from-sky-950/80 dark:to-blue-950/80 border border-sky-400/20 shadow-sm flex items-center justify-center">
              <AeroLogo className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-heading tracking-tight text-slate-900 dark:text-white">
                  AeroBust<span className="text-sky-500 dark:text-sky-400 font-extrabold">-AI</span>
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                  Supervisory Layer
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live System
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-normal">
                Indian Weather Forecast Bust & Confidence System • Days 1 to 10
              </p>
            </div>
          </div>

          {/* Operational Metrics Bar & Tour Trigger */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {summary && (
              <>
                <div className="hidden md:flex flex-col items-end px-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Domain Avg Confidence</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400 font-mono text-sm tabular-nums">
                    {summary.mean_confidence_score.toFixed(0)}%
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                <div className="hidden lg:flex flex-col items-end px-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Severe Bust Cells</span>
                  <span className="font-bold text-rose-500 dark:text-rose-400 font-mono text-sm tabular-nums">
                    {summary.high_bust_cells_count} <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">/ {summary.total_grid_points}</span>
                  </span>
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden lg:block" />
              </>
            )}

            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Cpu className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <div className="text-[11px] flex flex-col sm:flex-row sm:gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">NWP Model:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">NCUM-G / GFS 00Z</span>
              </div>
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-sky-600" />
              )}
            </button>

            {/* Quick Tour Button */}
            <button
              onClick={() => setIsTourOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-500/30 transition-all font-medium text-xs shadow-sm"
              title="Launch Guided Walkthrough"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden sm:inline">Quick Tour</span>
            </button>

            <button
              onClick={() => {
                gridCacheRef.current = {};
                alertCacheRef.current = {};
                fetchGrid();
                fetchAlerts();
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Reload Grid Slices"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGrid ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Operational Container */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-3 sm:p-4 space-y-4">
        {/* Scenario & Synoptic Event Selector */}
        <EventTagger
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={(id) => {
            setSelectedScenarioId(id);
            setIsPlaying(false);
          }}
        />

        {/* Core Layout: Map + Controls (Left/Center) & Diagnostics Card (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left / Center: Interactive Map + Time Controller + Alerts */}
          <div className="lg:col-span-8 space-y-4">
            {/* Interactive Geospatial Map */}
            <MapViewer
              gridData={gridData}
              selectedPoint={selectedPoint}
              onSelectPoint={(pt) => setSelectedPoint(pt)}
              leadDay={leadDay}
              scenarioName={activeScenario?.name || 'Monsoon Depression'}
              theme={theme}
            />

            {/* Day 1 to Day 10 Time Controller Scrubber */}
            <LeadTimeSlider
              leadDay={leadDay}
              setLeadDay={setLeadDay}
              criticalDays={activeScenario?.critical_lead_days || []}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />

            {/* Operational High-Risk Alerts Table */}
            <AlertTable
              alerts={alerts}
              leadDay={leadDay}
              onSelectAlertPoint={(al) => {
                const targetPoint = gridData.find(
                  (p) => Math.abs(p.lat - al.lat) < 0.1 && Math.abs(p.lon - al.lon) < 0.1
                );
                if (targetPoint) {
                  setSelectedPoint(targetPoint);
                }
              }}
            />
          </div>

          {/* Right Column: Deep Diagnostic XAI Forecaster Card */}
          <div className="lg:col-span-4 sticky top-16">
            <XaiDrawer
              selectedPoint={selectedPoint}
              xaiData={xaiData}
              isLoadingXai={isLoadingXai}
              onClose={() => setSelectedPoint(null)}
            />
          </div>
        </div>
      </main>

      {/* Operational Status Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-[#0e1626]/80 backdrop-blur-sm px-4 py-2.5 text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-[1750px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>AI Supervisory Residual Layer: Isotonic Calibrated LightGBM</span>
            <span>•</span>
            <span>Grid Domain: 6°N–38°N, 68°E–98°E (0.5° / 0.75° resolution)</span>
          </div>
          <div>
            <span>AeroBust-AI v1.0.0 • Operational Meteorological Research Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
