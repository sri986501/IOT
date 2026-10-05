import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WaterGuardian Pro — Industrial IoT Control',
  description: 'Enterprise-grade real-time water infrastructure telemetry and SCADA interface.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💧</text></svg>" />
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
