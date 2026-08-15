import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Buttery-smooth spring physics for ambient background spotlight
  const haloX = useSpring(-300, { stiffness: 220, damping: 26 });
  const haloY = useSpring(-300, { stiffness: 220, damping: 26 });

  useEffect(() => {
    // Only run on desktop devices with fine pointer (mouse)
    if (typeof window === 'undefined' || !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      haloX.set(e.clientX);
      haloY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [haloX, haloY, isVisible]);

  if (!isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Soft Ambient Spotlight Glow (No extra cursor rings or beads) */}
      <motion.div
        style={{
          x: haloX,
          y: haloY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          opacity: isVisible ? 0.6 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-96 h-96 rounded-full blur-3xl pointer-events-none"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.14)_0%,rgba(168,85,247,0.08)_35%,rgba(56,189,248,0.04)_60%,transparent_75%)] dark:bg-[radial-gradient(circle,rgba(139,92,246,0.18)_0%,rgba(99,102,241,0.10)_40%,transparent_75%)]" />
      </motion.div>
    </div>
  );
};

export default CustomCursor;
