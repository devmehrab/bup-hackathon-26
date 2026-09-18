import React from 'react';
import { Table, CheckCircle2 } from 'lucide-react';
import { HourlyPlanEntry, HourlyScenarioInput } from '../types/energy';

interface ScheduleTableProps {
  plan: HourlyPlanEntry[];
  scenarioHours: HourlyScenarioInput[];
}

export function ScheduleTable({ plan, scenarioHours }: ScheduleTableProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Table className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Full 24-Hour Dispatch & State Audit Table</h3>
        </div>
        <div className="flex items-center text-xs text-emerald-400">
          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
          Replay Verified
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 uppercase tracking-wider text-slate-400 font-semibold">
            <tr>
              <th className="px-3 py-2.5 rounded-l-lg">Hour</th>
              <th className="px-3 py-2.5 text-right">Demand</th>
              <th className="px-3 py-2.5 text-right">Solar (Gen)</th>
              <th className="px-3 py-2.5 text-right">Solar (Used)</th>
              <th className="px-3 py-2.5 text-center">Action</th>
              <th className="px-3 py-2.5 text-right">Battery kWh</th>
              <th className="px-3 py-2.5 text-right">Energy After</th>
              <th className="px-3 py-2.5 text-right">Grid kWh</th>
              <th className="px-3 py-2.5 text-right">Tariff</th>
              <th className="px-3 py-2.5 text-right rounded-r-lg">Cost (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
            {plan.map((row, idx) => {
              const inputHour = scenarioHours[idx];
              const cost = row.grid_kwh * inputHour.tariff_bdt_per_kwh;

              let actionBadgeColor = 'bg-slate-800 text-slate-400';
              if (row.battery_action === 'charge') {
                actionBadgeColor = 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
              } else if (row.battery_action === 'discharge') {
                actionBadgeColor = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
              }

              return (
                <tr
                  key={row.hour}
                  className="transition-colors hover:bg-slate-800/40"
                >
                  <td className="px-3 py-2 font-bold text-white">
                    H{row.hour.toString().padStart(2, '0')}
                  </td>
                  <td className="px-3 py-2 text-right">{inputHour.demand_kwh.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-amber-400/80">{inputHour.solar_kwh.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-amber-300">
                    {row.solar_used_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center font-sans">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${actionBadgeColor}`}
                    >
                      {row.battery_action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">{row.battery_kwh.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right text-blue-300 font-medium">
                    {row.battery_energy_after_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-cyan-300">
                    {row.grid_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400">
                    {inputHour.tariff_bdt_per_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-white">
                    {cost.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
