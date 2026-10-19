import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const [hasError, setHasError] = React.useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const getInitials = (n: string) => {
    if (!n) return 'HR';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setHasError(true)}
        className={cn(
          'rounded-full object-cover bg-slate-100 ring-2 ring-white shrink-0',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  // Fallback Initials
  return (
    <div
      className={cn(
        'rounded-full bg-brand-100 text-brand-700 ring-2 ring-white font-semibold flex items-center justify-center shrink-0 uppercase select-none',
        sizeClasses[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
