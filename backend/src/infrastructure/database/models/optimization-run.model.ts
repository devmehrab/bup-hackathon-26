import mongoose, { Schema, Document } from 'mongoose';

export interface IOptimizationRun extends Document {
  scenario_id: string;
  operator_notes: string[];
  battery_config: {
    capacity_kwh: number;
    initial_energy_kwh: number;
    minimum_energy_kwh: number;
    max_charge_kwh_per_hour: number;
    max_discharge_kwh_per_hour: number;
  };
  directive_interpretation: unknown[];
  hourly_plan: unknown[];
  total_grid_kwh: number;
  total_cost_bdt: number;
  peak_grid_kwh: number;
  plan_summary: string;
  execution_duration_ms: number;
  created_at: Date;
}

const OptimizationRunSchema: Schema = new Schema(
  {
    scenario_id: { type: String, required: true, index: true },
    operator_notes: { type: [String], required: true },
    battery_config: {
      capacity_kwh: { type: Number, required: true },
      initial_energy_kwh: { type: Number, required: true },
      minimum_energy_kwh: { type: Number, required: true },
      max_charge_kwh_per_hour: { type: Number, required: true },
      max_discharge_kwh_per_hour: { type: Number, required: true }
    },
    directive_interpretation: { type: [Schema.Types.Mixed], required: true },
    hourly_plan: { type: [Schema.Types.Mixed], required: true },
    total_grid_kwh: { type: Number, required: true },
    total_cost_bdt: { type: Number, required: true },
    peak_grid_kwh: { type: Number, required: true },
    plan_summary: { type: String, required: true },
    execution_duration_ms: { type: Number, required: true },
    created_at: { type: Date, default: Date.now, index: true }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

export const OptimizationRun = mongoose.model<IOptimizationRun>(
  'OptimizationRun',
  OptimizationRunSchema
);
