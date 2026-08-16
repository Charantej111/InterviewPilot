import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ArrowUpRight, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-border/80 bg-surface/50 backdrop-blur-xl pt-16 pb-12 transition-colors overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4 pr-0 md:pr-6">
            <Link to="/" className="inline-flex items-center">
              <Logo size="md" />
            </Link>
            <p className="text-xs text-foreground-muted max-w-sm leading-relaxed">
              Targeted mock interview simulation calibrated to your resume and exact job descriptions. Actionable STAR evaluations and adaptive follow-ups.
            </p>
            
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Evaluation Engines Online</span>
            </div>
          </div>

          {/* Links 1 - Product */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li>
                <a href="#how" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                  <span>How it works</span>
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features & Rubrics
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </a>
              </li>
              <li>
                <Link to="/setup" className="hover:text-foreground transition-colors inline-flex items-center gap-1 text-primary font-semibold">
                  <span>Interview Builder</span>
                  <ArrowUpRight size={12} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2 - Role Practice */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Tracks
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Product Management</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Software Engineering</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Systems Architecture</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Data & Analytics</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Business Operations</Link></li>
            </ul>
          </div>

          {/* Links 3 - Account & App */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Workspace
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">New Session</Link></li>
              <li><Link to="/settings" className="hover:text-foreground transition-colors">Profile & Settings</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Candidate Sign In</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Trust Badges */}
        <div className="pt-8 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-subtle">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} InterviewPilot. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium text-foreground-muted">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-primary" />
              <span>Deterministic Rubrics</span>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Zap size={13} className="text-amber-500" />
              <span>Real-Time Feedback</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
