import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  Layers
} from 'lucide-react';

const STEPS = [
  {
    title: "Welcome to AeroBust-AI",
    subtitle: "AI Supervisory Layer for Numerical Weather Prediction (NWP)",
    icon: Compass,
    color: "from-sky-500 to-blue-600",
    description: (
      <div className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          Numerical models like <strong className="text-slate-900 dark:text-white">NCMRWF NCUM</strong> and <strong className="text-slate-900 dark:text-white">IMD GFS</strong> occasionally experience sudden <span className="text-rose-600 dark:text-rose-400 font-semibold">Forecast Busts</span>—drastic errors in medium-range forecasts (Days 1–10).
        </p>
        <p>
          <strong className="text-sky-700 dark:text-sky-300">AeroBust-AI</strong> doesn't try to replace physical models. Instead, it acts as an intelligent supervisor trained on historical forecast residuals (<span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300">|Forecast − Truth|</span>) to warn meteorologists when and why a numerical run is breaking down.
        </p>
        <div className="p-3 bg-slate-100 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          📍 Covers the complete Indian subcontinent (<span className="text-slate-900 dark:text-slate-200 font-medium">6°N–38°N, 68°E–98°E</span>) at high spatial resolution.
        </div>
      </div>
    )
  },
  {
    title: "Step 1: Select a Weather Event",
    subtitle: "Explore 5 high-impact tropical meteorological systems",
    icon: Layers,
    color: "from-teal-500 to-emerald-600",
    description: (
      <div className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          At the top of the workstation, choose an active weather phenomenon:
        </p>
        <ul className="space-y-2 text-xs">
          <li className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">Monsoon Depression:</span>
            <span>Massive localized rainfall underestimation on Days 3–6 moving from Bay of Bengal to Central India.</span>
          </li>
          <li className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-sky-600 dark:text-sky-400 shrink-0">Tropical Cyclone:</span>
            <span>Track recurvature divergence & central pressure bust beyond Day 4.</span>
          </li>
          <li className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">Western Disturbance:</span>
            <span>Trough speed phase error across Jammu & Kashmir and Himachal Pradesh.</span>
          </li>
          <li className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="font-bold text-rose-600 dark:text-rose-400 shrink-0">Severe Heatwave:</span>
            <span>Persistent surface cold bias (&gt;3.5°C) across Vidarbha & Gangetic Plains.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    title: "Step 2: Interactive Geospatial Map",
    subtitle: "Real-time risk heatmap, confidence contours, and grid inspection",
    icon: MapPin,
    color: "from-blue-500 to-indigo-600",
    description: (
      <div className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          The central map renders thousands of hardware-accelerated grid cells across India:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-semibold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Bust Risk Layer
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Green (&lt;25%) to Amber (50%) to Rose/Violet (&gt;80%). Highlights acute failure zones.
            </p>
          </div>
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="font-semibold text-teal-600 dark:text-teal-400 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Confidence Mode
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              0–100% reliability index showing when to trust guidance vs when to intervene.
            </p>
          </div>
        </div>
        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 rounded-lg border border-sky-200 dark:border-sky-800/40 text-xs text-sky-800 dark:text-sky-200">
          💡 <strong>Pro Tip:</strong> Click any circle marker on the map to instantly inspect its exact numerical values and physical failure diagnosis.
        </div>
      </div>
    )
  },
  {
    title: "Step 3: Day 1–10 Time Controller",
    subtitle: "Scrub the forecast horizon to observe chaotic error cascade",
    icon: Clock,
    color: "from-amber-500 to-orange-600",
    description: (
      <div className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          Forecast errors grow nonlinearly as lead time increases. Use the bottom controller to scrub:
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Day 1 to 2 (+24h to +48h):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">High Confidence / Low Dispersion</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Day 3 to 6 (+72h to +144h):</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">Critical Bust Window for Depressions & Systems</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Day 7 to 10 (+168h to +240h):</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">Chaotic Drift / Predictability Horizon Limit</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click <strong className="text-slate-800 dark:text-slate-200">Play Evolution</strong> to watch the spatial evolution automatically cycle like a weather radar playback.
        </p>
      </div>
    )
  },
  {
    title: "Step 4: Explainable AI & Advisories",
    subtitle: "Understand physical mechanisms with SHAP attribution",
    icon: Sparkles,
    color: "from-purple-500 to-pink-600",
    description: (
      <div className="space-y-3 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
        <p>
          Black-box machine learning is not enough for meteorologists. The right drawer translates raw model weights into real physical insights:
        </p>
        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
          <li className="flex items-start gap-1.5">
            <span className="text-purple-600 dark:text-purple-400">✦</span>
            <span><strong>Convective Scheme Breakdown:</strong> Hydrostatic parameterizations failing under high CAPE.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-purple-600 dark:text-purple-400">✦</span>
            <span><strong>Vortex Tilt & Shear:</strong> Vertical wind shear decoupling the dynamical storm core.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-purple-600 dark:text-purple-400">✦</span>
            <span><strong>Actionable IMD Directive:</strong> Explicit guidance (e.g. switch to multi-model super-ensembles or issue localized flash flood warnings).</span>
          </li>
        </ul>
      </div>
    )
  }
];

export default function TutorialModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      setCurrentStep((c) => c + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((c) => Math.max(0, c - 1));
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0e1626] border border-slate-200 dark:border-slate-700/60 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${step.color} text-white shadow-lg`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Guided Walkthrough • Step {currentStep + 1} of {STEPS.length}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {step.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {step.subtitle}
          </div>
          {step.description}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3 transition-colors">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep
                    ? 'w-6 bg-sky-500 dark:bg-sky-400'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                title={`Go to Step ${idx + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold text-xs flex items-center gap-1 shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500 transition-all"
            >
              <span>{isLast ? "Launch Dashboard" : "Next"}</span>
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              {isLast && <CheckCircle className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
