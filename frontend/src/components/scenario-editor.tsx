// 'use client';

// import React, { useState } from 'react';
// import {
//   Sliders,
//   Play,
//   Plus,
//   Trash2,
//   ChevronDown,
//   ChevronUp
// } from 'lucide-react';
// import { SCENARIO_PRESETS } from '../lib/presets';
// import { HourlyScenarioInput, BatteryConfig } from '../types/energy';

// interface ScenarioEditorProps {
//   scenarioId: string;
//   setScenarioId: (id: string) => void;
//   operatorNotes: string[];
//   setOperatorNotes: (notes: string[]) => void;
//   hours: HourlyScenarioInput[];
//   setHours: React.Dispatch<React.SetStateAction<HourlyScenarioInput[]>>;
//   battery: BatteryConfig;
//   setBattery: React.Dispatch<React.SetStateAction<BatteryConfig>>;
//   onOptimize: () => void;
//   isLoading: boolean;
// }

// const QUICK_PROMPTS = [
//   { label: 'Solar Curtailment', text: 'Solar output will drop to about 20% from 1 PM to 3 PM.' },
//   { label: 'No Charge Window', text: 'Do not charge the battery between 2 PM and 4 PM.' },
//   { label: 'Battery Reserve', text: 'Keep at least 120 kWh in reserve from 6 PM until 9 PM.' },
//   { label: 'Grid Cap', text: 'Grid import may not exceed 100 kWh between 2 PM and 4 PM.' },
//   { label: 'Irrelevant Note', text: 'The cafeteria menu changes tomorrow.' }
// ];

// export function ScenarioEditor({
//   scenarioId,
//   setScenarioId,
//   operatorNotes,
//   setOperatorNotes,
//   hours,
//   setHours,
//   battery,
//   setBattery,
//   onOptimize,
//   isLoading
// }: ScenarioEditorProps) {
//   const [showAdvancedHours, setShowAdvancedHours] = useState(false);
//   const [activePresetId, setActivePresetId] = useState<string>(SCENARIO_PRESETS[0].id);

//   const applyPreset = (presetId: string) => {
//     const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
//     if (preset) {
//       setActivePresetId(presetId);
//       setScenarioId(preset.scenario_id);
//       setOperatorNotes([...preset.operator_notes]);
//       setBattery({ ...preset.battery });
//       setHours(preset.generateHours());
//     }
//   };

//   const handleNoteChange = (index: number, val: string) => {
//     const updated = [...operatorNotes];
//     updated[index] = val;
//     setOperatorNotes(updated);
//   };

//   const addNote = () => {
//     if (operatorNotes.length < 3) {
//       setOperatorNotes([...operatorNotes, '']);
//     }
//   };

//   const removeNote = (index: number) => {
//     if (operatorNotes.length > 1) {
//       setOperatorNotes(operatorNotes.filter((_, i) => i !== index));
//     }
//   };

//   const addQuickPrompt = (text: string) => {
//     if (operatorNotes.length < 3) {
//       setOperatorNotes([...operatorNotes, text]);
//     } else {
//       // replace the last note if max 3
//       const updated = [...operatorNotes];
//       updated[updated.length - 1] = text;
//       setOperatorNotes(updated);
//     }
//   };

//   const updateHourField = (hIndex: number, field: keyof HourlyScenarioInput, val: number) => {
//     setHours((prev) => {
//       const copy = [...prev];
//       copy[hIndex] = { ...copy[hIndex], [field]: val };
//       return copy;
//     });
//   };

//   return (
//     <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm space-y-5">
//       {/* Benchmark Presets Bar */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
//         <div>
//           <h2 className="text-sm font-semibold text-white">Scenario Configuration</h2>
//           <p className="text-xs text-zinc-400 mt-0.5">Select a challenge benchmark or craft custom directives</p>
//         </div>

