import React from 'react';
import ColorBends from '../reactbits/ColorBends';
import StaggeredText from '../reactbits/StaggeredText';
import { HeroChatbox } from './HeroChatbox';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 text-center">
      {/* 3D WebGL ColorBends Radiant Purple Ribbon Horizon */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-75 dark:opacity-95"
        style={{
          maskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 75%, transparent 100%)',
        }}
      >
        <ColorBends
          colors={['#8B5CF6', '#A855F7', '#EC4899', '#6366F1']}
          speed={0.18}
          rotation={35}
          autoRotate={0.03}
          scale={1.15}
          frequency={1.0}
          warpStrength={1.25}
          mouseInfluence={0.9}
          parallax={0.5}
          noise={0.16}
          iterations={2}
          intensity={2.0}
          bandWidth={5.0}
          transparent={true}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Headline with Proportionate Cursive "Good to See You!" */}
        <h1 className="tracking-tight leading-[1.15] mb-4">
          <span className="block font-cursive text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground transform -rotate-1 inline-block drop-shadow-xs mb-1 select-none">
            Good to See You!
          </span>
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mt-1">
            <StaggeredText
              text="Practice the interview you’re actually facing."
              delay={0.15}
              staggerDuration={0.02}
              direction="blur"
            />
          </span>
        </h1>

        <p className="max-w-xl mx-auto text-xs sm:text-sm text-foreground-muted mb-4 leading-relaxed font-medium">
          I'm your 24/7 personalized AI interviewer. Attach your resume or enter your target role below to begin.
        </p>

        {/* The Premium AI Chatbox & Resume Dropzone */}
        <HeroChatbox />
      </div>
    </section>
  );
};

export default HeroSection;
