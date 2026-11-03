import React from 'react';

interface PandaMascotProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isThinking?: boolean;
  className?: string;
  showStatusDot?: boolean;
}

export const PandaMascot: React.FC<PandaMascotProps> = ({
  size = 'md',
  isThinking = false,
  className = '',
  showStatusDot = true,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full drop-shadow-md select-none transition-transform duration-300 ${
          isThinking ? 'animate-bounce' : 'hover:scale-105'
        }`}
      >
        {/* Background Aura / Circular Badge */}
        <circle cx="50" cy="50" r="48" fill="url(#panda_bg_grad)" stroke="#10B981" strokeWidth="2.5" />

        {/* Panda Ears */}
        <circle cx="23" cy="23" r="14" fill="#0F172A" />
        <circle cx="23" cy="23" r="7" fill="#334155" />

        <circle cx="77" cy="23" r="14" fill="#0F172A" />
        <circle cx="77" cy="23" r="7" fill="#334155" />

        {/* Panda Head Base */}
        <ellipse cx="50" cy="56" rx="36" ry="32" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Eye Patches (Iconic Tilted Ovals) */}
        <ellipse cx="35" cy="52" rx="10.5" ry="13.5" fill="#0F172A" transform="rotate(-18 35 52)" />
        <ellipse cx="65" cy="52" rx="10.5" ry="13.5" fill="#0F172A" transform="rotate(18 65 52)" />

        {/* Shiny Big Eyes with High-tech Cyan Iris */}
        <circle cx="36" cy="51.5" r="5" fill="#FFFFFF" />
        <circle cx="37" cy="51.5" r="2.8" fill="#0284C7" />
        <circle cx="38" cy="50" r="1.3" fill="#FFFFFF" />

        <circle cx="64" cy="51.5" r="5" fill="#FFFFFF" />
        <circle cx="63" cy="51.5" r="2.8" fill="#0284C7" />
        <circle cx="62" cy="50" r="1.3" fill="#FFFFFF" />

        {/* Blushing Pink Cheeks */}
        <ellipse cx="26" cy="64" rx="5.5" ry="3" fill="#FB7185" opacity="0.6" />
        <ellipse cx="74" cy="64" rx="5.5" ry="3" fill="#FB7185" opacity="0.6" />

        {/* Cute Triangular Nose */}
        <path d="M46 62 Q50 58.5 54 62 Q50 67.5 46 62 Z" fill="#0F172A" />

        {/* Happy Smiling Mouth */}
        <path
          d="M45 68 Q50 73.5 55 68"
          stroke="#0F172A"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Green Bamboo Sprout / New Hope Leaf on Head */}
        <path
          d="M50 17 C53 10, 62 8, 66 12 C64 19, 54 21, 50 17 Z"
          fill="#10B981"
          stroke="#047857"
          strokeWidth="1"
        />
        <path
          d="M48 18 C44 12, 35 12, 33 17 C37 22, 45 22, 48 18 Z"
          fill="#34D399"
          stroke="#059669"
          strokeWidth="1"
        />

        {/* Sparkle Stars if Thinking */}
        {isThinking && (
          <>
            <polygon points="12,12 14,8 16,12 20,14 16,16 14,20 12,16 8,14" fill="#F59E0B" />
            <polygon points="84,14 86,10 88,14 92,16 88,18 86,22 84,18 80,16" fill="#F59E0B" />
          </>
        )}

        <defs>
          <linearGradient id="panda_bg_grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F0FDF4" />
            <stop offset="0.5" stopColor="#E0F2FE" />
            <stop offset="1" stopColor="#D1FAE5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Online Glowing Dot */}
      {showStatusDot && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full ring-2 ring-emerald-400/40 animate-pulse" />
      )}
    </div>
  );
};

