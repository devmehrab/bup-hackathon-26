import React from 'react';
import { Coins, Zap, Activity, BatteryCharging, CheckCircle2 } from 'lucide-react';
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Grid Cost
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {response.total_cost_bdt.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-sm font-semibold text-amber-400">BDT</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Minimized cost over 24-hour tariff profile
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Grid Import
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {response.total_grid_kwh.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-sm font-semibold text-cyan-400">kWh</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Total electricity purchased from the utility
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Peak Grid Load
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              {response.peak_grid_kwh.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
            <span className="text-sm font-semibold text-purple-400">kWh</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Maximum single-hour substation demand
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              End-of-Day Neutrality
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <BatteryCharging className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-white">
              {finalBatteryEnergy.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">/ {initialBatteryEnergy.toFixed(1)} kWh</span>
          </div>
          <div className="mt-1.5 flex items-center text-xs font-medium text-emerald-400">
            {isNeutral ? (
              <>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Neutrality Strictly Preserved
              </>
            ) : (
              <span className="text-rose-400">Discrepancy detected</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-4 border-l-4 border-l-emerald-500">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Executive Plan Summary
        </h4>
        <p className="mt-1.5 text-sm text-slate-200 leading-relaxed">
          {response.plan_summary}
        </p>
      </div>
    </div>
  );
}
