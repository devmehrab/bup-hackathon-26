'use client';

import React, { useState } from 'react';
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

  const chartHeight = 200;
  const chartWidth = 720;
  const barWidth = 14;
  const colSpacing = chartWidth / 24;

  const hoveredPlan = hoveredHour !== null ? plan[hoveredHour] : null;
  const hoveredInput = hoveredHour !== null ? scenarioHours[hoveredHour] : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <span className="text-xs font-medium text-white">24-Hour Dispatch Profile</span>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500" />
            <span>Grid</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span>Solar</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span>Battery Discharge</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-3 bg-rose-400" />
            <span>Demand</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-0.5 w-3 bg-blue-400 border-b border-dashed" />
            <span>Battery Energy</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 32}`} className="w-full overflow-visible">
            {/* Grid line */}
            <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#27272a" strokeWidth="1" />
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#18181b" strokeDasharray="3 3" />

            {Array.from({ length: 24 }).map((_, h) => {
              const xCenter = h * colSpacing + colSpacing / 2;
              const p = plan[h];

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
                      fill="#27272a"
                      opacity="0.5"
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
                    y={chartHeight + 14}
                    textAnchor="middle"
                    fill={isHovered ? '#ffffff' : '#71717a'}
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {h}
                  </text>
                </g>
              );
            })}

            {/* Demand line */}
            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.5"
              points={scenarioHours
                .map((h, idx) => {
                  const x = idx * colSpacing + colSpacing / 2;
                  const y = chartHeight - (h.demand_kwh / maxEnergy) * chartHeight;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Battery state line */}
            <polyline
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.5"
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

      {/* Hover Info Tooltip */}
      {hoveredHour !== null && hoveredPlan && hoveredInput && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-950 px-3 py-2 text-xs border border-zinc-800 font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-zinc-200 font-semibold">
              H{hoveredHour.toString().padStart(2, '0')}:00
            </span>
            <span className="text-zinc-500">|</span>
            <span className="text-zinc-400">Demand: <span className="text-rose-400">{hoveredInput.demand_kwh} kWh</span></span>
            <span className="text-zinc-400">Tariff: <span className="text-amber-400">{hoveredInput.tariff_bdt_per_kwh} BDT</span></span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-zinc-300">
            <span>Grid: <span className="text-cyan-400">{hoveredPlan.grid_kwh.toFixed(1)}</span></span>
            <span>Solar: <span className="text-amber-400">{hoveredPlan.solar_used_kwh.toFixed(1)}</span></span>
            <span>Battery: <span className="text-emerald-400">{hoveredPlan.battery_action} ({hoveredPlan.battery_kwh.toFixed(1)})</span></span>
            <span>Energy After: <span className="text-blue-400">{hoveredPlan.battery_energy_after_kwh.toFixed(1)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
