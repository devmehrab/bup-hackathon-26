'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Battery,
  FileText,
  Play,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SCENARIO_PRESETS } from '../lib/presets';
import { HourlyScenarioInput, BatteryConfig } from '../types/energy';

interface ScenarioEditorProps {
  scenarioId: string;
  setScenarioId: (id: string) => void;
  operatorNotes: string[];
  setOperatorNotes: (notes: string[]) => void;
  hours: HourlyScenarioInput[];
  setHours: React.Dispatch<React.SetStateAction<HourlyScenarioInput[]>>;
  battery: BatteryConfig;
  setBattery: React.Dispatch<React.SetStateAction<BatteryConfig>>;
  onOptimize: () => void;
  isLoading: boolean;
}

export function ScenarioEditor({
  scenarioId,
  setScenarioId,
  operatorNotes,
  setOperatorNotes,
  hours,
  setHours,
  battery,
  setBattery,
  onOptimize,
  isLoading
}: ScenarioEditorProps) {
  const [showHoursTable, setShowHoursTable] = useState(false);

  const applyPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setScenarioId(preset.scenario_id);
      setOperatorNotes([...preset.operator_notes]);
      setBattery({ ...preset.battery });
      setHours(preset.generateHours());
    }
  };

  const handleNoteChange = (index: number, val: string) => {
    const updated = [...operatorNotes];
    updated[index] = val;
    setOperatorNotes(updated);
  };

  const addNote = () => {
    if (operatorNotes.length < 3) {
      setOperatorNotes([...operatorNotes, '']);
    }
  };

  const removeNote = (index: number) => {
    if (operatorNotes.length > 1) {
      setOperatorNotes(operatorNotes.filter((_, i) => i !== index));
    }
  };

  const updateHourField = (hIndex: number, field: keyof HourlyScenarioInput, val: number) => {
    setHours((prev) => {
      const copy = [...prev];
      copy[hIndex] = { ...copy[hIndex], [field]: val };
      return copy;
    });
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Scenario Configuration</h2>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Load Benchmark Preset:</span>
          <div className="flex space-x-1.5">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200 transition-all hover:border-emerald-500 hover:text-emerald-400"
              >
                {preset.scenario_id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300">Scenario ID</label>
          <input
            type="text"
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300">Quick Prompt Chips</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                if (operatorNotes.length < 3) {
                  setOperatorNotes([...operatorNotes, 'Solar output will drop to about 20% from 1 PM to 3 PM.']);
                }
              }}
              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-300 hover:bg-amber-500/20"
            >
              + Solar -80% (1-3 PM)
            </button>
            <button
              onClick={() => {
                if (operatorNotes.length < 3) {
                  setOperatorNotes([...operatorNotes, 'Do not charge the battery between 2 PM and 4 PM.']);
                }
              }}
              className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 hover:bg-rose-500/20"
            >
              + No Charge (2-4 PM)
            </button>
            <button
              onClick={() => {
                if (operatorNotes.length < 3) {
                  setOperatorNotes([...operatorNotes, 'Keep at least 120 kWh in reserve from 6 PM until 9 PM.']);
                }
              }}
              className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300 hover:bg-blue-500/20"
            >
              + Reserve 120 kWh (6-9 PM)
            </button>
            <button
              onClick={() => {
                if (operatorNotes.length < 3) {
                  setOperatorNotes([...operatorNotes, 'Grid import may not exceed 100 kWh between 2 PM and 4 PM.']);
                }
              }}
              className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] text-purple-300 hover:bg-purple-500/20"
            >
              + Max Grid 100 kWh
            </button>
            <button
              onClick={() => {
                if (operatorNotes.length < 3) {
                  setOperatorNotes([...operatorNotes, 'The cafeteria menu changes tomorrow.']);
                }
              }}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
            >
              + Cafeteria No-op
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2.5">
          <Battery className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Battery Storage Parameters</h3>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className="block text-[11px] text-slate-400">Capacity (kWh)</label>
            <input
              type="number"
              value={battery.capacity_kwh}
              onChange={(e) => setBattery({ ...battery, capacity_kwh: parseFloat(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400">Initial Energy (kWh)</label>
            <input
              type="number"
              value={battery.initial_energy_kwh}
              onChange={(e) => setBattery({ ...battery, initial_energy_kwh: parseFloat(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400">Base Reserve (kWh)</label>
            <input
              type="number"
              value={battery.minimum_energy_kwh}
              onChange={(e) => setBattery({ ...battery, minimum_energy_kwh: parseFloat(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400">Max Charge (kWh/h)</label>
            <input
              type="number"
              value={battery.max_charge_kwh_per_hour}
              onChange={(e) => setBattery({ ...battery, max_charge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400">Max Discharge (kWh/h)</label>
            <input
              type="number"
              value={battery.max_discharge_kwh_per_hour}
              onChange={(e) => setBattery({ ...battery, max_discharge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white font-mono"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Natural Language Operator Notes (1 to 3)</h3>
          </div>
          {operatorNotes.length < 3 && (
            <button
              onClick={addNote}
              className="flex items-center space-x-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
            >
              <Plus className="h-3 w-3" />
              <span>Add Note</span>
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2.5">
          {operatorNotes.map((note, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300 font-mono">
                #{idx}
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => handleNoteChange(idx, e.target.value)}
                placeholder={`Operator directive note ${idx + 1}...`}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              {operatorNotes.length > 1 && (
                <button
                  onClick={() => removeNote(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowHoursTable(!showHoursTable)}
          className="flex items-center justify-between w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-900/60"
        >
          <span className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>24-Hour Input Data Profile ({hours.length} Hours Defined)</span>
          </span>
          {showHoursTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showHoursTable && (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
            <table className="w-full text-xs font-mono">
              <thead className="text-slate-400">
                <tr>
                  <th className="p-1.5 text-left">Hour</th>
                  <th className="p-1.5 text-right">Demand (kWh)</th>
                  <th className="p-1.5 text-right">Solar (kWh)</th>
                  <th className="p-1.5 text-right">Tariff (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-200">
                {hours.map((h, i) => (
                  <tr key={h.hour}>
                    <td className="p-1.5 text-white font-bold">H{h.hour}</td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        value={h.demand_kwh}
                        onChange={(e) => updateHourField(i, 'demand_kwh', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded bg-slate-900 px-1.5 py-0.5 text-right text-xs text-white"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        value={h.solar_kwh}
                        onChange={(e) => updateHourField(i, 'solar_kwh', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded bg-slate-900 px-1.5 py-0.5 text-right text-xs text-amber-400"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={h.tariff_bdt_per_kwh}
                        onChange={(e) => updateHourField(i, 'tariff_bdt_per_kwh', parseFloat(e.target.value) || 0)}
                        className="w-20 rounded bg-slate-900 px-1.5 py-0.5 text-right text-xs text-emerald-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-2">
        <button
          onClick={onOptimize}
          disabled={isLoading || operatorNotes.some((n) => !n.trim())}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:opacity-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              <span>Interpreting Directives & Optimizing 24-Hour Dispatch...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-slate-950" />
              <span>Interpret Directives & Run Energy Optimizer</span>
              <Sparkles className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
