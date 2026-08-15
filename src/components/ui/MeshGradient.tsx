import React from 'react';
import { cn } from '../../lib/utils';

export interface MeshGradientProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'hero';
}

export const MeshGradient: React.FC<MeshGradientProps> = ({
  className,
  intensity = 'subtle',
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden select-none',
        className
      )}
    >
      {intensity === 'hero' && (
        <>
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[100px] opacity-70" />
          <div className="absolute top-[10%] -left-[10%] w-[500px] h-[350px] bg-accent/8 dark:bg-accent/12 rounded-full blur-[90px] opacity-60" />
          <div className="absolute top-[20%] -right-[10%] w-[500px] h-[350px] bg-sky-500/8 dark:bg-sky-500/10 rounded-full blur-[90px] opacity-50" />
        </>
      )}

      {intensity === 'medium' && (
        <>
          <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-primary/8 dark:bg-primary/12 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[250px] bg-accent/6 dark:bg-accent/10 rounded-full blur-[80px]" />
        </>
      )}

      {intensity === 'subtle' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-primary/5 dark:bg-primary/8 rounded-full blur-[90px]" />
      )}
    </div>
  );
};
