import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Component as AILoader } from './ai-loader';

export interface AppPreloaderProps {
  minDurationMs?: number;
  onFinish?: () => void;
}

export const AppPreloader: React.FC<AppPreloaderProps> = ({
  minDurationMs = 1200,
  onFinish,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (onFinish) onFinish();
    }, minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, onFinish]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="app-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl text-foreground select-none"
        >
          <AILoader text="Generating" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppPreloader;
