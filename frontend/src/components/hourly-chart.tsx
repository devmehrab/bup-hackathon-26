'use client';

import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { HourlyPlanEntry, HourlyScenarioInput, BatteryConfig } from '../types/energy';

interface HourlyChartProps {
  plan: HourlyPlanEntry[];
  scenarioHours: HourlyScenarioInput[];
  battery: BatteryConfig;
}

export function HourlyChart({ plan, scenarioHours, battery }: HourlyChartProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const maxEnergy = Math.max(
    ...scenarioHours.map((h) => h.demand_kwh),
    ...scenarioHours.map((h) => h.solar_kwh),
    ...plan.map((p) => p.grid_kwh),
    100
  );

  const chartHeight = 220;
  const chartWidth = 720;
  const barWidth = 16;
  const colSpacing = chartWidth / 24;

  const hoveredPlan = hoveredHour !== null ? plan[hoveredHour] : null;
  const hoveredInput = hoveredHour !== null ? scenarioHours[hoveredHour] : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          <h3 className="font-semibold text-white">24-Hour Energy Dispatch & Storage Profile</h3>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-sm bg-cyan-500" />
            <span className="text-slate-300">Grid Import</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-400" />
            <span className="text-slate-300">Solar Used</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Battery Discharge</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-3 bg-rose-400" />
            <span className="text-slate-300">Demand Curve</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-3 bg-blue-400 border-b border-dashed" />
            <span className="text-slate-300">Battery Energy (SOC)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-2">
        <div className="min-w-[720px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full overflow-visible">
            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#334155" strokeWidth="1" />
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#1e293b" strokeDasharray="3 3" />

            {Array.from({ length: 24 }).map((_, h) => {
              const xCenter = h * colSpacing + colSpacing / 2;
              const p = plan[h];
              const inp = scenarioHours[h];

              const gridHeight = (p.grid_kwh / maxEnergy) * chartHeight;
              const solarHeight = (p.solar_used_kwh / maxEnergy) * chartHeight;
              const dischargeHeight =
                p.battery_action === 'discharge' ? (p.battery_kwh / maxEnergy) * chartHeight : 0;

              const ySolar = chartHeight - solarHeight;
              const yDischarge = ySolar - dischargeHeight;
              const yGrid = yDischarge - gridHeight;

              const isHovered = hoveredHour === h;

              return (
                <g
                  key={h}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredHour(h)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {isHovered && (
                    <rect
                      x={h * colSpacing}
                      y="0"
                      width={colSpacing}
                      height={chartHeight}
                      fill="#334155"
                      opacity="0.25"
                    />
                  )}

                  {solarHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={ySolar}
                      width={barWidth}
                      height={solarHeight}
                      fill="#fbbf24"
                      rx="1"
                    />
                  )}

                  {dischargeHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={yDischarge}
                      width={barWidth}
                      height={dischargeHeight}
                      fill="#10b981"
                      rx="1"
                    />
                  )}

                  {gridHeight > 0 && (
                    <rect
                      x={xCenter - barWidth / 2}
                      y={yGrid}
                      width={barWidth}
                      height={gridHeight}
                      fill="#06b6d4"
                      rx="1"
                    />
                  )}

                  <text
                    x={xCenter}
                    y={chartHeight + 16}
                    textAnchor="middle"
                    fill={isHovered ? '#38bdf8' : '#64748b'}
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {h}
                  </text>
                </g>
              );
            })}

            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              points={scenarioHours
                .map((h, idx) => {
                  const x = idx * colSpacing + colSpacing / 2;
                  const y = chartHeight - (h.demand_kwh / maxEnergy) * chartHeight;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            <polyline
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
              strokeDasharray="4 3"
              points={plan
                .map((p, idx) => {
                  const x = idx * colSpacing + colSpacing / 2;
                  const y = chartHeight - (p.battery_energy_after_kwh / battery.capacity_kwh) * chartHeight;
                  return `${x},${y}`;
                })
                .join(' ')}
            />
          </svg>
        </div>
      </div>

      {hoveredHour !== null && hoveredPlan && hoveredInput && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-950/80 p-3 text-xs border border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono font-bold text-cyan-400">
              Hour {hoveredHour}:00 - {hoveredHour + 1}:00
            </span>
            <span className="text-slate-400">Demand:</span>
            <span className="font-bold text-rose-400">{hoveredInput.demand_kwh} kWh</span>
            <span className="text-slate-400">Tariff:</span>
            <span className="font-bold text-amber-400">{hoveredInput.tariff_bdt_per_kwh} BDT</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-cyan-300">Grid: {hoveredPlan.grid_kwh} kWh</span>
            <span className="text-amber-300">Solar: {hoveredPlan.solar_used_kwh} kWh</span>
            <span className="text-emerald-300">
              Battery: {hoveredPlan.battery_action} ({hoveredPlan.battery_kwh} kWh)
            </span>
            <span className="text-blue-300">
              SOC After: {hoveredPlan.battery_energy_after_kwh} kWh
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