//         <div className="flex items-center gap-1.5 flex-wrap">
//           {SCENARIO_PRESETS.map((p) => {
//             const isActive = activePresetId === p.id && scenarioId === p.scenario_id;
//             return (
//               <button
//                 key={p.id}
//                 onClick={() => applyPreset(p.id)}
//                 className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
//                   isActive
//                     ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
//                     : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
//                 }`}
//               >
//                 {p.scenario_id}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Operator Notes Section */}
//       <div className="space-y-3">
//         <div className="flex items-center justify-between">
//           <label className="text-xs font-medium text-zinc-300">
//             Operator Notes <span className="text-zinc-500 font-normal font-mono">({operatorNotes.length}/3)</span>
//           </label>
//           {operatorNotes.length < 3 && (
//             <button
//               onClick={addNote}
//               className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
//             >
//               <Plus className="h-3.5 w-3.5" />
//               <span>Add directive</span>
//             </button>
//           )}
//         </div>

//         <div className="space-y-2">
//           {operatorNotes.map((note, idx) => (
//             <div key={idx} className="flex items-center space-x-2">
//               <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
//                 {idx + 1}
//               </span>
//               <input
//                 type="text"
//                 value={note}
//                 onChange={(e) => handleNoteChange(idx, e.target.value)}
//                 placeholder="Type natural-language operator note (e.g. Solar will drop to 20% between 1 PM and 3 PM)..."
//                 className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all"
//               />
//               {operatorNotes.length > 1 && (
//                 <button
//                   onClick={() => removeNote(idx)}
//                   className="p-2 text-zinc-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-zinc-800/40"
//                   title="Remove note"
//                 >
//                   <Trash2 className="h-4 w-4" />
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Quick prompt suggestions */}
//         <div className="flex items-center gap-1.5 flex-wrap pt-1">
//           <span className="text-[11px] text-zinc-500 mr-1">Quick insert:</span>
//           {QUICK_PROMPTS.map((qp, i) => (
//             <button
//               key={i}
//               onClick={() => addQuickPrompt(qp.text)}
//               className="rounded-md border border-zinc-800/80 bg-zinc-900/50 px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
//             >
//               + {qp.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Battery & Scenario Parameters */}
//       <div className="pt-2 border-t border-zinc-800/60">
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
//           <div>
//             <label className="block text-[11px] text-zinc-400">Scenario ID</label>
//             <input
//               type="text"
//               value={scenarioId}
//               onChange={(e) => setScenarioId(e.target.value)}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//           <div>
//             <label className="block text-[11px] text-zinc-400">Capacity (kWh)</label>
//             <input
//               type="number"
//               value={battery.capacity_kwh}
//               onChange={(e) => setBattery({ ...battery, capacity_kwh: parseFloat(e.target.value) || 0 })}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//           <div>
//             <label className="block text-[11px] text-zinc-400">Initial Energy</label>
//             <input
//               type="number"
//               value={battery.initial_energy_kwh}
//               onChange={(e) => setBattery({ ...battery, initial_energy_kwh: parseFloat(e.target.value) || 0 })}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//           <div>
//             <label className="block text-[11px] text-zinc-400">Min Reserve</label>
//             <input
//               type="number"
//               value={battery.minimum_energy_kwh}
//               onChange={(e) => setBattery({ ...battery, minimum_energy_kwh: parseFloat(e.target.value) || 0 })}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//           <div>
//             <label className="block text-[11px] text-zinc-400">Max Charge/h</label>
//             <input
//               type="number"
//               value={battery.max_charge_kwh_per_hour}
//               onChange={(e) => setBattery({ ...battery, max_charge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//           <div>
//             <label className="block text-[11px] text-zinc-400">Max Discharge/h</label>
//             <input
//               type="number"
//               value={battery.max_discharge_kwh_per_hour}
//               onChange={(e) => setBattery({ ...battery, max_discharge_kwh_per_hour: parseFloat(e.target.value) || 0 })}
//               className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-xs text-white font-mono focus:border-zinc-600 focus:outline-none"
//             />
//           </div>
//         </div>
//       </div>

