import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import GradientWaves from '../components/reactbits/GradientWaves';
import { ArrowRight, Lock, Mail, User, Sparkles } from 'lucide-react';

import { Logo } from '../components/ui/Logo';

export const SignupPage: React.FC = () => {
  const [name, setName] = useState('Charan Tej');
  const [email, setEmail] = useState('charan@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      login(email, name);
      setIsLoading(false);
      navigate('/setup');
    }, 500);
  };

  const handleQuickDemo = () => {
    login('demo@interviewpilot.ai', 'Charan Tej');
    navigate('/setup');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors">
      {/* 3D WebGL GradientWaves Radiant Horizon Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-75 dark:opacity-90">
        <GradientWaves
          horizonColor="#5227FF"
          waveColor="#FF9FFC"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      {/* Top Header */}
      <header className="p-6 flex items-center justify-between max-w-5xl mx-auto w-full relative z-10">
        <Link to="/" className="flex items-center">
          <Logo size="lg" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Centered Frosted Glass Auth Card */}
      <main className="max-w-md w-full mx-auto px-4 py-4 relative z-10">
        <div className="p-7 sm:p-9 rounded-3xl bg-surface/90 dark:bg-[#11111c]/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 border-t-white/80 dark:border-t-white/25 shadow-2xl space-y-6">
          <div className="space-y-1.5 text-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-xs font-semibold mb-1 shadow-xs">
              <Sparkles size={12} />
              <span>Personalized AI Practice</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Create your account
            </h1>
            <p className="text-xs font-semibold text-foreground-muted">
              Start practicing tailored mock interviews in seconds
            </p>
          </div>

          {/* Quick 1-Click Clean Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-4 rounded-xl border border-primary/25 dark:border-white/10 bg-primary/10 hover:bg-primary/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-primary dark:text-purple-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <Sparkles size={14} />
            <span>1-Click Instant Demo Access</span>
          </button>

          <div className="flex items-center gap-3 text-xs text-foreground-subtle">
            <div className="h-px bg-border flex-1" />
            <span className="font-semibold text-foreground-muted text-[11px]">or continue with email</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="e.g. Charan Tej"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-foreground-muted" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-foreground-muted" />}
              required
            />

            <Input
              label="Create Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-foreground-muted" />}
              required
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full justify-center mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account & Start Practice
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-foreground-muted border-t border-border">
            <span>Already have an account? </span>
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-xs text-foreground-subtle relative z-10 font-medium">
        © {new Date().getFullYear()} InterviewPilot, Inc. Built for meaningful interview practice.
      </footer>
    </div>
  );
};

export default SignupPage;
