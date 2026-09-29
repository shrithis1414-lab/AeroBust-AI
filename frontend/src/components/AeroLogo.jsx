import React from 'react';

export default function AeroLogo({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="aeroGrad1" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="aeroGrad2" x1="6" y1="18" x2="30" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>

      {/* Atmospheric Outer Streamline Vortex */}
      <path
        d="M 18 3 A 15 15 0 0 1 33 18 C 33 24 28 30 21 31.5 C 15 32.8 9 29 6.5 24 C 4 19 6 12 11 8 C 15 4.8 21 5.5 25 9 C 28.5 12 29 17 26.5 21 C 24 25 19 26.5 15 25 C 11.5 23.5 10 19.5 11.5 16 C 13 12.5 17 11.5 20 13"
        stroke="url(#aeroGrad1)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* Dynamic Isobar Wave */}
      <path
        d="M 4 20 Q 11 13 18 20 T 32 17"
        stroke="url(#aeroGrad2)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="1.5 2.5"
        opacity="0.85"
      />

      {/* Core Eye / Warning Focal Center */}
      <circle cx="20" cy="13" r="2.8" fill="#f43f5e" />
      <circle cx="20" cy="13" r="4.8" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
