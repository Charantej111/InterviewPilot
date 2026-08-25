import React from 'react';
import './BoxLoader.css';
import { cn } from '../../lib/utils';

export interface BoxLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const BoxLoader: React.FC<BoxLoaderProps> = ({
  size = 'md',
  label,
  className = '',
}) => {
  const sizeMap = {
    sm: 'boxes-sm',
    md: 'boxes-md',
    lg: 'boxes-lg',
  };

  return (
    <div className={cn('box-loader-container', className)}>
      <div className="relative flex items-center justify-center min-h-[100px] min-w-[120px]">
        <div className={cn('boxes', sizeMap[size])}>
          <div className="box box-1">
            <div className="face face-front" />
            <div className="face face-right" />
            <div className="face face-top" />
            <div className="face face-back" />
          </div>
          <div className="box box-2">
            <div className="face face-front" />
            <div className="face face-right" />
            <div className="face face-top" />
            <div className="face face-back" />
          </div>
          <div className="box box-3">
            <div className="face face-front" />
            <div className="face face-right" />
            <div className="face face-top" />
            <div className="face face-back" />
          </div>
          <div className="box box-4">
            <div className="face face-front" />
            <div className="face face-right" />
            <div className="face face-top" />
            <div className="face face-back" />
          </div>
        </div>
      </div>

      {label && (
        <p className="mt-4 text-xs font-semibold text-foreground-muted tracking-wide animate-pulse text-center">
          {label}
        </p>
      )}
    </div>
  );
};

export default BoxLoader;
