import { describe, it, expect } from 'vitest';
import { scenarioRequestSchema } from '../../src/shared/validation/scenario-request.schema';
import { validateDirectiveInterpretation } from '../../src/modules/operator-notes/directive-validator';
import { BatteryConfig } from '../../src/modules/optimization/domain/types';

describe('Validation Layer', () => {
  const battery: BatteryConfig = {
    capacity_kwh: 500,
    initial_energy_kwh: 200,
    minimum_energy_kwh: 50,
    max_charge_kwh_per_hour: 100,
    max_discharge_kwh_per_hour: 100
  };

  it('validates a correct scenario request', () => {
    const validHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      demand_kwh: 100,
      solar_kwh: 50,
      tariff_bdt_per_kwh: 8
    }));

    const result = scenarioRequestSchema.safeParse({
      scenario_id: 'GRID-001',
      operator_notes: ['Solar output will drop to 20% from 1 PM to 3 PM.'],
      hours: validHours,
      battery
    });

    expect(result.success).toBe(true);
  });

  it('rejects scenario request with missing hours', () => {
    const invalidHours = Array.from({ length: 23 }, (_, i) => ({
      hour: i,
      demand_kwh: 100,
      solar_kwh: 50,
      tariff_bdt_per_kwh: 8
    }));

    const result = scenarioRequestSchema.safeParse({
      scenario_id: 'GRID-002',
      operator_notes: ['Some note'],
      hours: invalidHours,
      battery
    });

    expect(result.success).toBe(false);
  });

  it('rejects initial energy exceeding capacity', () => {
    const validHours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      demand_kwh: 100,
      solar_kwh: 50,
      tariff_bdt_per_kwh: 8
    }));

    const result = scenarioRequestSchema.safeParse({
      scenario_id: 'GRID-003',
      operator_notes: ['Some note'],
      hours: validHours,
      battery: {
        ...battery,
        initial_energy_kwh: 600
      }
    });

    expect(result.success).toBe(false);
  });

  it('validates correct directives through guardrail validator', () => {
    const directives = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'solar_reduction',
        structured_adjustment: {
          hours: [13, 14],
          factor: 0.2
        },
        explanation: 'Panel cleaning'
      },
      {
        note_index: 1,
        applies: false,
        directive_type: 'no_op',
        structured_adjustment: null,
        explanation: 'Irrelevant'
      }
    ];

    const validated = validateDirectiveInterpretation(directives, 2, battery);
    expect(validated).toHaveLength(2);
    expect(validated[0].directive_type).toBe('solar_reduction');
    expect(validated[1].directive_type).toBe('no_op');
  });

  it('rejects non-ascending hours in directive', () => {
    const directives = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'no_charge_window',
        structured_adjustment: {
          hours: [15, 14]
        },
        explanation: 'Non ascending'
      }
    ];

    expect(() => validateDirectiveInterpretation(directives, 1, battery)).toThrow();
  });

  it('rejects reserve exceeding capacity', () => {
    const directives = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'minimum_battery_reserve',
        structured_adjustment: {
          hours: [18, 19],
          minimum_energy_kwh: 600
        },
        explanation: 'Impossible reserve'
      }
    ];

    expect(() => validateDirectiveInterpretation(directives, 1, battery)).toThrow();
  });

  it('rejects solar factor outside [0, 1]', () => {
    const directives = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'solar_reduction',
        structured_adjustment: {
          hours: [13, 14],
          factor: 1.5
        },
        explanation: 'Invalid factor'
      }
    ];

    expect(() => validateDirectiveInterpretation(directives, 1, battery)).toThrow();
  });

  it('rejects no_op with applies = true or non-null adjustment', () => {
    const directives = [
      {
        note_index: 0,
        applies: true,
        directive_type: 'no_op',
        structured_adjustment: null,
        explanation: 'Wrong applies'
      }
    ];

    expect(() => validateDirectiveInterpretation(directives, 1, battery)).toThrow();
  });
});
