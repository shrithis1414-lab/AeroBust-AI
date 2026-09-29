import React from 'react';
import { X, ShieldAlert, Sparkles, Activity, MapPin, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import BustRiskGauge from './BustRiskGauge';

export default function XaiDrawer({
  selectedPoint,
  xaiData,
  isLoadingXai,
  onClose
}) {
  if (!selectedPoint) return null;

  const {
    lat,
    lon,
    region,
    lead_day,
    precipitation_forecast,
    precipitation_truth,
    temp_2m_forecast,
    temp_2m_truth,
    mslp_forecast,
    wind_shear_850_200,
    cape,
    precipitable_water,
    ensemble_spread_proxy,
    is_bust_ground_truth,
    bust_type,
    bust_probability,
    confidence_score
  } = selectedPoint;

  const rainErr = Math.abs(precipitation_forecast - precipitation_truth).toFixed(1);
  const tempErr = Math.abs(temp_2m_forecast - temp_2m_truth).toFixed(1);

  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[84vh] transition-all">
      {/* Drawer Header */}
      <div className="bg-slate-50 dark:bg-[#131d31] px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            Forecaster Diagnostic Hub
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/80 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="p-4 overflow-y-auto space-y-4">
        {/* Geo Location & Risk Summary Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/70 transition-colors">
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{region}</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums">
              ({lat.toFixed(2)}°N, {lon.toFixed(2)}°E)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Lead Horizon:</span>
            <span className="font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/70 px-2 py-0.5 rounded-full border border-sky-300 dark:border-sky-800/40 text-[11px]">
              Day {lead_day} (+{lead_day * 24}h)
            </span>
          </div>
        </div>

        {/* Gauge & Bust Ground Truth Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <BustRiskGauge probability={bust_probability} confidence={confidence_score} />

          <div className="bg-slate-50 dark:bg-[#131d31]/80 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between h-full transition-colors">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Reanalysis Verification
              </span>
              <div className="mt-2 flex items-center gap-2">
                {is_bust_ground_truth === 1 ? (
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full border border-rose-300 dark:border-rose-500/30">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    <span>Verified Forecast Bust</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span>Nominal Accuracy</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">
                Bust Type: <span className="text-slate-800 dark:text-slate-200 capitalize font-medium">{bust_type.replace(/_/g, ' ')}</span>
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Supervisory Verdict:</span>
              <span className={`font-semibold ${bust_probability >= 0.65 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {bust_probability >= 0.65 ? 'Intervention Mandated' : 'Guidance Reliable'}
              </span>
            </div>
          </div>
        </div>

        {/* Forecast vs Ground Truth Comparison Table */}
        <div className="bg-slate-50 dark:bg-[#131d31]/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 transition-colors">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
              Numerical Guidance vs Reanalysis Truth
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">IMD / ERA5</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/80 text-left text-[11px]">
                  <th className="pb-2 font-medium">Variable</th>
                  <th className="pb-2 font-medium text-sky-600 dark:text-sky-400">NWP Model</th>
                  <th className="pb-2 font-medium text-emerald-600 dark:text-emerald-400">Truth</th>
                  <th className="pb-2 font-medium text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/50 text-slate-800 dark:text-slate-200">
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">Precipitation</td>
                  <td className="py-2 font-mono tabular-nums">{precipitation_forecast} mm/d</td>
                  <td className="py-2 font-mono tabular-nums">{precipitation_truth} mm/d</td>
                  <td className={`py-2 text-right font-mono font-semibold tabular-nums ${rainErr > 50 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Δ {rainErr} mm
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">2m Temperature</td>
                  <td className="py-2 font-mono tabular-nums">{temp_2m_forecast}°C</td>
                  <td className="py-2 font-mono tabular-nums">{temp_2m_truth}°C</td>
                  <td className={`py-2 text-right font-mono font-semibold tabular-nums ${tempErr >= 3.5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    Δ {tempErr}°C
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">Surface Pressure (MSLP)</td>
                  <td className="py-2 font-mono tabular-nums">{mslp_forecast} hPa</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">Synoptic Core</td>
                  <td className="py-2 text-right text-slate-400 dark:text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">Vertical Wind Shear</td>
                  <td className="py-2 font-mono tabular-nums">{wind_shear_850_200} m/s</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">850–200 hPa</td>
                  <td className="py-2 text-right text-slate-400 dark:text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">Thermodynamic CAPE</td>
                  <td className="py-2 font-mono tabular-nums">{cape} J/kg</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400 font-mono tabular-nums">{precipitable_water} mm PW</td>
                  <td className="py-2 text-right text-slate-400 dark:text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-700 dark:text-slate-300">Ensemble Spread Proxy</td>
                  <td className="py-2 text-amber-600 dark:text-amber-400 font-mono tabular-nums">± {ensemble_spread_proxy} mm</td>
                  <td className="py-2 text-slate-500 dark:text-slate-400">Dispersion</td>
                  <td className="py-2 text-right text-amber-600 dark:text-amber-400 font-medium text-[11px]">Chaotic Drift</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SHAP Feature Drivers Attribution */}
        <div className="bg-slate-50 dark:bg-[#131d31]/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 transition-colors">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
              Key Failure Drivers (SHAP Attribution)
            </span>
          </div>

          {isLoadingXai ? (
            <div className="py-3 text-center text-xs text-slate-500 dark:text-slate-400 animate-pulse">
              Calculating exact SHAP feature attributions...
            </div>
          ) : xaiData && xaiData.top_drivers ? (
            <div className="space-y-2.5">
              {xaiData.top_drivers.map((drv) => (
                <div key={drv.feature} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300">{drv.display_name}</span>
                    <span className={`font-mono text-[11px] tabular-nums font-semibold ${drv.impact >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {drv.impact >= 0 ? '+' : ''}{drv.impact.toFixed(4)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        drv.impact >= 0 ? 'bg-gradient-to-r from-rose-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(12, Math.abs(drv.impact) * 200))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 py-2">
              Select or re-query coordinates to calculate attributions.
            </div>
          )}
        </div>

        {/* Meteorological Failure Rationales */}
        {xaiData && xaiData.rationales && xaiData.rationales.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-800 dark:text-slate-300">
              Physical Meteorological Hypotheses
            </span>
            {xaiData.rationales.map((rat, idx) => (
              <div
                key={idx}
                className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-700 dark:text-sky-300 text-xs">
                    {rat.category}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      rat.severity === 'HIGH' || rat.severity === 'CRITICAL'
                        ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40'
                    }`}
                  >
                    {rat.severity} Impact
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  {rat.explanation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Operational Forecaster Actionable Advisory */}
        {xaiData && xaiData.actionable_advisory && (
          <div className="p-3.5 bg-amber-50/80 dark:bg-gradient-to-br dark:from-amber-950/30 dark:to-slate-900 border border-amber-300 dark:border-amber-500/30 rounded-2xl space-y-1 transition-colors">
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Operational Advisory for Forecasters</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              {xaiData.actionable_advisory}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
