import React from 'react';
import { Link } from 'react-router-dom';

import { Logo } from '../ui/Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-background py-14 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center">
              <Logo size="md" />
            </Link>
            <p className="text-xs text-foreground-muted max-w-sm leading-relaxed">
              AI-powered mock interview practice tailored to your exact resume and target role. Adaptive follow-ups and rubric-based evaluations.
            </p>
          </div>

          {/* Links 1 */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Product
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Interview Builder</Link></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Roles
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Product Manager</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Software Engineer</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Data / Analytics</Link></li>
              <li><Link to="/setup" className="hover:text-foreground transition-colors">Business Strategy</Link></li>
            </ul>
          </div>

          {/* Links 3 */}
          <div className="space-y-3">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Company
            </h5>
            <ul className="space-y-2 text-xs text-foreground-muted">
              <li><Link to="/settings" className="hover:text-foreground transition-colors">Settings</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-subtle">
          <div>
            © {new Date().getFullYear()} InterviewPilot. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Tailored Resume Practice</span>
            <span>•</span>
            <span>Real-Time Adaptive Mock</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
