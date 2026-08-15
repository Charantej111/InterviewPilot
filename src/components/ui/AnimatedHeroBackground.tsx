import React, { useEffect, useState } from 'react';

export const AnimatedHeroBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: Math.round((e.clientX / innerWidth) * 100),
        y: Math.round((e.clientY / innerHeight) * 100),
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
      {/* Ambient Moving Aurora Orbs */}
      <div className="hero-aurora-container">
        {/* Orb 1 - Vibrant Indigo */}
        <div className="aurora-orb orb-1" />
        
        {/* Orb 2 - Electric Cyan */}
        <div className="aurora-orb orb-2" />
        
        {/* Orb 3 - Glowing Violet / Pink */}
        <div className="aurora-orb orb-3" />
        
        {/* Orb 4 - Interactive Mouse-Following Light */}
        <div
          className="aurora-orb orb-mouse"
          style={{
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
          }}
        />
      </div>

      {/* Grid Pattern Texture Overlay */}
      <div className="hero-grid-pattern" />

      {/* Soft Gaussian Diffusion Mask */}
      <div className="absolute inset-0 backdrop-blur-[60px] bg-background/20" />
    </div>
  );
};
