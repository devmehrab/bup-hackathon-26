import React from 'react';
import { Bot, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { DirectiveInterpretation, SupportedDirectiveType } from '../types/energy';

interface DirectivesPanelProps {
  directives: DirectiveInterpretation[];
  operatorNotes: string[];
}

export function DirectivesPanel({ directives, operatorNotes }: DirectivesPanelProps) {
  const getBadgeColor = (type: SupportedDirectiveType) => {
    switch (type) {
      case 'solar_reduction':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
      case 'minimum_battery_reserve':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
      case 'no_charge_window':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
      case 'no_discharge_window':
        return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
      case 'max_grid_window':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
      case 'no_op':
        return 'border-slate-600/30 bg-slate-700/20 text-slate-400';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Bot className="h-5 w-5 text-cyan-400" />
        <h3 className="font-semibold text-white">
          LLM Directive Interpretation & Guardrail Audit
        </h3>
      </div>

      <div className="mt-4 space-y-3">
        {directives.map((dir) => {
          const originalNote = operatorNotes[dir.note_index] || 'Operator note';
          const adj = dir.structured_adjustment as Record<string, unknown> | null;

          return (
            <div
              key={dir.note_index}
              className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4 transition-all hover:border-slate-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
                    #{dir.note_index}
                  </span>
                  <span
                    className={`rounded-lg border px-2.5 py-0.5 text-xs font-mono font-semibold ${getBadgeColor(
                      dir.directive_type
                    )}`}
                  >
                    {dir.directive_type}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {dir.applies ? (
                    <span className="flex items-center text-xs font-medium text-emerald-400">
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      applies: true
                    </span>
                  ) : (
                    <span className="flex items-center text-xs font-medium text-slate-400">
                      <XCircle className="mr-1 h-3.5 w-3.5" />
                      applies: false (no_op)
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2.5 rounded-lg bg-slate-900/50 p-2.5 text-xs text-slate-300 font-sans border border-slate-800/60">
                <span className="font-semibold text-slate-400 mr-2">Input Note:</span>
                &ldquo;{originalNote}&rdquo;
              </div>

              {dir.applies && adj && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs bg-slate-900/80 rounded-lg p-2.5 border border-slate-800">
                  <span className="font-semibold text-slate-400">Structured Adjustment:</span>
                  {Array.isArray(adj.hours) && (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-slate-400">Hours:</span>
                      <div className="flex flex-wrap gap-1">
                        {adj.hours.map((h: number) => (
                          <span
                            key={h}
                            className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-cyan-300"
                          >
                            H{h}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {'factor' in adj && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Solar Factor:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {String(adj.factor)}
                      </span>
                    </div>
                  )}

                  {'minimum_energy_kwh' in adj && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Min Reserve:</span>
                      <span className="font-mono font-bold text-blue-400">
                        {String(adj.minimum_energy_kwh)} kWh
                      </span>
                    </div>
                  )}

                  {'max_grid_kwh' in adj && (
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-400">Max Grid:</span>
                      <span className="font-mono font-bold text-purple-400">
                        {String(adj.max_grid_kwh)} kWh
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-2.5 flex items-start space-x-2 text-xs text-slate-400">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-500" />
                <span className="italic">{dir.explanation}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
