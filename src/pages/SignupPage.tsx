import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import GradientWaves from '../components/reactbits/GradientWaves';
import { ArrowRight, ArrowLeft, Mail, User, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { OtpInput } from '../components/auth/OtpInput';
import { Component as AILoader } from '../components/ui/ai-loader';
import { getPostAuthDestination } from '../lib/onboardingRouter';

export const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExistingUserError, setIsExistingUserError] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    requestOtp,
    verifyOtp,
    cooldownRemaining,
    isRequestingOtp,
    isVerifyingOtp,
  } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect immediately without rendering signup form
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      const destination = getPostAuthDestination(user, location.state?.from?.pathname);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, user, navigate, location.state]);

  // Step 1: Send OTP to new user email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsExistingUserError(false);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setErrorMessage('Please provide your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestOtp(cleanEmail, { name: cleanName, isSignup: true });
      if (res.error) {
        setErrorMessage(res.error);
        if (res.isExistingAccount) {
          setIsExistingUserError(true);
        }
      } else {
        setStep('otp');
        setSuccessMessage(`We sent a 6-digit code to ${cleanEmail}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e?: React.FormEvent, codeToVerify?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const targetCode = (codeToVerify || otp).trim();
    if (targetCode.length < 6 || targetCode.length > 8) {
      setErrorMessage('Please enter the complete verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyOtp(email, targetCode);
      if (res.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
      } else {
        setIsRegistering(true);
        const destination = getPostAuthDestination(res.user || user, location.state?.from?.pathname);
        navigate(destination, { replace: true });
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  // Resend code handler
  const handleResend = async () => {
    if (cooldownRemaining > 0 || isRequestingOtp) return;
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await requestOtp(email, { name: name.trim(), isSignup: true });
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('A fresh verification code has been sent to your email.');
    }
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
          {step === 'details' ? (
            /* STEP 1: ENTER NAME & EMAIL */
            <>
              <div className="space-y-1.5 text-center">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Create your account
                </h1>
                <p className="text-xs font-semibold text-foreground-muted">
                  Enter your details to receive a 6-digit one-time code
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center space-y-2">
                  <p>{errorMessage}</p>
                  {isExistingUserError && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => navigate('/login')}
                      className="w-full justify-center text-xs font-bold"
                    >
                      Sign In to Existing Account
                    </Button>
                  )}
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  leftIcon={<User className="w-4 h-4 text-foreground-muted" />}
                  required
                  autoComplete="name"
                  disabled={isSubmitting || isRequestingOtp}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-foreground-muted" />}
                  required
                  autoComplete="email"
                  disabled={isSubmitting || isRequestingOtp}
                />

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting || isRequestingOtp}
                  className="w-full justify-center mt-2"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue & Send Code
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-foreground-muted border-t border-border">
                <span>Already have an account? </span>
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* STEP 2: VERIFY 6-DIGIT OTP */
            <>
              <div className="space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-1">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  Verify your email
                </h1>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  We sent a 6-digit verification code to <br />
                  <strong className="text-foreground font-semibold">{email}</strong>
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium text-center">
                  {errorMessage}
                </div>
              )}

              {successMessage && !errorMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2 text-center">
                  <label className="block text-xs font-bold text-foreground">
                    Enter Verification Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onComplete={(code) => handleVerifyOtp(undefined, code)}
                    disabled={isSubmitting}
                    hasError={Boolean(errorMessage)}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isSubmitting || isVerifyingOtp}
                  disabled={otp.length < 6 || isSubmitting || isVerifyingOtp}
                  className="w-full justify-center"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Start Practice
                </Button>
              </form>

              {/* Resend Cooldown and Edit Email Actions */}
              <div className="space-y-3 pt-2 text-center text-xs border-t border-border">
                <div className="flex items-center justify-center">
                  {cooldownRemaining > 0 ? (
                    <span className="text-foreground-muted font-medium">
                      Resend code in <strong className="text-foreground font-mono">{cooldownRemaining}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isRequestingOtp}
                      className="inline-flex items-center gap-1.5 text-primary font-bold hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isRequestingOtp ? 'animate-spin' : ''} />
                      <span>Resend verification code</span>
                    </button>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('details');
                      setOtp('');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="inline-flex items-center gap-1 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Use a different email address</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="p-6 text-center text-xs text-foreground-subtle relative z-10 font-medium">
        © {new Date().getFullYear()} InterviewPilot, Inc. Passwordless email OTP verification.
      </footer>

      {/* Post-Signup Onboarding Loading Overlay using 21st.dev AI Loader */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl">
          <AILoader text="Setting Up" />
        </div>
      )}
    </div>
  );
};

export default SignupPage;
