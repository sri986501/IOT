'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MetricsHeader } from '@/components/dashboard/MetricsHeader';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      {/* High-tech Collapsible Sidebar */}
      <Sidebar />

      {/* Main SCADA Workspace Container */}
      <div className="main-wrapper">
        <MetricsHeader />
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
