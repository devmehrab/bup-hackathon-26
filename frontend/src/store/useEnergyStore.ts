import { create } from 'zustand';
import { SCENARIO_PRESETS } from '../lib/presets';
import { HourlyScenarioInput, BatteryConfig } from '../types/energy';

interface ScenarioStateData {
  scenarioId: string;
  operatorNotes: string[];
  battery: BatteryConfig;
  hours: HourlyScenarioInput[];
  lockedFields: Record<string, boolean>;
}

interface EnergyStore {
  activePresetId: string;
  scenarioDataMap: Record<string, ScenarioStateData>;
  setActivePresetId: (presetId: string) => void;
  updateScenarioData: (presetId: string, partial: Partial<ScenarioStateData>) => void;
}

export const useEnergyStore = create<EnergyStore>((set) => ({
  activePresetId: SCENARIO_PRESETS[0].id,
  scenarioDataMap: SCENARIO_PRESETS.reduce((acc, preset) => {
    acc[preset.id] = {
      scenarioId: preset.scenario_id,
      operatorNotes: [...preset.operator_notes],
      battery: { ...preset.battery },
      hours: preset.generateHours(),
      lockedFields: {}
    };
    return acc;
  }, {} as Record<string, ScenarioStateData>),

  setActivePresetId: (presetId) => set({ activePresetId: presetId }),
  
  updateScenarioData: (presetId, partial) =>
    set((state) => ({
      scenarioDataMap: {
        ...state.scenarioDataMap,
        [presetId]: {
          ...state.scenarioDataMap[presetId],
          ...partial
        }
      }
    }))
}));