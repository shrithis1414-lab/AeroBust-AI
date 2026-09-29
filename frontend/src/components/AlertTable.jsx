import React from 'react';
import { ShieldAlert, Eye, CheckCircle2 } from 'lucide-react';

export default function AlertTable({
  alerts = [],
  leadDay,
  onSelectAlertPoint
}) {
  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col transition-colors">
      {/* Table Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Early Warning Operational Registry
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30 px-2.5 py-0.5 rounded-full">
            {alerts.length} Flagged Regional Zones
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-mono">
            Lead Day {leadDay}
          </span>
        </div>
      </div>

      {/* Alert Cards / Table Container */}
      <div className="mt-3 overflow-x-auto max-h-72 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 opacity-80" />
            <span className="font-medium text-slate-700 dark:text-slate-300">No severe forecast busts detected for Day {leadDay}.</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Numerical model guidance is performing within nominal tolerance margins.</span>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 text-left text-[11px]">
                <th className="pb-2.5 font-medium">Sub-Region</th>
                <th className="pb-2.5 font-medium">Coordinates</th>
                <th className="pb-2.5 font-medium">Primary Risk Factor</th>
                <th className="pb-2.5 font-medium text-center">Bust Risk</th>
                <th className="pb-2.5 font-medium text-center">Confidence</th>
                <th className="pb-2.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {alerts.map((al, idx) => (
                <tr key={`${al.lat}-${al.lon}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-[#131d31]/50 transition-colors">
                  <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>{al.region}</span>
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
                    {al.lat.toFixed(2)}°N, {al.lon.toFixed(2)}°E
                  </td>
                  <td className="py-2.5">
                    <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-500/20 text-[11px]">
                      {al.primary_risk_factor}
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/70 px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-500/30 text-[11px] font-mono tabular-nums">
                      {Math.round(al.bust_probability * 100)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-center">
                    <span className="text-slate-800 dark:text-slate-300 text-xs font-mono tabular-nums font-semibold">
                      {al.confidence_score.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onSelectAlertPoint(al)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800/50 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-[11px] font-semibold transition-all shadow-xs"
                      title="Inspect point in Diagnostic Card"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
