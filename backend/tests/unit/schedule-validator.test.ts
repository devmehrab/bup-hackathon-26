import { describe, it, expect } from 'vitest';
import { ScheduleValidator } from '../../src/modules/optimization/schedule-validator';
import { OptimizationContext, HourlyPlanEntry } from '../../src/modules/optimization/domain/types';

describe('ScheduleValidator', () => {
  const createContext = (): OptimizationContext => ({
    scenario_id: 'TEST-VAL',
    battery: {
      capacity_kwh: 500,
      initial_energy_kwh: 200,
      minimum_energy_kwh: 50,
      max_charge_kwh_per_hour: 100,
      max_discharge_kwh_per_hour: 100
    },
    directives: [],
    hours: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      demand_kwh: 100,
      original_solar_kwh: 40,
      effective_solar_kwh: 40,
      tariff_bdt_per_kwh: 10,
      min_battery_reserve_kwh: 50,
      max_charge_kwh: 100,
      max_discharge_kwh: 100
    }))
  });

  const createValidPlan = (): HourlyPlanEntry[] => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      grid_kwh: 60,
      solar_used_kwh: 40,
      battery_action: 'idle',
      battery_kwh: 0,
      battery_energy_after_kwh: 200
    }));
  };

  it('passes a completely valid schedule', () => {
    const context = createContext();
    const plan = createValidPlan();

    const report = ScheduleValidator.validate(context, plan);
    expect(report.isValid).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.recalculatedMetrics.total_grid_kwh).toBe(1440);
    expect(report.recalculatedMetrics.total_cost_bdt).toBe(14400);
    expect(report.recalculatedMetrics.peak_grid_kwh).toBe(60);
  });

  it('detects energy balance violation', () => {
    const context = createContext();
    const plan = createValidPlan();
    plan[5].grid_kwh = 10;

    const report = ScheduleValidator.validate(context, plan);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes('Energy balance violation'))).toBe(true);
  });

  it('detects battery capacity violation', () => {
    const context = createContext();
    const plan = createValidPlan();
    plan[0].battery_action = 'charge';
    plan[0].battery_kwh = 100;
    plan[0].battery_energy_after_kwh = 600;

    const report = ScheduleValidator.validate(context, plan);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes('exceeds capacity'))).toBe(true);
  });

  it('detects end-of-day battery neutrality violation', () => {
    const context = createContext();
    const plan = createValidPlan();
    plan[23].battery_energy_after_kwh = 180;

    const report = ScheduleValidator.validate(context, plan);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.includes('neutrality violation'))).toBe(true);
  });
});
