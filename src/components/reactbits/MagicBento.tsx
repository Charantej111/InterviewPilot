import React, { useRef } from 'react';
import './MagicBento.css';

export interface MagicBentoProps {
  children?: React.ReactNode;
  className?: string;
  enableSpotlight?: boolean;
  enableTilt?: boolean;
}

export const MagicBento: React.FC<MagicBentoProps> = ({
  children,
  className = '',
  enableSpotlight = true,
  enableTilt = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (enableSpotlight) {
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
    }

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    }
  };

  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    if (enableTilt) {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`magic-bento-card ${className}`.trim()}
    >
      {enableSpotlight && <div className="magic-bento-spotlight" />}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default MagicBento;
