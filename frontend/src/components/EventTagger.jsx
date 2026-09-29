import React from 'react';
import { CloudRain, Compass, Sun, Wind, Waves, AlertCircle } from 'lucide-react';

const SCENARIO_ICONS = {
  monsoon_depression: CloudRain,
  western_disturbance: Wind,
  tropical_cyclone: Compass,
  heatwave_vidarbha: Sun,
  active_break_monsoon: Waves
};

export default function EventTagger({
  scenarios = [],
  selectedScenarioId,
  onSelectScenario
}) {
  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3 transition-colors">
      {/* Event Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Active Meteorological Systems
          </h3>
        </div>
        <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2.5 py-0.5 rounded-full">
          {scenarios.length} Historical Benchmarks
        </span>
      </div>

      {/* Scenario Pill Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {scenarios.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const Icon = SCENARIO_ICONS[sc.id] || CloudRain;

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-sky-50 dark:bg-gradient-to-r dark:from-sky-950/70 dark:to-blue-950/70 border-sky-500 text-sky-950 dark:text-white shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50'
                  : 'bg-slate-50/80 dark:bg-[#131d31]/60 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#131d31]'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition-colors ${
                  isSelected ? 'bg-sky-500 text-white dark:text-slate-950 shadow-sm' : 'bg-slate-200 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate leading-tight text-slate-900 dark:text-slate-100">
                  {sc.name.split('(')[0]}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-normal">
                  {sc.category}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Synoptic Briefing Card for Selected Scenario */}
      {currentScenario && (
        <div className="bg-slate-50 dark:bg-[#131d31]/80 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors">
          <div className="flex items-start gap-2.5 flex-1">
            <AlertCircle className="w-4 h-4 text-sky-500 dark:text-sky-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans text-xs">
                {currentScenario.synoptic_narrative}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Affected Zones:</span>
                {currentScenario.primary_regions.map((reg) => (
                  <span
                    key={reg}
                    className="text-[11px] font-medium bg-white dark:bg-slate-800/90 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/60 shadow-xs"
                  >
                    {reg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-end gap-1.5 shrink-0 text-right">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Critical Error Window:</span>
            <div className="flex gap-1">
              {currentScenario.critical_lead_days.map((d) => (
                <span
                  key={d}
                  className="text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 px-2 py-0.5 rounded-md"
                >
                  Day {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
