export type SupportedDirectiveType =
  | 'solar_reduction'
  | 'minimum_battery_reserve'
  | 'no_charge_window'
  | 'no_discharge_window'
  | 'max_grid_window'
  | 'no_op';

export type BatteryAction = 'charge' | 'discharge' | 'idle';

export interface HourlyScenarioInput {
  hour: number;
  demand_kwh: number;
  solar_kwh: number;
  tariff_bdt_per_kwh: number;
}

export interface BatteryConfig {
  capacity_kwh: number;
  initial_energy_kwh: number;
  minimum_energy_kwh: number;
  max_charge_kwh_per_hour: number;
  max_discharge_kwh_per_hour: number;
}

export interface DirectiveInterpretation {
  note_index: number;
  applies: boolean;
  directive_type: SupportedDirectiveType;
  structured_adjustment: unknown;
  explanation: string;
}

export interface HourlyPlanEntry {
  hour: number;
  grid_kwh: number;
  solar_used_kwh: number;
  battery_action: BatteryAction;
  battery_kwh: number;
  battery_energy_after_kwh: number;
}

export interface OptimizationResponse {
  scenario_id: string;
  directive_interpretation: DirectiveInterpretation[];
  hourly_plan: HourlyPlanEntry[];
  total_grid_kwh: number;
  total_cost_bdt: number;
  peak_grid_kwh: number;
  plan_summary: string;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  scenario_id: string;
  operator_notes: string[];
  battery: BatteryConfig;
  generateHours: () => HourlyScenarioInput[];
}