//       {/* Collapsible 24-Hour Profile */}
//       <div className="pt-2 border-t border-zinc-800/60">
//         <button
//           type="button"
//           onClick={() => setShowAdvancedHours(!showAdvancedHours)}
//           className="flex items-center justify-between w-full py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
//         >
//           <span className="flex items-center space-x-2">
//             <Sliders className="h-3.5 w-3.5 text-zinc-500" />
//             <span>Customize 24-Hour Profile ({hours.length} hours)</span>
//           </span>
//           {showAdvancedHours ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
//         </button>

//         {showAdvancedHours && (
//           <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2">
//             <table className="w-full text-xs font-mono">
//               <thead className="text-zinc-500 border-b border-zinc-900 pb-1">
//                 <tr>
//                   <th className="p-1.5 text-left font-normal">Hour</th>
//                   <th className="p-1.5 text-right font-normal">Demand (kWh)</th>
//                   <th className="p-1.5 text-right font-normal">Solar (kWh)</th>
//                   <th className="p-1.5 text-right font-normal">Tariff (BDT)</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-zinc-900 text-zinc-300">
//                 {hours.map((h, i) => (
//                   <tr key={h.hour}>
//                     <td className="p-1 text-zinc-400">H{h.hour.toString().padStart(2, '0')}</td>
//                     <td className="p-1 text-right">
//                       <input
//                         type="number"
//                         value={h.demand_kwh}
//                         onChange={(e) => updateHourField(i, 'demand_kwh', parseFloat(e.target.value) || 0)}
//                         className="w-16 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-right text-xs text-white"
//                       />
//                     </td>
//                     <td className="p-1 text-right">
//                       <input
//                         type="number"
//                         value={h.solar_kwh}
//                         onChange={(e) => updateHourField(i, 'solar_kwh', parseFloat(e.target.value) || 0)}
//                         className="w-16 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-right text-xs text-amber-400"
//                       />
//                     </td>
//                     <td className="p-1 text-right">
//                       <input
//                         type="number"
//                         step="0.5"
//                         value={h.tariff_bdt_per_kwh}
//                         onChange={(e) => updateHourField(i, 'tariff_bdt_per_kwh', parseFloat(e.target.value) || 0)}
//                         className="w-16 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-right text-xs text-emerald-400"
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Main Action Button */}
//       <div className="pt-2">
//         <button
//           onClick={onOptimize}
//           disabled={isLoading || operatorNotes.some((n) => !n.trim())}
//           className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
//         >
//           {isLoading ? (
//             <>
//               <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
//               <span>Optimizing 24-Hour Dispatch...</span>
//             </>
//           ) : (
//             <>
//               <Play className="h-4 w-4 fill-zinc-950" />
//               <span></span>
//             </>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }



'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  Edit2,
  Lock
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

