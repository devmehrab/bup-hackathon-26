import { describe, it, expect } from 'vitest';
import { DirectiveEngine } from '../../src/modules/optimization/directive-engine';
import { OptimizerService } from '../../src/modules/optimization/optimizer.service';
import { BatteryConfig, DirectiveInterpretation, HourlyScenarioInput } from '../../src/modules/optimization/domain/types';

describe('OptimizerService', () => {
  const baseBattery: BatteryConfig = {
    capacity_kwh: 500,
    initial_energy_kwh: 200,
    minimum_energy_kwh: 50,
    max_charge_kwh_per_hour: 100,
    max_discharge_kwh_per_hour: 100
  };

  const createBaseHours = (): HourlyScenarioInput[] => {
    const hours: HourlyScenarioInput[] = [];
    for (let h = 0; h < 24; h++) {
      let solar = 0;
      if (h >= 8 && h <= 16) {
        solar = 80;
      }
      const tariff = (h >= 17 && h <= 21) ? 12 : 6;
      hours.push({
        hour: h,
        demand_kwh: 120,
        solar_kwh: solar,
        tariff_bdt_per_kwh: tariff
      });
    }
    return hours;
  };

  it('optimizes energy schedule without directives', () => {
    const rawHours = createBaseHours();
    const directives: DirectiveInterpretation[] = [];

    const context = DirectiveEngine.buildOptimizationContext(
      'TEST-001',
      rawHours,
      baseBattery,
      directives
    );

    const result = OptimizerService.optimize(context);

    expect(result.hourly_plan).toHaveLength(24);
    expect(result.total_grid_kwh).toBeGreaterThan(0);
    expect(result.total_cost_bdt).toBeGreaterThan(0);
    expect(result.peak_grid_kwh).toBeGreaterThan(0);
    expect(result.hourly_plan[23].battery_energy_after_kwh).toBe(baseBattery.initial_energy_kwh);
  });

  it('applies solar_reduction correctly', () => {
    const rawHours = createBaseHours();
    const directives: DirectiveInterpretation[] = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'solar_reduction',
        structured_adjustment: {
          hours: [13, 14],
          factor: 0.2
        },
        explanation: 'Panel cleaning'
      }
    ];

    const context = DirectiveEngine.buildOptimizationContext(
      'TEST-002',
      rawHours,
      baseBattery,
      directives
    );

    expect(context.hours[13].effective_solar_kwh).toBe(16);
    expect(context.hours[14].effective_solar_kwh).toBe(16);
    expect(context.hours[12].effective_solar_kwh).toBe(80);

    const result = OptimizerService.optimize(context);
    expect(result.hourly_plan).toHaveLength(24);
  });

  it('respects no_charge_window and no_discharge_window', () => {
    const rawHours = createBaseHours();
    const directives: DirectiveInterpretation[] = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'no_charge_window',
        structured_adjustment: {
          hours: [10, 11]
        },
        explanation: 'Maintenance'
      },
      {
        note_index: 1,
        applies: true,
        directive_type: 'no_discharge_window',
        structured_adjustment: {
          hours: [18, 19]
        },
        explanation: 'Grid test'
      }
    ];

    const context = DirectiveEngine.buildOptimizationContext(
      'TEST-003',
      rawHours,
      baseBattery,
      directives
    );

    const result = OptimizerService.optimize(context);

    expect(result.hourly_plan[10].battery_action).not.toBe('charge');
    expect(result.hourly_plan[11].battery_action).not.toBe('charge');
    expect(result.hourly_plan[18].battery_action).not.toBe('discharge');
    expect(result.hourly_plan[19].battery_action).not.toBe('discharge');
  });

  it('respects max_grid_window and minimum_battery_reserve', () => {
    const rawHours = createBaseHours();
    const directives: DirectiveInterpretation[] = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'minimum_battery_reserve',
        structured_adjustment: {
          hours: [18, 19, 20],
          minimum_energy_kwh: 150
        },
        explanation: 'Reserve power'
      },
      {
        note_index: 1,
        applies: true,
        directive_type: 'max_grid_window',
        structured_adjustment: {
          hours: [14, 15],
          max_grid_kwh: 50
        },
        explanation: 'Substation limitation'
      }
    ];

    const context = DirectiveEngine.buildOptimizationContext(
      'TEST-004',
      rawHours,
      baseBattery,
      directives
    );

    const result = OptimizerService.optimize(context);

    expect(result.hourly_plan[18].battery_energy_after_kwh).toBeGreaterThanOrEqual(150 - 0.01);
    expect(result.hourly_plan[19].battery_energy_after_kwh).toBeGreaterThanOrEqual(150 - 0.01);
    expect(result.hourly_plan[20].battery_energy_after_kwh).toBeGreaterThanOrEqual(150 - 0.01);
    expect(result.hourly_plan[14].grid_kwh).toBeLessThanOrEqual(50 + 0.01);
    expect(result.hourly_plan[15].grid_kwh).toBeLessThanOrEqual(50 + 0.01);
  });
});
