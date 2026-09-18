import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BUP Energy Optimizer | Smart Campus Energy Scheduling',
  description: 'BUP CSE Fest 2026 Preliminary Challenge - LLM-Assisted Energy Scheduling & Optimization'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
