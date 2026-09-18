import {
  HourlyPlanEntry,
  OptimizationContext,
  OptimizationResult
} from './domain/types';
import { LPConstraint, LPProblem, LPSolver } from './domain/lp-solver';
import { ScheduleValidator } from './schedule-validator';
import { SummaryGenerator } from './summary-generator';
import { UnprocessableEntityError } from '../../shared/errors/app-error';
import { roundToPrecision } from '../../shared/utils/numeric';

export class OptimizerService {
  public static optimize(context: OptimizationContext): OptimizationResult {
    const numHours = 24;
    const numVars = numHours * 4;

    const objective: number[] = new Array(numVars).fill(0);
    const upperBounds: (number | undefined)[] = new Array(numVars).fill(undefined);
    const constraints: LPConstraint[] = [];

    for (let h = 0; h < numHours; h++) {
      const gIdx = h * 4 + 0;
      const sIdx = h * 4 + 1;
      const cIdx = h * 4 + 2;
      const dIdx = h * 4 + 3;

      const constraint = context.hours[h];

      objective[gIdx] = constraint.tariff_bdt_per_kwh;
      objective[sIdx] = -1e-7;
      objective[cIdx] = 1e-9;
      objective[dIdx] = 1e-9;

      upperBounds[gIdx] = constraint.max_grid_kwh;
      upperBounds[sIdx] = constraint.effective_solar_kwh;
      upperBounds[cIdx] = constraint.max_charge_kwh;
      upperBounds[dIdx] = constraint.max_discharge_kwh;

      const ebCoeffs = new Array(numVars).fill(0);
      ebCoeffs[gIdx] = 1;
      ebCoeffs[sIdx] = 1;
      ebCoeffs[cIdx] = -1;
      ebCoeffs[dIdx] = 1;
      constraints.push({
        coefficients: ebCoeffs,
        type: 'eq',
        rhs: constraint.demand_kwh
      });
    }

    const initialEnergy = context.battery.initial_energy_kwh;
    const capacity = context.battery.capacity_kwh;

    for (let h = 0; h < numHours; h++) {
      const constraint = context.hours[h];
      const minReserve = constraint.min_battery_reserve_kwh;

      const capCoeffs = new Array(numVars).fill(0);
      for (let k = 0; k <= h; k++) {
        capCoeffs[k * 4 + 2] = 1;
        capCoeffs[k * 4 + 3] = -1;
      }
      constraints.push({
        coefficients: capCoeffs,
        type: 'le',
        rhs: capacity - initialEnergy
      });

      const resCoeffs = new Array(numVars).fill(0);
      for (let k = 0; k <= h; k++) {
        resCoeffs[k * 4 + 2] = 1;
        resCoeffs[k * 4 + 3] = -1;
      }
      constraints.push({
        coefficients: resCoeffs,
        type: 'ge',
        rhs: minReserve - initialEnergy
      });
    }

    const neutralityCoeffs = new Array(numVars).fill(0);
    for (let k = 0; k < numHours; k++) {
      neutralityCoeffs[k * 4 + 2] = 1;
      neutralityCoeffs[k * 4 + 3] = -1;
    }
    constraints.push({
      coefficients: neutralityCoeffs,
      type: 'eq',
      rhs: 0
    });

    const lpProblem: LPProblem = {
      objective,
      constraints,
      upperBounds
    };

    const solution = LPSolver.solve(lpProblem);

    if (solution.status !== 'optimal') {
      throw new UnprocessableEntityError(
        `Optimization infeasible: no valid energy schedule satisfies all constraints (${solution.status})`
      );
    }

    const hourlyPlan: HourlyPlanEntry[] = [];
    let currentEnergy = initialEnergy;

    for (let h = 0; h < numHours; h++) {
      const rawC = solution.variableValues[h * 4 + 2];
      const rawD = solution.variableValues[h * 4 + 3];
      const net = rawC - rawD;

      let action: 'charge' | 'discharge' | 'idle' = 'idle';
      let batteryKwh = 0;
      let actualC = 0;
      let actualD = 0;

      if (net > 1e-4) {
        action = 'charge';
        batteryKwh = net;
        actualC = net;
      } else if (net < -1e-4) {
        action = 'discharge';
        batteryKwh = -net;
        actualD = -net;
      }

      currentEnergy = currentEnergy + actualC - actualD;
      if (h === numHours - 1) {
        currentEnergy = initialEnergy;
      }

      const constraint = context.hours[h];
      const requiredSupply = Math.max(0, constraint.demand_kwh + actualC - actualD);
      const solarUsed = Math.min(constraint.effective_solar_kwh, requiredSupply);
      const gridKwh = Math.max(0, requiredSupply - solarUsed);

      hourlyPlan.push({
        hour: h,
        grid_kwh: roundToPrecision(gridKwh, 4),
        solar_used_kwh: roundToPrecision(solarUsed, 4),
        battery_action: action,
        battery_kwh: roundToPrecision(batteryKwh, 4),
        battery_energy_after_kwh: roundToPrecision(currentEnergy, 4)
      });
    }

    const recalculatedMetrics = ScheduleValidator.assertValid(context, hourlyPlan);

    for (let h = 0; h < numHours; h++) {
      hourlyPlan[h].grid_kwh = roundToPrecision(hourlyPlan[h].grid_kwh, 2);
      hourlyPlan[h].solar_used_kwh = roundToPrecision(hourlyPlan[h].solar_used_kwh, 2);
      hourlyPlan[h].battery_kwh = roundToPrecision(hourlyPlan[h].battery_kwh, 2);
      hourlyPlan[h].battery_energy_after_kwh = roundToPrecision(hourlyPlan[h].battery_energy_after_kwh, 2);
    }

    const planSummary = SummaryGenerator.generateSummary(
      context.scenario_id,
      context.directives,
      hourlyPlan,
      recalculatedMetrics,
      initialEnergy
    );

    return {
      hourly_plan: hourlyPlan,
      total_grid_kwh: recalculatedMetrics.total_grid_kwh,
      total_cost_bdt: recalculatedMetrics.total_cost_bdt,
      peak_grid_kwh: recalculatedMetrics.peak_grid_kwh,
      plan_summary: planSummary
    };
  }
}
