import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { Layers, Maximize2, ShieldAlert, Zap, Filter } from 'lucide-react';

// Subcontinent Bounds
const INDIA_CENTER = [22.0, 80.5];
const INDIA_BOUNDS = [
  [6.0, 68.0],
  [38.0, 98.0]
];

// Helper to center and fly to coordinates
function MapController({ selectedPoint, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedPoint) {
      map.flyTo([selectedPoint.lat, selectedPoint.lon], Math.max(map.getZoom(), 6), {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [selectedPoint, map]);

  useEffect(() => {
    if (resetTrigger) {
      map.flyToBounds(INDIA_BOUNDS, { padding: [20, 20], duration: 1.0 });
    }
  }, [resetTrigger, map]);

  return null;
}

export default function MapViewer({
  gridData = [],
  selectedPoint,
  onSelectPoint,
  leadDay,
  scenarioName,
  theme = "dark"
}) {
  const [visualMode, setVisualMode] = useState('bust_risk'); // 'bust_risk' | 'confidence' | 'precip'
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
  const [resetCount, setResetCount] = useState(0);

  const isDark = theme === 'dark';
  const baseTileUrl = isDark
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  const refTileUrl = isDark
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

  // Color mappings
  const getMarkerColor = (point) => {
    if (visualMode === 'bust_risk') {
      const p = point.bust_probability;
      if (p >= 0.80) return '#9333ea'; // Purple/Violet
      if (p >= 0.65) return '#e11d48'; // Rose Red
      if (p >= 0.45) return '#f59e0b'; // Amber
      if (p >= 0.25) return '#0ea5e9'; // Sky Blue
      return '#10b981'; // Emerald Green
    } else if (visualMode === 'confidence') {
      const c = point.confidence_score;
      if (c >= 75) return '#10b981'; // High confidence
      if (c >= 55) return '#0ea5e9'; // Moderate
      if (c >= 35) return '#f59e0b'; // Low
      return '#e11d48'; // Critical low
    } else {
      // Precipitation forecast
      const rain = point.precipitation_forecast;
      if (rain >= 100) return '#4f46e5'; // Deep Indigo
      if (rain >= 50) return '#0284c7';  // Blue
      if (rain >= 20) return '#06b6d4';  // Cyan
      if (rain >= 5) return '#22d3ee';   // Light Cyan
      return isDark ? '#334155' : '#94a3b8'; // Grey/dry
    }
  };

  const filteredGrid = showHighRiskOnly
    ? gridData.filter((p) => p.bust_probability >= 0.50)
    : gridData;

  return (
    <div className="relative w-full h-[540px] lg:h-[620px] bg-slate-100 dark:bg-[#080d1a] rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-2xl flex flex-col transition-colors">
      {/* Top Map Toolbar Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Mode Selector */}
        <div className="bg-white/95 dark:bg-[#0e1626]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/60 rounded-xl p-1 flex items-center gap-1 shadow-xl pointer-events-auto text-xs">
          <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 ml-2 mr-1" />
          <button
            onClick={() => setVisualMode('bust_risk')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              visualMode === 'bust_risk'
                ? 'bg-rose-500 text-white font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            Bust Risk
          </button>
          <button
            onClick={() => setVisualMode('confidence')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              visualMode === 'confidence'
                ? 'bg-sky-500 text-white dark:text-slate-950 font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            Confidence
          </button>
          <button
            onClick={() => setVisualMode('precip')}
            className={`px-3 py-1.5 rounded-lg transition-all font-medium ${
              visualMode === 'precip'
                ? 'bg-indigo-600 text-white font-semibold shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            Precipitation
          </button>
        </div>

        {/* Filters and View Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowHighRiskOnly(!showHighRiskOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-xl transition-all shadow-lg ${
              showHighRiskOnly
                ? 'bg-rose-100 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/60'
                : 'bg-white/95 dark:bg-[#0e1626]/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-[#131d31]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>High Risk Only</span>
          </button>

          <button
            onClick={() => setResetCount((c) => c + 1)}
            className="p-2 rounded-xl bg-white/95 dark:bg-[#0e1626]/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#131d31] transition-all shadow-lg"
            title="Reset to India Subcontinent"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={INDIA_CENTER}
        zoom={4.6}
        minZoom={4}
        maxZoom={10}
        preferCanvas={true}
        maxBounds={[
          [2.0, 62.0],
          [42.0, 104.0]
        ]}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController selectedPoint={selectedPoint} resetTrigger={resetCount} />

        {/* Dynamic Light/Dark Map Tiles */}
        <TileLayer
          key={`base-${theme}`}
          attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
          url={baseTileUrl}
          maxZoom={16}
        />
        <TileLayer
          key={`ref-${theme}`}
          attribution='&copy; Esri'
          url={refTileUrl}
          maxZoom={16}
        />

        {/* Raster Grid Markers (Hardware-Accelerated on Canvas) */}
        {filteredGrid.map((point, index) => {
          const isSelected =
            selectedPoint &&
            Math.abs(selectedPoint.lat - point.lat) < 0.05 &&
            Math.abs(selectedPoint.lon - point.lon) < 0.05;
          const isHighAlert = point.bust_probability >= 0.70;
          const color = getMarkerColor(point);

          return (
            <CircleMarker
              key={`${point.lat}-${point.lon}-${index}`}
              center={[point.lat, point.lon]}
              radius={isSelected ? 9 : isHighAlert ? 6.5 : 4.5}
              pathOptions={{
                color: isSelected ? '#ffffff' : color,
                weight: isSelected ? 3 : isHighAlert ? 1.5 : 0.8,
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : isHighAlert ? 0.85 : 0.65
              }}
              eventHandlers={{
                click: () => onSelectPoint(point)
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <div className="font-mono text-xs p-1">
                  <div className="font-bold text-white border-b border-slate-700 pb-0.5 mb-1">
                    {point.region} ({point.lat.toFixed(1)}°N, {point.lon.toFixed(1)}°E)
                  </div>
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Bust Risk:</span>
                    <span className="font-bold text-rose-400">
                      {Math.round(point.bust_probability * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Confidence:</span>
                    <span className="font-bold text-cyan-400">
                      {point.confidence_score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-slate-300">
                    <span>Precip (Fcst / Truth):</span>
                    <span className="font-mono text-slate-200">
                      {point.precipitation_forecast} / {point.precipitation_truth} mm
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-300 mt-1 italic">
                    Click to view full SHAP XAI breakdown →
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-[#0e1626]/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xl text-xs font-medium text-slate-700 dark:text-slate-300 pointer-events-auto flex flex-col gap-1.5 transition-colors">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between">
          <span>{visualMode === 'bust_risk' ? 'Bust Probability' : visualMode === 'confidence' ? 'Forecast Confidence' : 'Precipitation (mm/d)'}</span>
          <span className="text-slate-400 dark:text-slate-500 font-normal">Day {leadDay}</span>
        </div>

        {visualMode === 'bust_risk' && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>&lt;25%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
              <span>45%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span>65%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <span>80%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9333ea]" />
              <span>&gt;80%</span>
            </div>
          </div>
        )}

        {visualMode === 'confidence' && (
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" />
              <span>&lt;35%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              <span>55%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]" />
              <span>75%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>&gt;75%</span>
            </div>
          </div>
        )}

        {visualMode === 'precip' && (
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
              <span>&lt;5</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
              <span>20</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" />
              <span>50</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
              <span>100+</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
