'use client';

import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
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
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
            <Zap className="h-4 w-4 fill-emerald-400/20" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold tracking-tight text-white">
              BUP Energy Optimizer
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-full border border-zinc-800/80 bg-zinc-900/60 px-2.5 py-1 text-xs">
            {healthStatus === 'checking' && (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                <span className="text-zinc-400 text-[11px]">Connecting...</span>
              </>
            )}
            {healthStatus === 'ok' && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-zinc-300 text-[11px]">API Online</span>
              </>
            )}
            {healthStatus === 'error' && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span className="text-zinc-400 text-[11px]">API Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
