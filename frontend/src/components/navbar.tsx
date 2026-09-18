'use client';

import React, { useEffect, useState } from 'react';
import { Zap, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { checkHealth } from '../lib/api-client';

export function Navbar() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    let isMounted = true;
    const verifyBackend = async () => {
      try {
        const res = await checkHealth();
        if (isMounted && res.status === 'ok') {
          setHealthStatus('ok');
        }
      } catch {
        if (isMounted) {
          setHealthStatus('error');
        }
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                BUP Smart Campus
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                CSE FEST 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              LLM-Assisted Energy Directive Interpretation & Schedule Optimizer
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs">
            <Activity className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400">API Service:</span>
            {healthStatus === 'checking' && (
              <span className="flex items-center text-amber-400">
                <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                Checking
              </span>
            )}
            {healthStatus === 'ok' && (
              <span className="flex items-center font-medium text-emerald-400">
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Online (HTTP 200)
              </span>
            )}
            {healthStatus === 'error' && (
              <span className="flex items-center font-medium text-rose-400">
                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                Offline
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
