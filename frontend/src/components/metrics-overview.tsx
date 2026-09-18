import React from 'react';
import { OptimizationResponse } from '../types/energy';

interface MetricsOverviewProps {
  response: OptimizationResponse;
  initialBatteryEnergy: number;
}

export function MetricsOverview({ response, initialBatteryEnergy }: MetricsOverviewProps) {
  const finalBatteryEnergy = response.hourly_plan[23]?.battery_energy_after_kwh ?? initialBatteryEnergy;
  const isNeutral = Math.abs(finalBatteryEnergy - initialBatteryEnergy) <= 0.05;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Cost */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-xs text-zinc-400 font-medium">Total Cost</span>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {response.total_cost_bdt.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-xs text-zinc-400">BDT</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">24-hour utility billing</p>
        </div>

        {/* Grid Import */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-xs text-zinc-400 font-medium">Grid Import</span>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {response.total_grid_kwh.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-xs text-zinc-400">kWh</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Total imported energy</p>
        </div>

        {/* Peak Demand */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-xs text-zinc-400 font-medium">Peak Demand</span>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {response.peak_grid_kwh.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-xs text-zinc-400">kWh</span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">Substation hourly peak</p>
        </div>

        {/* End-of-Day Neutrality */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <span className="text-xs text-zinc-400 font-medium">Battery Neutrality</span>
          <div className="mt-1.5 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {finalBatteryEnergy.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-500">/ {initialBatteryEnergy.toFixed(1)} kWh</span>
          </div>
          <p className={`mt-1 text-[11px] flex items-center ${isNeutral ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${isNeutral ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {isNeutral ? 'Strictly neutral' : 'Discrepancy'}
          </p>
        </div>
      </div>

      {/* Plan Summary */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-300 leading-relaxed">
        <span className="font-semibold text-zinc-200 mr-2">Plan Summary:</span>
        {response.plan_summary}
      </div>
    </div>
  );
}
