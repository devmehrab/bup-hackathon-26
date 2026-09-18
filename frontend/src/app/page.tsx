'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/navbar';
import { ScenarioEditor } from '../components/scenario-editor';
import { MetricsOverview } from '../components/metrics-overview';
import { DirectivesPanel } from '../components/directives-panel';
import { HourlyChart } from '../components/hourly-chart';
import { ScheduleTable } from '../components/schedule-table';
import { SCENARIO_PRESETS } from '../lib/presets';
import { optimizeEnergy } from '../lib/api-client';
import {
  HourlyScenarioInput,
  BatteryConfig,
  OptimizationResponse
} from '../types/energy';
import { AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

export default function Home() {
  const defaultPreset = SCENARIO_PRESETS[0];

  const [scenarioId, setScenarioId] = useState(defaultPreset.scenario_id);
  const [operatorNotes, setOperatorNotes] = useState<string[]>([...defaultPreset.operator_notes]);
  const [battery, setBattery] = useState<BatteryConfig>({ ...defaultPreset.battery });
  const [hours, setHours] = useState<HourlyScenarioInput[]>(defaultPreset.generateHours());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const handleOptimize = async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const res = await optimizeEnergy({
        scenario_id: scenarioId,
        operator_notes: operatorNotes.filter((n) => n.trim().length > 0),
        hours,
        battery
      });

      const elapsed = Math.round(performance.now() - start);
      setExecutionTimeMs(elapsed);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Optimization failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Campus Energy Scheduling & Optimization
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Deterministic 24-Hour Battery Scheduling with LLM Operator Directive Interpretation
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Independent Replay Guardrails</span>
            </div>
            {executionTimeMs !== null && (
              <div className="flex items-center space-x-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-slate-300 font-mono">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>Latency: {executionTimeMs} ms</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start space-x-3 text-rose-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Optimization or Validation Error</h4>
              <p className="mt-1 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <ScenarioEditor
          scenarioId={scenarioId}
          setScenarioId={setScenarioId}
          operatorNotes={operatorNotes}
          setOperatorNotes={setOperatorNotes}
          hours={hours}
          setHours={setHours}
          battery={battery}
          setBattery={setBattery}
          onOptimize={handleOptimize}
          isLoading={isLoading}
        />

        {result && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <MetricsOverview
              response={result}
              initialBatteryEnergy={battery.initial_energy_kwh}
            />

            <DirectivesPanel
              directives={result.directive_interpretation}
              operatorNotes={operatorNotes}
            />

            <HourlyChart
              plan={result.hourly_plan}
              scenarioHours={hours}
              battery={battery}
            />

            <ScheduleTable
              plan={result.hourly_plan}
              scenarioHours={hours}
            />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-500">
        BUP CSE Fest 2026 Hackathon Preliminary Solution &bull; Dept. of CSE, Bangladesh University of Professionals
      </footer>
    </div>
  );
}
