import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import GradientWaves from '../components/reactbits/GradientWaves';
import { ArrowRight, Mail, KeyRound, ArrowLeft } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

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

      {/* Main Centered Frosted Glass Card */}
      <main className="max-w-md w-full mx-auto px-4 py-4 relative z-10">
        <div className="p-7 sm:p-9 rounded-3xl bg-surface/90 dark:bg-[#11111c]/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 border-t-white/80 dark:border-t-white/25 shadow-2xl space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Passwordless Authentication
            </h1>
            <p className="text-xs text-foreground-muted leading-relaxed">
              InterviewPilot uses secure, passwordless email OTP verification. You don't need to remember or reset passwords.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-subtle border border-border/80 text-left space-y-2 text-xs text-foreground-muted">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Mail className="w-4 h-4 text-primary" />
              <span>How sign-in works:</span>
            </div>
            <p className="leading-relaxed">
              Simply enter your email address on the sign-in page to receive a secure 6-digit one-time code.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Button
              type="button"
              size="lg"
              onClick={() => navigate('/login')}
              className="w-full justify-center"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In with Email OTP
            </Button>

            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Create a new account</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-xs text-foreground-subtle relative z-10 font-medium">
        © {new Date().getFullYear()} InterviewPilot, Inc. Passwordless email OTP verification.
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
