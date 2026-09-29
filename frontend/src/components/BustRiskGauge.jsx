import React from 'react';
import { AlertTriangle, ShieldCheck, AlertOctagon, Info } from 'lucide-react';

export default function BustRiskGauge({ probability = 0.0, confidence = 100.0 }) {
  const probPercent = Math.round(probability * 100);
  
  // Angle for semi-circle: 180 degrees (from -90 to +90)
  const angle = (probability * 180) - 90;

  let riskColor = "#10b981"; // Emerald
  let riskText = "Nominal Accuracy";
  let RiskIcon = ShieldCheck;
  let textColor = "text-emerald-600 dark:text-emerald-400";
  let bgBadge = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300";

  if (probability >= 0.75) {
    riskColor = "#f43f5e"; // Rose
    riskText = "Critical Bust Risk";
    RiskIcon = AlertOctagon;
    textColor = "text-rose-600 dark:text-rose-400";
    bgBadge = "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300";
  } else if (probability >= 0.50) {
    riskColor = "#f59e0b"; // Amber
    riskText = "Elevated Risk";
    RiskIcon = AlertTriangle;
    textColor = "text-amber-600 dark:text-amber-400";
    bgBadge = "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300";
  } else if (probability >= 0.25) {
    riskColor = "#0ea5e9"; // Sky
    riskText = "Moderate Watch";
    RiskIcon = Info;
    textColor = "text-sky-600 dark:text-sky-400";
    bgBadge = "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300";
  }

  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col items-center shadow-lg relative overflow-hidden transition-colors">
      {/* Background ambient glow */}
      <div 
        className="absolute -top-10 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
        style={{ backgroundColor: riskColor }}
      />

      <div className="flex items-center justify-between w-full mb-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <RiskIcon className="w-3.5 h-3.5" style={{ color: riskColor }} />
          Bust Probability
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${bgBadge}`}>
          {riskText}
        </span>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div className="relative w-44 h-24 flex items-end justify-center mt-1">
        <svg viewBox="0 0 160 85" className="w-full h-full overflow-visible">
          {/* Background Arc */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            className="stroke-slate-200 dark:stroke-[#172236]"
            strokeWidth="11"
            strokeLinecap="round"
          />
          {/* Colored Meter Arc */}
          <path
            d="M 15 80 A 65 65 0 0 1 145 80"
            fill="none"
            stroke={riskColor}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray="204.2"
            strokeDashoffset={204.2 * (1 - probability)}
            className="transition-all duration-700 ease-out"
          />
          {/* Needle Center Pin */}
          <circle cx="80" cy="80" r="5" className="fill-slate-800 dark:fill-slate-100" />
          {/* Needle */}
          <g transform={`rotate(${angle} 80 80)`} className="transition-transform duration-700 ease-out">
            <line x1="80" y1="80" x2="80" y2="24" className="stroke-slate-800 dark:stroke-slate-100" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="80,18 77,26 83,26" className="fill-slate-800 dark:fill-slate-100" />
          </g>
        </svg>

        {/* Big percentage text */}
        <div className="absolute bottom-0 text-center flex flex-col items-center">
          <span className={`text-2xl font-bold font-heading tracking-tight ${textColor} tabular-nums`}>
            {probPercent}%
          </span>
        </div>
      </div>

      {/* Confidence Footer Bar */}
      <div className="w-full mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Forecast Confidence:</span>
        <span className={`font-semibold font-mono tabular-nums ${confidence >= 70 ? 'text-emerald-600 dark:text-emerald-400' : confidence >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {confidence.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
