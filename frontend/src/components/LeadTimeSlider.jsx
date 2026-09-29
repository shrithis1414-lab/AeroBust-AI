import React, { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock, Zap } from 'lucide-react';

export default function LeadTimeSlider({
  leadDay,
  setLeadDay,
  criticalDays = [],
  isPlaying,
  setIsPlaying
}) {
  const hoursAhead = leadDay * 24;

  // Auto-play loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setLeadDay((prev) => (prev >= 10 ? 1 : prev + 1));
      }, 1600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, setLeadDay]);

  const isCritical = criticalDays.includes(leadDay);

  return (
    <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
      {/* Playback Controls & Status */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md ${
            isPlaying
              ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-100 dark:hover:bg-rose-500/25'
              : 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-500/30 hover:bg-sky-100 dark:hover:bg-sky-500/25'
          }`}
          title={isPlaying ? "Pause Forecast Evolution" : "Play Forecast Evolution"}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Evolution</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setLeadDay((d) => Math.max(1, d - 1))}
            disabled={leadDay <= 1}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Day"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          
          <div className="px-2 text-xs font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Day {leadDay}</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] tabular-nums font-normal">(+{hoursAhead}h)</span>
          </div>

          <button
            onClick={() => setLeadDay((d) => Math.min(10, d + 1))}
            disabled={leadDay >= 10}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            title="Next Day"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {isCritical && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/30 px-2.5 py-1 rounded-full animate-pulse">
            <Zap className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Critical Bust Window</span>
          </div>
        )}
      </div>

      {/* Scrubber Bar */}
      <div className="w-full md:flex-1 max-w-2xl px-2 flex flex-col">
        <div className="relative flex items-center h-8">
          {/* Track line */}
          <div className="absolute left-0 right-0 h-2 bg-slate-200 dark:bg-slate-800/80 rounded-full border border-slate-300 dark:border-slate-700/40 overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-rose-500 transition-all duration-200"
              style={{ width: `${((leadDay - 1) / 9) * 100}%` }}
            />
          </div>

          {/* Critical Days Indicators on Track */}
          {criticalDays.map((d) => {
            const leftPct = ((d - 1) / 9) * 100;
            return (
              <div
                key={d}
                style={{ left: `${leftPct}%` }}
                className="absolute w-2 h-4 -translate-x-1/2 bg-rose-500/70 rounded-sm pointer-events-none z-0"
                title={`Critical Window Day ${d}`}
              />
            );
          })}

          {/* Interactive Native Range input */}
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={leadDay}
            onChange={(e) => setLeadDay(parseInt(e.target.value, 10))}
            className="absolute left-0 right-0 w-full h-8 opacity-0 cursor-pointer z-20"
          />

          {/* Thumb marker */}
          <div
            className="absolute w-5 h-5 -translate-x-1/2 rounded-full bg-white border-2 border-sky-500 shadow-md pointer-events-none transition-all duration-150 z-10 flex items-center justify-center"
            style={{ left: `${((leadDay - 1) / 9) * 100}%` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-sky-600" />
          </div>
        </div>

        {/* Step Numbers Ticks */}
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 px-1 mt-0.5 font-medium">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => {
            const isCrit = criticalDays.includes(d);
            const isSelected = leadDay === d;
            return (
              <button
                key={d}
                onClick={() => setLeadDay(d)}
                className={`transition-all flex flex-col items-center ${
                  isSelected
                    ? 'text-sky-600 dark:text-sky-400 font-bold scale-110'
                    : isCrit
                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>D{d}</span>
                {isCrit && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
