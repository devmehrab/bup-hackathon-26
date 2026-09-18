import React from 'react';
import { HourlyPlanEntry, HourlyScenarioInput } from '../types/energy';

interface ScheduleTableProps {
  plan: HourlyPlanEntry[];
  scenarioHours: HourlyScenarioInput[];
}

export function ScheduleTable({ plan, scenarioHours }: ScheduleTableProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
        <span className="text-xs font-medium text-white">24-Hour Dispatch Schedule</span>
        <span className="text-[11px] text-zinc-500 font-mono">24 intervals audited</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-zinc-950/60 text-zinc-400 text-[11px] border-b border-zinc-800/80">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Hour</th>
              <th className="px-3 py-2 text-right font-medium">Demand</th>
              <th className="px-3 py-2 text-right font-medium">Solar Gen</th>
              <th className="px-3 py-2 text-right font-medium">Solar Used</th>
              <th className="px-3 py-2 text-center font-medium font-sans">Action</th>
              <th className="px-3 py-2 text-right font-medium">Battery kWh</th>
              <th className="px-3 py-2 text-right font-medium">Energy After</th>
              <th className="px-3 py-2 text-right font-medium">Grid kWh</th>
              <th className="px-3 py-2 text-right font-medium">Tariff</th>
              <th className="px-3 py-2 text-right font-medium">Cost (BDT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-300">
            {plan.map((row, idx) => {
              const inputHour = scenarioHours[idx];
              const cost = row.grid_kwh * inputHour.tariff_bdt_per_kwh;

              let actionBadgeColor = 'text-zinc-400 bg-zinc-800/60 border-zinc-700/60';
              if (row.battery_action === 'charge') {
                actionBadgeColor = 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20';
              } else if (row.battery_action === 'discharge') {
                actionBadgeColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
              }

              return (
                <tr
                  key={row.hour}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-3 py-1.5 text-zinc-400">
                    H{row.hour.toString().padStart(2, '0')}
                  </td>
                  <td className="px-3 py-1.5 text-right">{inputHour.demand_kwh.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right text-zinc-500">{inputHour.solar_kwh.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right text-amber-400 font-medium">
                    {row.solar_used_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 text-center font-sans">
                    <span
                      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${actionBadgeColor}`}
                    >
                      {row.battery_action}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">{row.battery_kwh.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-right text-blue-400">
                    {row.battery_energy_after_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-cyan-300">
                    {row.grid_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 text-right text-zinc-500">
                    {inputHour.tariff_bdt_per_kwh.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-zinc-100">
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
