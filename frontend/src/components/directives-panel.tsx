import React from 'react';
import { DirectiveInterpretation, SupportedDirectiveType } from '../types/energy';

interface DirectivesPanelProps {
  directives: DirectiveInterpretation[];
  operatorNotes: string[];
}

export function DirectivesPanel({ directives, operatorNotes }: DirectivesPanelProps) {
  const getBadgeColor = (type: SupportedDirectiveType) => {
    switch (type) {
      case 'solar_reduction':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'minimum_battery_reserve':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'no_charge_window':
        return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'no_discharge_window':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'max_grid_window':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'no_op':
        return 'text-zinc-400 bg-zinc-800/40 border-zinc-700/40';
    }
  };

  return (
    <div className="space-y-3">
      {directives.map((dir) => {
        const originalNote = operatorNotes[dir.note_index] || 'Operator note';
        const adj = dir.structured_adjustment as Record<string, unknown> | null;

        return (
          <div
            key={dir.note_index}
            className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[11px] font-mono text-zinc-400">
                  {dir.note_index + 1}
                </span>
                <span
                  className={`rounded-md border px-2 py-0.5 text-xs font-mono font-medium ${getBadgeColor(
                    dir.directive_type
                  )}`}
                >
                  {dir.directive_type}
                </span>
              </div>

              <span
                className={`text-xs font-medium flex items-center ${
                  dir.applies ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${
                    dir.applies ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
                {dir.applies ? 'Applied' : 'No-op (Ignored)'}
              </span>
            </div>

            <p className="text-xs text-zinc-300 font-sans">
              <span className="text-zinc-500 mr-1.5">Note:</span>
              &ldquo;{originalNote}&rdquo;
            </p>

            {dir.applies && adj && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {Array.isArray(adj.hours) && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-500">Hours:</span>
                    <span className="font-mono text-zinc-200">
                      [{adj.hours.map((h: number) => `H${h}`).join(', ')}]
                    </span>
                  </div>
                )}

                {'factor' in adj && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-500">Factor:</span>
                    <span className="font-mono font-medium text-amber-300">{String(adj.factor)}</span>
                  </div>
                )}

                {'minimum_energy_kwh' in adj && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-500">Min Reserve:</span>
                    <span className="font-mono font-medium text-blue-300">{String(adj.minimum_energy_kwh)} kWh</span>
                  </div>
                )}

                {'max_grid_kwh' in adj && (
                  <div className="flex items-center space-x-1">
                    <span className="text-zinc-500">Max Grid:</span>
                    <span className="font-mono font-medium text-purple-300">{String(adj.max_grid_kwh)} kWh</span>
                  </div>
                )}
              </div>
            )}

            <p className="text-[11px] text-zinc-500 italic">
              {dir.explanation}
            </p>
          </div>
        );
      })}
    </div>
  );
}
