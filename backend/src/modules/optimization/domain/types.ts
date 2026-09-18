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

export interface SolarReductionAdjustment {
  hours: number[];
  factor: number;
}

export interface MinimumBatteryReserveAdjustment {
  hours: number[];
  minimum_energy_kwh: number;
}

export interface NoChargeWindowAdjustment {
  hours: number[];
}

export interface NoDischargeWindowAdjustment {
  hours: number[];
}

export interface MaxGridWindowAdjustment {
  hours: number[];
  max_grid_kwh: number;
}

export type StructuredAdjustment =
  | SolarReductionAdjustment
  | MinimumBatteryReserveAdjustment
  | NoChargeWindowAdjustment
  | NoDischargeWindowAdjustment
  | MaxGridWindowAdjustment
  | null;

export interface DirectiveInterpretation {
  note_index: number;
  applies: boolean;
  directive_type: SupportedDirectiveType;
  structured_adjustment: StructuredAdjustment;
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

export interface OptimizationMetrics {
  total_grid_kwh: number;
  total_cost_bdt: number;
  peak_grid_kwh: number;
}

export interface OptimizationResult extends OptimizationMetrics {
  hourly_plan: HourlyPlanEntry[];
  plan_summary: string;
}

export interface OptimizationResponse extends OptimizationMetrics {
  scenario_id: string;
  directive_interpretation: DirectiveInterpretation[];
  hourly_plan: HourlyPlanEntry[];
  plan_summary: string;
}

export interface EffectiveHourConstraint {
  hour: number;
  demand_kwh: number;
  original_solar_kwh: number;
  effective_solar_kwh: number;
  tariff_bdt_per_kwh: number;
  min_battery_reserve_kwh: number;
  max_charge_kwh: number;
  max_discharge_kwh: number;
  max_grid_kwh?: number;
}

export interface OptimizationContext {
  scenario_id: string;
  hours: EffectiveHourConstraint[];
  battery: BatteryConfig;
  directives: DirectiveInterpretation[];
}
