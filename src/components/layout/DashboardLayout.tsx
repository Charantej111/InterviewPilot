import React from 'react';
import { AppShell } from './AppShell';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <AppShell>
      <main className="page-pad">
        {children}
      </main>
    </AppShell>
  );
};