const QUICK_PROMPTS = [
  { label: 'Solar Curtailment', text: 'Solar output will drop to about 20% from 1 PM to 3 PM.' },
  { label: 'No Charge Window', text: 'Do not charge the battery between 2 PM and 4 PM.' },
  { label: 'Battery Reserve', text: 'Keep at least 120 kWh in reserve from 6 PM until 9 PM.' },
  { label: 'Grid Cap', text: 'Grid import may not exceed 100 kWh between 2 PM and 4 PM.' },
  { label: 'Irrelevant Note', text: 'The cafeteria menu changes tomorrow.' }
];

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
  const [showAdvancedHours, setShowAdvancedHours] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>(SCENARIO_PRESETS[0].id);

  // Store user modifications per scenario ID to preserve changes when switching back and forth
  const [scenarioCache, setScenarioCache] = useState<
    Record<
      string,
      {
        scenarioId: string;
        operatorNotes: string[];
        battery: BatteryConfig;
        hours: HourlyScenarioInput[];
      }
    >
  >(() => {
    return SCENARIO_PRESETS.reduce((acc, p) => {
      acc[p.id] = {
        scenarioId: p.scenario_id,
        operatorNotes: [...p.operator_notes],
        battery: { ...p.battery },
        hours: p.generateHours()
      };
      return acc;
    }, {} as Record<string, any>);
  });

  // Track lock state for configuration fields
  const [lockedFields, setLockedFields] = useState<Record<string, boolean>>({});

  const toggleLock = (fieldKey: string) => {
    setLockedFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const applyPreset = (presetId: string) => {
    // Save current active preset data before switching
    const currentData = { scenarioId, operatorNotes, battery, hours };
    setScenarioCache((prev) => ({ ...prev, [activePresetId]: currentData }));

    // Load selected preset data from cache
    const targetData = scenarioCache[presetId] || {
      scenarioId: SCENARIO_PRESETS.find((p) => p.id === presetId)?.scenario_id || '',
      operatorNotes: SCENARIO_PRESETS.find((p) => p.id === presetId)?.operator_notes || [],
      battery: SCENARIO_PRESETS.find((p) => p.id === presetId)?.battery || battery,
      hours: SCENARIO_PRESETS.find((p) => p.id === presetId)?.generateHours() || hours
    };

    setActivePresetId(presetId);
    setScenarioId(targetData.scenarioId);
    setOperatorNotes([...targetData.operatorNotes]);
    setBattery({ ...targetData.battery });
    setHours([...targetData.hours]);
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

  const addQuickPrompt = (text: string) => {
    if (operatorNotes.length < 3) {
      setOperatorNotes([...operatorNotes, text]);
    } else {
      const updated = [...operatorNotes];
      updated[updated.length - 1] = text;
      setOperatorNotes(updated);
    }
  };

  const updateHourField = (hIndex: number, field: keyof HourlyScenarioInput, val: number) => {
    setHours((prev) => {
      const copy = [...prev];
      copy[hIndex] = { ...copy[hIndex], [field]: val };
      return copy;
    });
  };

  const renderConfigField = (
    label: string,
    fieldKey: string,
    value: string | number,
    onChange: (val: string) => void,
    type: 'text' | 'number' = 'number'
  ) => {
    const isLocked = !!lockedFields[fieldKey];

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-zinc-400">{label}</label>
          <button
            type="button"
            onClick={() => toggleLock(fieldKey)}
            className={`p-1 rounded transition-colors ${
              isLocked
                ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10'
                : 'text-zinc-500 hover:text-zinc-300 bg-zinc-800/50'
            }`}
            title={isLocked ? 'Click to edit' : 'Lock field value'}
          >
            {isLocked ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
          </button>
        </div>
        <div className="relative flex items-center">
          <input
            type={type}
            disabled={isLocked}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-xl border px-3 py-1.5 text-xs font-mono transition-all ${
              isLocked
                ? 'border-zinc-800/50 bg-zinc-900/50 text-zinc-400 cursor-not-allowed select-none opacity-80'
                : 'border-zinc-800 bg-zinc-950 text-white focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50'
            }`}
          />
          {isLocked && <Lock className="absolute right-2.5 h-3 w-3 text-zinc-500/70" />}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-md space-y-6 shadow-xl">
      {/* Benchmark Presets Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Scenario Configuration
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select a challenge benchmark or craft custom directives
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {SCENARIO_PRESETS.map((p) => {
            const isActive = activePresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/10'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {p.scenario_id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operator Notes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300">
            Operator Directives{' '}
            <span className="text-zinc-500 font-normal font-mono">
              ({operatorNotes.length}/3)
            </span>
          </label>
          {operatorNotes.length < 3 && (
            <button
              onClick={addNote}
              className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Directive</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {operatorNotes.map((note, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-medium text-emerald-400">
                {idx + 1}
              </span>
              <input
                type="text"
                value={note}
                onChange={(e) => handleNoteChange(idx, e.target.value)}
                placeholder="Type natural-language operator note..."
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
              />
              {operatorNotes.length > 1 && (
                <button
                  onClick={() => removeNote(idx)}
                  className="p-2 text-zinc-500 hover:text-rose-400 transition-colors rounded-xl hover:bg-zinc-800/50"
                  title="Remove directive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Quick Prompts */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] text-zinc-500 mr-1">Quick insert:</span>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              onClick={() => addQuickPrompt(qp.text)}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-zinc-800/50 transition-all"
            >
              + {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Battery & System Configuration Parameters */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-6">
          {renderConfigField('Scenario ID', 'scenarioId', scenarioId, setScenarioId, 'text')}
          {renderConfigField(
            'Capacity (kWh)',
            'capacity',
            battery.capacity_kwh,
            (val) => setBattery({ ...battery, capacity_kwh: parseFloat(val) || 0 })
          )}
          {renderConfigField(
            'Initial Energy',
            'initial',
            battery.initial_energy_kwh,
            (val) => setBattery({ ...battery, initial_energy_kwh: parseFloat(val) || 0 })
          )}
          {renderConfigField(
            'Min Reserve',
            'min',
            battery.minimum_energy_kwh,
            (val) => setBattery({ ...battery, minimum_energy_kwh: parseFloat(val) || 0 })
          )}
          {renderConfigField(
            'Max Charge/h',
            'charge',
            battery.max_charge_kwh_per_hour,
            (val) => setBattery({ ...battery, max_charge_kwh_per_hour: parseFloat(val) || 0 })
          )}
          {renderConfigField(
            'Max Discharge/h',
            'discharge',
            battery.max_discharge_kwh_per_hour,
            (val) => setBattery({ ...battery, max_discharge_kwh_per_hour: parseFloat(val) || 0 })
          )}
        </div>
      </div>

      {/* Collapsible 24-Hour Profile Table */}
      <div className="pt-2 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => setShowAdvancedHours(!showAdvancedHours)}
          className="flex items-center justify-between w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-medium"
        >
          <span className="flex items-center space-x-2">
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            <span>Customize Hourly Profile ({hours.length} hours)</span>
          </span>
          {showAdvancedHours ? (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </button>

        {showAdvancedHours && (
          <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950 p-2 shadow-inner">
            <table className="w-full text-xs font-mono">
              <thead className="text-zinc-500 border-b border-zinc-900 pb-1">
                <tr>
                  <th className="p-1.5 text-left font-normal">Hour</th>
                  <th className="p-1.5 text-right font-normal">Demand (kWh)</th>
                  <th className="p-1.5 text-right font-normal">Solar (kWh)</th>
                  <th className="p-1.5 text-right font-normal">Tariff (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-zinc-300">
                {hours.map((h, i) => (
                  <tr key={h.hour} className="hover:bg-zinc-900/30">
                    <td className="p-1 text-zinc-400">
                      H{h.hour.toString().padStart(2, '0')}
                    </td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        value={h.demand_kwh}
                        onChange={(e) =>
                          updateHourField(i, 'demand_kwh', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-right text-xs text-white focus:border-emerald-500/50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        value={h.solar_kwh}
                        onChange={(e) =>
                          updateHourField(i, 'solar_kwh', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-right text-xs text-amber-400 focus:border-emerald-500/50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 text-right">
                      <input
                        type="number"
                        step="0.5"
                        value={h.tariff_bdt_per_kwh}
                        onChange={(e) =>
                          updateHourField(i, 'tariff_bdt_per_kwh', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2 py-1 text-right text-xs text-emerald-400 focus:border-emerald-500/50 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Main Action Button */}
      <div className="pt-2">
        <button
          onClick={onOptimize}
          disabled={isLoading || operatorNotes.some((n) => !n.trim())}
          className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              <span>Optimizing 24-Hour Dispatch...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-zinc-950" />
              <span>Optimize Schedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}