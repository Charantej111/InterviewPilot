import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Preloader.css';

export interface PreloaderProps {
  onComplete?: () => void;
  words?: string[];
  brandName?: string;
  durationMs?: number;
  className?: string;
}

const DEFAULT_WORDS = [
  'Hello',
  'Bonjour',
  'Ciao',
  'Olà',
  'Namaste',
  'Guten Tag',
  'InterviewPilot',
];

export const Preloader: React.FC<PreloaderProps> = ({
  onComplete,
  words = DEFAULT_WORDS,
  brandName = 'InterviewPilot',
  durationMs = 2200,
  className = '',
}) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });

    const handleResize = () => {
      setDimension({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Word cycling sequence
  useEffect(() => {
    if (wordIndex === words.length - 1) return;

    const wordDelay = Math.max(140, Math.floor((durationMs * 0.7) / words.length));
    const timer = setTimeout(() => {
      setWordIndex((prev) => prev + 1);
    }, wordIndex === 0 ? 350 : wordDelay);

    return () => clearTimeout(timer);
  }, [wordIndex, words.length, durationMs]);

  // Smooth 0 to 100% counter
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsExiting(true);
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs]);

  const initialPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height + 300} 0 ${dimension.height} L0 0`;
  const targetPath = `M0 0 L${dimension.width} 0 L${dimension.width} ${dimension.height} Q${dimension.width / 2} ${dimension.height} 0 ${dimension.height} L0 0`;

  const curveVariants = {
    initial: {
      d: initialPath,
    },
    exit: {
      d: targetPath,
      transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1], delay: 0.1 },
    },
  };

  const handleAnimationComplete = useCallback(
    (definition: string) => {
      if (definition === 'exit' && onComplete) {
        onComplete();
      }
    },
    [onComplete]
  );

  return (
    <motion.div
      variants={{
        initial: { top: 0 },
        exit: {
          top: '-100vh',
          transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
        },
      }}
      initial="initial"
      animate={isExiting ? 'exit' : 'initial'}
      onAnimationComplete={handleAnimationComplete}
      className={`reactbits-preloader ${className}`}
    >
      <div className="reactbits-preloader-glow" />

      {dimension.width > 0 && (
        <>
          <div className="relative z-20 flex flex-col items-center justify-center space-y-6">
            {/* Word Cycling Display */}
            <div className="flex items-center gap-3 text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white font-mono">
              <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={wordIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {words[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Counter Progress Bar */}
            <div className="w-48 sm:w-64 space-y-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-75 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                <span>{brandName}</span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>

          {/* SVG Smooth Morphing Shutter */}
          <svg className="absolute top-0 w-full h-[calc(100%+300px)] pointer-events-none fill-[#090a0f]">
            <motion.path
              variants={curveVariants as any}
              initial="initial"
              animate={isExiting ? 'exit' : 'initial'}
            />
          </svg>
        </>
      )}
    </motion.div>
  );
};

export default Preloader;
