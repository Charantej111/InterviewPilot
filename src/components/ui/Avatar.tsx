import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Sparkles } from 'lucide-react';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  isAI?: boolean;
  isLive?: boolean;
  className?: string;
}

// Deterministic harmonious gradient generator for initials
const getGradientFromName = (name: string) => {
  const gradients = [
    'from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 border-indigo-500/30',
    'from-blue-500/20 via-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
    'from-emerald-500/20 via-teal-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    'from-violet-500/20 via-purple-500/20 to-indigo-500/20 text-violet-400 border-violet-500/30',
    'from-rose-500/20 via-pink-500/20 to-amber-500/20 text-rose-400 border-rose-500/30',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  name = 'Charan Tej',
  src,
  size = 'md',
  status,
  isAI = false,
  isLive = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const sizeConfig = {
    xs: { box: 'w-6 h-6 text-[10px]', status: 'w-1.5 h-1.5 ring-1', badge: 'w-2.5 h-2.5 p-0.5' },
    sm: { box: 'w-8 h-8 text-xs', status: 'w-2 h-2 ring-1.5', badge: 'w-3 h-3 p-0.5' },
    md: { box: 'w-10 h-10 text-xs font-semibold', status: 'w-2.5 h-2.5 ring-2', badge: 'w-3.5 h-3.5 p-0.5' },
    lg: { box: 'w-12 h-12 text-sm font-bold', status: 'w-3 h-3 ring-2', badge: 'w-4 h-4 p-0.5' },
    xl: { box: 'w-16 h-16 text-lg font-bold', status: 'w-3.5 h-3.5 ring-2', badge: 'w-5 h-5 p-1' },
    '2xl': { box: 'w-20 h-20 text-xl font-extrabold', status: 'w-4 h-4 ring-2', badge: 'w-6 h-6 p-1' },
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-background',
    busy: 'bg-rose-500 ring-background',
    away: 'bg-amber-500 ring-background',
    offline: 'bg-slate-400 ring-background',
  };

  const gradientStyle = isAI
    ? 'bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-pink-500/25 text-primary border-primary/40 shadow-sm shadow-primary/10'
    : `bg-gradient-to-br ${getGradientFromName(name)}`;

  return (
    <div className="relative inline-flex shrink-0 select-none">
      <div
        className={cn(
          'relative rounded-full overflow-hidden flex items-center justify-center border transition-all duration-200',
          sizeConfig[size].box,
          gradientStyle,
          isLive && 'ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-background animate-pulse',
          className
        )}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-mono tracking-tight font-bold">{initials}</span>
        )}
      </div>

      {/* Status Dot */}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            sizeConfig[size].status,
            statusColors[status]
          )}
        />
      )}

      {/* AI Badge */}
      {isAI && (
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full bg-primary text-white flex items-center justify-center ring-2 ring-background shadow-xs',
            sizeConfig[size].badge
          )}
          title="AI Interviewer"
        >
          <Sparkles className="w-full h-full" />
        </span>
      )}
    </div>
  );
};
