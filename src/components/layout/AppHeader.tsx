import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Plus, 
  LayoutDashboard, 
  Sliders, 
  Flame 
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/dashboard';
  const isSettings = location.pathname === '/settings';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              InterviewPilot
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isDashboard
                  ? 'bg-surface-subtle text-foreground border border-border/60'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                isSettings
                  ? 'bg-surface-subtle text-foreground border border-border/60'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Settings
            </Link>
          </nav>
        </div>

        {/* Right: Streak, Theme Toggle, New Interview CTA & Profile */}
        <div className="flex items-center gap-3">
          {/* Practice Streak Badge */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium"
            title={`${user.streakDays}-day practice streak!`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{user.streakDays}d streak</span>
          </div>

          <ThemeToggle size="sm" />

          {location.pathname !== '/setup' && (
            <Button
              size="sm"
              onClick={() => navigate('/setup')}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              New interview
            </Button>
          )}

          {/* User Profile avatar */}
          <Link
            to="/settings"
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
            title="Account & Settings"
          >
            <Avatar name={user.name} size="sm" />
            <span className="hidden md:inline text-xs font-medium text-foreground">
              {user.name.split(' ')[0]}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};
