import React from 'react';
import pandaNeonBadge from '../../assets/Panda-AI-Assistant-Neon-Badge.png';

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
    md: 'w-12 h-12',
    lg: 'w-15 h-15 sm:w-16 sm:h-16',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}>
      <img
        src={pandaNeonBadge}
        alt="New Hope Panda AI Assistant"
        className={`w-full h-full object-contain rounded-full select-none transition-all duration-300 drop-shadow-md ${
          isThinking
            ? 'animate-bounce drop-shadow-[0_0_16px_rgba(16,185,129,0.9)] scale-105'
            : 'hover:scale-105 group-hover:drop-shadow-[0_0_14px_rgba(16,185,129,0.6)]'
        }`}
      />
      {showStatusDot && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 shadow-xs ${
            size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'
          } ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}
        />
      )}
    </div>
  );
};

export default PandaMascot;
