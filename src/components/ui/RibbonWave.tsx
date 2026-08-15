import React from 'react';

export interface RibbonWaveProps {
  className?: string;
  variant?: 'hero' | 'card' | 'report';
}

export const RibbonWave: React.FC<RibbonWaveProps> = ({ className = '' }) => {
  return (
    <div className={`ribbon-wave-bg ${className}`} aria-hidden="true">
      <svg
        className="ribbon-wave-svg"
        viewBox="0 0 1440 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#635BFF" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#8B5CF6" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#EC4899" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="ribbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#635BFF" stopOpacity="0.7" />
          </linearGradient>

          <filter id="ribbonBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="18" result="blur" />
          </filter>
        </defs>

        {/* Deep background glow blur ribbon */}
        <path
          d="M-50,220 C320,80 540,360 880,180 C1140,50 1320,290 1500,160 L1500,480 L-50,480 Z"
          fill="url(#ribbonGrad1)"
          opacity="0.25"
          filter="url(#ribbonBlur)"
        />

        {/* Secondary wave ribbon stream */}
        <path
          d="M-50,260 C260,110 500,340 850,200 C1120,80 1300,300 1500,210"
          stroke="url(#ribbonGrad2)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Primary sharp flowing luminous wave ribbon */}
        <path
          d="M-50,210 C290,70 510,310 870,160 C1150,40 1310,270 1500,170"
          stroke="url(#ribbonGrad1)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Inner high-intensity neon highlight ribbon */}
        <path
          d="M-30,212 C300,74 515,308 868,162 C1148,42 1308,268 1490,172"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    </div>
  );
};
