import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ArrowUpRight, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-border/80 bg-surface/50 backdrop-blur-xl pt-16 pb-12 transition-colors overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4 pr-0 md:pr-6 text-left">
            <Link to="/" className="inline-flex items-center">
              <Logo size="md" />
            </Link>
            <p className="text-xs text-foreground-muted max-w-sm leading-relaxed">
              Targeted mock interview simulation calibrated to your resume and exact job descriptions. Actionable STAR evaluations and adaptive follow-ups.
            </p>
          </div>

          {/* Links 1 - Product */}
          <div className="space-y-3 text-left">
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
                <Link to="/setup" className="hover:text-foreground transition-colors inline-flex items-center gap-1 text-primary font-semibold">
                  <span>Interview Builder</span>
                  <ArrowUpRight size={12} />
                </Link>
              </li>
            </ul>
          </div>

        {/* Links 2 - Role Practice */}
        <div className="space-y-3 text-left">
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
        <div className="space-y-3 text-left">
          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Workspace
          </h5>
          <ul className="space-y-2 text-xs text-foreground-muted">
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
            <li><Link to="/setup" className="hover:text-foreground transition-colors">New Session</Link></li>
            <li><Link to="/profile" className="hover:text-foreground transition-colors">Profile & Calibrations</Link></li>
            <li><Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
            <li><Link to="/login" className="hover:text-foreground transition-colors">Candidate Sign In</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar with Creator Card */}
      <div className="pt-8 border-t border-border/80 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-foreground-subtle">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} InterviewPilot. All rights reserved.</span>
        </div>

        {/* Creator Card */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900/90 dark:text-white border border-zinc-800 shadow-xl flex items-center gap-3.5 select-none hover:border-zinc-700 transition-colors">
          {/* Animated Avatar Video */}
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 bg-zinc-800 shrink-0 relative flex items-center justify-center shadow-inner">
            <video
              src="/avatar.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover scale-110"
            />
          </div>

          {/* Content & Action Buttons */}
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              <span>💖</span>
              <span>MADE WITH LOVE</span>
            </div>

            <h4 className="text-sm font-extrabold text-white tracking-tight">
              Charan Tej Neelam
            </h4>

            <div className="flex items-center gap-2 pt-0.5">
              <a
                href="https://charan.ofzen.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700/60 shadow-xs"
              >
                <ExternalLink size={11} />
                <span>Portfolio</span>
              </a>

              <a
                href="https://www.linkedin.com/in/charan-tej-neelam-bb0a9a302"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-zinc-700/60 shadow-xs"
              >
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);
};

export default Footer;
