import React, { useState, type ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Layers, 
  User, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from '../ui/Logo';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/setup', label: 'Interviews', icon: Layers },
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      {/* Desktop Fixed Glassmorphic Sidebar */}
      <aside className="border-r border-border/80 bg-surface/80 backdrop-blur-2xl transition-colors">
        <Link to="/" className="flex items-center px-2 py-1">
          <Logo size="lg" />
        </Link>

        <nav className="side-nav mt-8 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = 
              location.pathname === path || 
              (path === '/setup' && location.pathname.startsWith('/interview'));

            return (
              <NavLink
                key={path}
                to={path}
                className={isActive ? 'active shadow-xs' : ''}
              >
                <Icon size={16} className={isActive ? 'text-primary' : 'text-foreground-muted'} />
                <span>{label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Profile Section */}
        <div className="mt-auto pt-4 border-t border-border/80 flex items-center justify-between px-1">
          <Link to="/settings" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Avatar name="Charan Tej" size="xs" status="online" />
            <div className="flex flex-col">
              <span className="font-bold text-foreground text-xs leading-none">Charan Tej</span>
              <span className="text-[10px] text-foreground-muted mt-0.5">Pro Member</span>
            </div>
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="workspace">
        {/* Mobile Header Bar */}
        <header className="workspace-mobile px-4 py-3 border-b border-border/80 bg-surface/80 backdrop-blur-xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1px]">
              <div className="w-full h-full rounded-[5px] bg-[#0b0b12] flex items-center justify-center text-[9px] font-extrabold text-white">
                IP
              </div>
            </div>
            <span className="font-extrabold text-sm text-foreground">InterviewPilot</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-1.5 rounded-xl text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        {/* Animated Mobile Responsive Glassmorphic Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              />

              {/* Slide-out Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className="fixed inset-y-0 left-0 z-50 w-72 bg-surface/95 backdrop-blur-2xl border-r border-border/80 p-6 flex flex-col justify-between shadow-2xl md:hidden"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-border/80">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-[1px]">
                        <div className="w-full h-full rounded-[7px] bg-[#0b0b12] flex items-center justify-center text-[10px] font-bold text-white">
                          IP
                        </div>
                      </div>
                      <span className="font-extrabold text-base text-foreground">InterviewPilot</span>
                    </Link>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Nav List */}
                  <nav className="mt-6 space-y-1.5">
                    {navItems.map(({ path, label, icon: Icon }, idx) => {
                      const isActive = 
                        location.pathname === path || 
                        (path === '/setup' && location.pathname.startsWith('/interview'));

                      return (
                        <motion.div
                          key={path}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                        >
                          <NavLink
                            to={path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                              isActive
                                ? 'bg-primary/10 text-primary border border-primary/30 font-bold shadow-xs'
                                : 'text-foreground-muted hover:text-foreground hover:bg-surface-subtle'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={16} />
                              <span>{label}</span>
                            </div>
                            <ChevronRight size={14} className="opacity-40" />
                          </NavLink>
                        </motion.div>
                      );
                    })}
                  </nav>
                </div>

                {/* Drawer Footer */}
                <div className="pt-4 border-t border-border/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar name="Charan Tej" size="xs" status="online" />
                    <div>
                      <div className="font-bold text-xs text-foreground">Charan Tej</div>
                      <div className="text-[10px] text-foreground-muted">Pro Member</div>
                    </div>
                  </div>
                  <ThemeToggle />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {children}
      </div>
    </div>
  );
};
