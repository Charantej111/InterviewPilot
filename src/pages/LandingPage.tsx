import React, { useState, useCallback } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Footer } from '../components/layout/Footer';
import { Preloader } from '../components/ui/preloader';

export const LandingPage: React.FC = () => {
  const [showPreloader, setShowPreloader] = useState(true);

  const handleComplete = useCallback(() => {
    setShowPreloader(false);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {showPreloader && <Preloader onComplete={handleComplete} />}
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
