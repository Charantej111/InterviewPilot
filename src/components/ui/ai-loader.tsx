import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import './LetterLoader.css';

export interface AILoaderProps {
  text?: string;
  className?: string;
}

export const Component: React.FC<AILoaderProps> = ({
  text = 'Generating',
  className = '',
}) => {
  const [_count, _setCount] = useState(0);
  const letters = text.split('');

  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <div className="loader-wrapper w-48 h-48">
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
        <div className="loader" />
      </div>
    </div>
  );
};

export default Component;
