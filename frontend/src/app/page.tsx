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
import { AlertCircle, Clock } from 'lucide-react';

type ResultTab = 'chart' | 'directives' | 'table';

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
  const [activeTab, setActiveTab] = useState<ResultTab>('chart');

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
    <div className="min-h-screen bg-zinc-950 flex flex-col selection:bg-zinc-800 selection:text-white text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:px-6 space-y-6">
        {/* Simple Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Campus Energy Optimizer
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">
              Deterministic 24-hour battery scheduling with LLM operator directive interpretation
            </p>
          </div>

          {executionTimeMs !== null && (
            <div className="flex items-center space-x-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 font-mono">
              <Clock className="h-3 w-3 text-emerald-400" />
              <span>{executionTimeMs} ms</span>
            </div>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-start space-x-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Scenario Input Configuration */}
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

        {/* Results Section */}
        {result && (
          <div className="space-y-5 pt-2">
            {/* KPI Metrics */}
            <MetricsOverview
              response={result}
              initialBatteryEnergy={battery.initial_energy_kwh}
            />

            {/* Clean Segmented Tab Switcher */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center space-x-1 bg-zinc-900/80 border border-zinc-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeTab === 'chart'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  Dispatch Chart
                </button>
                <button
                  onClick={() => setActiveTab('directives')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeTab === 'directives'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  Directives ({result.directive_interpretation.length})
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${activeTab === 'table'
                      ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  Hourly Schedule
                </button>
              </div>

              <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline-block">
                Scenario: {result.scenario_id}
              </span>
            </div>

            {/* Tab Panels */}
            {activeTab === 'chart' && (
              <HourlyChart
                plan={result.hourly_plan}
                scenarioHours={hours}
                battery={battery}
              />
            )}

            {activeTab === 'directives' && (
              <DirectivesPanel
                directives={result.directive_interpretation}
                operatorNotes={operatorNotes}
              />
            )}

            {activeTab === 'table' && (
              <ScheduleTable
                plan={result.hourly_plan}
                scenarioHours={hours}
              />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800/80 py-4 text-center text-xs text-zinc-600">
        TEAM F1N4LB0SS &bull; BUP HACKATHON 2026
      </footer>
    </div>
  );
}
