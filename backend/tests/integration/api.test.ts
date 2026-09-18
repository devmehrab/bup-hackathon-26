import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { MockLLMProvider } from '../../src/infrastructure/llm/mock-llm.provider';

describe('BUP Energy Optimizer API Integration Tests', () => {
  const mockLLM = new MockLLMProvider();
  const app = createApp(mockLLM);

  const baseBattery = {
    capacity_kwh: 500,
    initial_energy_kwh: 200,
    minimum_energy_kwh: 50,
    max_charge_kwh_per_hour: 100,
    max_discharge_kwh_per_hour: 100
  };

  const createScenarioHours = (solarPeak = 80, demandLevel = 120) => {
    return Array.from({ length: 24 }, (_, h) => {
      const isSolarHour = h >= 9 && h <= 15;
      const solar = isSolarHour ? solarPeak : 0;
      const tariff = (h >= 17 && h <= 21) ? 14 : 7;
      return {
        hour: h,
        demand_kwh: demandLevel,
        solar_kwh: solar,
        tariff_bdt_per_kwh: tariff
      };
    });
  };

  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('Case 1: No-op operator note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-01-NOOP',
        operator_notes: ['The cafeteria menu changes tomorrow.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.scenario_id).toBe('CASE-01-NOOP');
    expect(res.body.directive_interpretation[0].directive_type).toBe('no_op');
    expect(res.body.directive_interpretation[0].applies).toBe(false);
    expect(res.body.directive_interpretation[0].structured_adjustment).toBeNull();
    expect(res.body.hourly_plan).toHaveLength(24);
  });

  it('Case 2: Solar reduction note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-02-SOLAR',
        operator_notes: ['Solar output will drop to about 20% from 1 PM to 3 PM.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('solar_reduction');
    expect(res.body.directive_interpretation[0].applies).toBe(true);
    expect(res.body.directive_interpretation[0].structured_adjustment.hours).toEqual([13, 14]);
    expect(res.body.directive_interpretation[0].structured_adjustment.factor).toBe(0.2);
  });

  it('Case 3: Minimum battery reserve note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-03-RESERVE',
        operator_notes: ['Keep at least 120 kWh in reserve from 6 PM until 9 PM.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('minimum_battery_reserve');
    expect(res.body.directive_interpretation[0].applies).toBe(true);
    expect(res.body.directive_interpretation[0].structured_adjustment.hours).toEqual([18, 19, 20]);
    expect(res.body.directive_interpretation[0].structured_adjustment.minimum_energy_kwh).toBe(120);

    for (const h of [18, 19, 20]) {
      expect(res.body.hourly_plan[h].battery_energy_after_kwh).toBeGreaterThanOrEqual(120 - 0.01);
    }
  });

  it('Case 4: No charge window note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-04-NOCHARGE',
        operator_notes: ['Do not charge the battery between 2 PM and 4 PM.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('no_charge_window');
    expect(res.body.directive_interpretation[0].structured_adjustment.hours).toEqual([14, 15]);
    expect(res.body.hourly_plan[14].battery_action).not.toBe('charge');
    expect(res.body.hourly_plan[15].battery_action).not.toBe('charge');
  });

  it('Case 5: No discharge window note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-05-NODISCHARGE',
        operator_notes: ['Do not discharge the battery between 2 PM and 4 PM.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('no_discharge_window');
    expect(res.body.directive_interpretation[0].structured_adjustment.hours).toEqual([14, 15]);
    expect(res.body.hourly_plan[14].battery_action).not.toBe('discharge');
    expect(res.body.hourly_plan[15].battery_action).not.toBe('discharge');
  });

  it('Case 6: Maximum grid window note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-06-MAXGRID',
        operator_notes: ['Grid import may not exceed 100 kWh between 2 PM and 4 PM.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('max_grid_window');
    expect(res.body.directive_interpretation[0].structured_adjustment.hours).toEqual([14, 15]);
    expect(res.body.directive_interpretation[0].structured_adjustment.max_grid_kwh).toBe(100);
    expect(res.body.hourly_plan[14].grid_kwh).toBeLessThanOrEqual(100 + 0.01);
    expect(res.body.hourly_plan[15].grid_kwh).toBeLessThanOrEqual(100 + 0.01);
  });

  it('Case 7 & 8: Multiple notes with one irrelevant note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-07-MULTI',
        operator_notes: [
          'Solar output will drop to about 20% from 1 PM to 3 PM.',
          'Do not charge the battery between 2 PM and 4 PM.',
          'The cafeteria menu changes tomorrow.'
        ],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation).toHaveLength(3);
    expect(res.body.directive_interpretation[0].directive_type).toBe('solar_reduction');
    expect(res.body.directive_interpretation[1].directive_type).toBe('no_charge_window');
    expect(res.body.directive_interpretation[2].directive_type).toBe('no_op');
    expect(res.body.directive_interpretation[2].applies).toBe(false);
  });

  it('Case 9: Arbitrage between expensive and cheap tariff periods', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-09-ARBITRAGE',
        operator_notes: ['The cafeteria menu changes tomorrow.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    const peakTariffHours = [17, 18, 19, 20, 21];
    const dischargedInPeak = res.body.hourly_plan
      .filter((h: { hour: number; battery_action: string }) => peakTariffHours.includes(h.hour))
      .some((h: { battery_action: string }) => h.battery_action === 'discharge');
    expect(dischargedInPeak).toBe(true);
  });

  it('Case 10: Solar-heavy scenario', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-10-SOLAR-HEAVY',
        operator_notes: ['The cafeteria menu changes tomorrow.'],
        hours: createScenarioHours(300, 80),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.total_grid_kwh).toBeLessThan(1000);
  });

  it('Case 11 & 12: Battery-heavy neutrality scenario', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-11-BATTERY',
        operator_notes: ['The cafeteria menu changes tomorrow.'],
        hours: createScenarioHours(150, 100),
        battery: {
          ...baseBattery,
          capacity_kwh: 1000,
          initial_energy_kwh: 500,
          max_charge_kwh_per_hour: 250,
          max_discharge_kwh_per_hour: 250
        }
      });

    expect(res.status).toBe(200);
    expect(res.body.hourly_plan[23].battery_energy_after_kwh).toBe(500);
  });

  it('Case 14: Paraphrased solar reduction note', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-14-PARAPHRASE',
        operator_notes: ['Panel washing from one until three will leave roughly one-fifth of normal solar output.'],
        hours: createScenarioHours(),
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.directive_interpretation[0].directive_type).toBe('solar_reduction');
    expect(res.body.directive_interpretation[0].structured_adjustment.factor).toBe(0.2);
  });

  it('Case 15: Rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .set('Content-Type', 'application/json')
      .send('{"scenario_id": "INVALID", broken json}');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('MALFORMED_JSON');
  });

  it('Case 16: Rejects missing scenario fields with 400', async () => {
    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'MISSING-FIELDS'
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('Case 17: Boundary hours (0 and 23) and zero tariff', async () => {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      demand_kwh: 50,
      solar_kwh: h === 12 ? 50 : 0,
      tariff_bdt_per_kwh: h === 0 ? 0 : 5
    }));

    const res = await request(app)
      .post('/optimize-energy')
      .send({
        scenario_id: 'CASE-17-BOUNDARY',
        operator_notes: ['The cafeteria menu changes tomorrow.'],
        hours,
        battery: baseBattery
      });

    expect(res.status).toBe(200);
    expect(res.body.hourly_plan[0].hour).toBe(0);
    expect(res.body.hourly_plan[23].hour).toBe(23);
    expect(res.body.hourly_plan[23].battery_energy_after_kwh).toBe(baseBattery.initial_energy_kwh);
  });
});
