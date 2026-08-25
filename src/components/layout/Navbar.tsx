import React, { useState } from 'react';
import { Menu, X, ArrowRight, LayoutDashboard, User, LogOut } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../ui/Logo';
import { useUser } from '../../context/UserContext';

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useUser();

  return (
    <div className="sticky top-4 z-50 w-full px-4 sm:px-6 max-w-4xl mx-auto">
      {/* Ultra-Clean Capsule Navbar */}
      <header className="relative w-full h-14 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0d0d15]/80 backdrop-blur-2xl px-4 sm:px-5 flex items-center justify-between shadow-sm transition-all">
        {/* Left: Brand Logo */}
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-foreground-muted">
          <a
            href="#how"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            How it works
          </a>
          <a
            href="#features"
            className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Features
          </a>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-full hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-primary font-semibold"
            >
              Dashboard
            </NavLink>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors px-2 py-1"
              >
                <User size={14} className="text-primary" />
                <span>{user?.name ? user.name.split(' ')[0] : 'Account'}</span>
              </button>
              <button
                onClick={() => navigate('/setup')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-xs active:scale-[0.98] transition-colors cursor-pointer"
              >
                <span>New Interview</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                title="Sign out"
                className="p-1.5 rounded-full text-foreground-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors px-2 py-1"
              >
                Sign in
              </NavLink>
              <button
                onClick={() => navigate('/setup')}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 shadow-xs active:scale-[0.98] transition-colors cursor-pointer"
              >
                <span>Start practicing</span>
                <ArrowRight size={13} />
              </button>
            </>
          )}
          <ThemeToggle />
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-full text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-300 dark:border-zinc-700 transition-colors shadow-xs cursor-pointer flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} className="stroke-[2.5]" /> : <Menu size={18} className="stroke-[2.5]" />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown capsule */}
      {open && (
        <div className="md:hidden mt-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-surface/95 backdrop-blur-2xl p-4 space-y-3 shadow-xl">
          <a
            href="#how"
            onClick={() => setOpen(false)}
            className="block py-2 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            How it works
          </a>
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="block py-2 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={() => setOpen(false)}
            className="block py-2 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
          >
            Pricing
          </a>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <NavLink
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold text-foreground-muted hover:text-foreground"
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </NavLink>
              <button
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  navigate('/setup');
                }}
              >
                <span>New Interview</span>
                <ArrowRight size={14} />
              </button>
              <button
                className="w-full py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  navigate('/login');
                }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border flex flex-col gap-2">
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className="text-center py-2 text-sm font-semibold text-foreground-muted hover:text-foreground"
              >
                Sign in
              </NavLink>
              <button
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                onClick={() => {
                  setOpen(false);
                  navigate('/setup');
                }}
              >
                <span>Start practicing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* Mobile Theme Row */}
          <div className="pt-2 border-t border-border/80 flex items-center justify-between px-3 py-1">
            <span className="text-xs font-semibold text-foreground-muted">Theme</span>
            <ThemeToggle size="sm" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
