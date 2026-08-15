import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MeshGradient } from '../components/ui/MeshGradient';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors">
      <MeshGradient intensity="medium" />

      <header className="p-6 flex items-center justify-between max-w-6xl mx-auto w-full relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">
            InterviewPilot
          </span>
        </Link>
        <ThemeToggle size="sm" />
      </header>

      <div className="max-w-md w-full mx-auto px-4 py-8 relative z-10">
        <div className="p-8 rounded-2xl bg-surface border border-border shadow-elevated space-y-6">
          {isSubmitted ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Check your email</h2>
              <p className="text-xs text-foreground-muted leading-relaxed">
                If an account exists for <strong className="text-foreground">{email}</strong>, we've sent password reset instructions.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="secondary" className="w-full justify-center">
                    Return to login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  Reset password
                </h1>
                <p className="text-xs text-foreground-muted">
                  Enter your email address to receive a recovery link
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Button
                  type="submit"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full justify-center shadow-sm"
                >
                  Send Reset Link
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-foreground-muted border-t border-border/60">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to sign in</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="p-6 text-center text-xs text-foreground-subtle relative z-10">
        © {new Date().getFullYear()} InterviewPilot, Inc.
      </footer>
    </div>
  );
};
