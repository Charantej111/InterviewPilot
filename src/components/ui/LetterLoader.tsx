import React from 'react';
import './LetterLoader.css';
import { cn } from '../../lib/utils';

export interface LetterLoaderProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LetterLoader: React.FC<LetterLoaderProps> = ({
  text = 'Analyzing',
  className = '',
  size = 'md',
}) => {
  const letters = text.split('');

  const sizeClasses = {
    sm: 'w-36 h-36',
    md: 'w-48 h-48',
    lg: 'w-56 h-56',
  };

  return (
    <div className={cn('loader-container-center', className)}>
      <div className={cn('loader-wrapper', sizeClasses[size])}>
        {/* 3D Atmospheric Glowing Plasma Layer */}
        <div className="loader"></div>

        {/* Luminous Organic Letter Wave */}
        <div className="loader-letter-track">
          {letters.map((letter, index) => (
            <span
              key={index}
              className="loader-letter"
              style={{
                animationDelay: `${index * 0.08}s`,
              }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LetterLoader;
