import {
  HourlyPlanEntry,
  OptimizationContext,
  OptimizationMetrics
} from './domain/types';
import { ValidationError } from '../../shared/errors/app-error';
import {
  DEFAULT_TOLERANCE,
  isApproximatelyEqual,
  isGreaterThanOrApprox,
  isLessThanOrApprox,
  roundToPrecision
} from '../../shared/utils/numeric';

export interface ValidationReport {
  isValid: boolean;
  recalculatedMetrics: OptimizationMetrics;
  errors: string[];
}

export class ScheduleValidator {
  public static validate(
    context: OptimizationContext,
    plan: HourlyPlanEntry[]
  ): ValidationReport {
    const errors: string[] = [];

    if (!Array.isArray(plan) || plan.length !== 24) {
      errors.push(`Hourly plan must contain exactly 24 entries, found ${plan?.length ?? 0}`);
      return {
        isValid: false,
        recalculatedMetrics: { total_grid_kwh: 0, total_cost_bdt: 0, peak_grid_kwh: 0 },
        errors
      };
    }

    let previousEnergy = context.battery.initial_energy_kwh;
    let totalGrid = 0;
    let totalCost = 0;
    let peakGrid = 0;

    const seenHours = new Set<number>();

    for (let h = 0; h < 24; h++) {
      const entry = plan[h];
      const constraint = context.hours.find((c) => c.hour === h);

      if (!constraint) {
        errors.push(`Missing constraint definition for hour ${h}`);
        continue;
      }

      if (entry.hour !== h) {
        errors.push(`Entry at index ${h} has hour ${entry.hour}, expected ${h}`);
      }

      if (seenHours.has(entry.hour)) {
        errors.push(`Duplicate hour entry for hour ${entry.hour}`);
      }
      seenHours.add(entry.hour);

      if (!Number.isFinite(entry.grid_kwh) || entry.grid_kwh < -DEFAULT_TOLERANCE) {
        errors.push(`Hour ${h}: grid_kwh must be non-negative, got ${entry.grid_kwh}`);
      }

      if (!Number.isFinite(entry.solar_used_kwh) || entry.solar_used_kwh < -DEFAULT_TOLERANCE) {
        errors.push(`Hour ${h}: solar_used_kwh must be non-negative, got ${entry.solar_used_kwh}`);
      }

      if (!Number.isFinite(entry.battery_kwh) || entry.battery_kwh < -DEFAULT_TOLERANCE) {
        errors.push(`Hour ${h}: battery_kwh must be non-negative, got ${entry.battery_kwh}`);
      }

      if (!Number.isFinite(entry.battery_energy_after_kwh) || entry.battery_energy_after_kwh < -DEFAULT_TOLERANCE) {
        errors.push(`Hour ${h}: battery_energy_after_kwh must be non-negative, got ${entry.battery_energy_after_kwh}`);
      }

      if (!['charge', 'discharge', 'idle'].includes(entry.battery_action)) {
        errors.push(`Hour ${h}: Invalid battery action ${entry.battery_action}`);
      }

      if (entry.battery_action === 'idle' && !isApproximatelyEqual(entry.battery_kwh, 0)) {
        errors.push(`Hour ${h}: battery_kwh must be 0 when action is idle, got ${entry.battery_kwh}`);
      }

      let expectedEnergyAfter = previousEnergy;
      let chargeAmount = 0;
      let dischargeAmount = 0;

      if (entry.battery_action === 'charge') {
        chargeAmount = entry.battery_kwh;
        expectedEnergyAfter = previousEnergy + chargeAmount;

        if (chargeAmount > constraint.max_charge_kwh + DEFAULT_TOLERANCE) {
          errors.push(
            `Hour ${h}: Charge rate ${chargeAmount} exceeds maximum allowed ${constraint.max_charge_kwh}`
          );
        }
      } else if (entry.battery_action === 'discharge') {
        dischargeAmount = entry.battery_kwh;
        expectedEnergyAfter = previousEnergy - dischargeAmount;

        if (dischargeAmount > constraint.max_discharge_kwh + DEFAULT_TOLERANCE) {
          errors.push(
            `Hour ${h}: Discharge rate ${dischargeAmount} exceeds maximum allowed ${constraint.max_discharge_kwh}`
          );
        }
      }

      if (!isApproximatelyEqual(entry.battery_energy_after_kwh, expectedEnergyAfter)) {
        errors.push(
          `Hour ${h}: Battery energy transition error. Expected ${expectedEnergyAfter}, got ${entry.battery_energy_after_kwh}`
        );
      }

      if (!isLessThanOrApprox(entry.battery_energy_after_kwh, context.battery.capacity_kwh)) {
        errors.push(
          `Hour ${h}: Battery energy ${entry.battery_energy_after_kwh} exceeds capacity ${context.battery.capacity_kwh}`
        );
      }

      if (!isGreaterThanOrApprox(entry.battery_energy_after_kwh, constraint.min_battery_reserve_kwh)) {
        errors.push(
          `Hour ${h}: Battery energy ${entry.battery_energy_after_kwh} falls below minimum reserve ${constraint.min_battery_reserve_kwh}`
        );
      }

      if (!isLessThanOrApprox(entry.solar_used_kwh, constraint.effective_solar_kwh)) {
        errors.push(
          `Hour ${h}: solar_used_kwh ${entry.solar_used_kwh} exceeds effective solar ${constraint.effective_solar_kwh}`
        );
      }

      if (
        constraint.max_grid_kwh !== undefined &&
        !isLessThanOrApprox(entry.grid_kwh, constraint.max_grid_kwh)
      ) {
        errors.push(
          `Hour ${h}: grid_kwh ${entry.grid_kwh} exceeds max_grid_kwh directive ${constraint.max_grid_kwh}`
        );
      }

      const supply = entry.grid_kwh + entry.solar_used_kwh + dischargeAmount;
      const demand = constraint.demand_kwh + chargeAmount;
      if (!isApproximatelyEqual(supply, demand)) {
        errors.push(
          `Hour ${h}: Energy balance violation. Supply (${supply.toFixed(4)}) !== Demand (${demand.toFixed(4)})`
        );
      }

      previousEnergy = entry.battery_energy_after_kwh;
      totalGrid += entry.grid_kwh;
      totalCost += entry.grid_kwh * constraint.tariff_bdt_per_kwh;
      if (entry.grid_kwh > peakGrid) {
        peakGrid = entry.grid_kwh;
      }
    }

    if (!isApproximatelyEqual(previousEnergy, context.battery.initial_energy_kwh)) {
      errors.push(
        `End-of-day battery neutrality violation. Final energy ${previousEnergy.toFixed(4)} != Initial energy ${context.battery.initial_energy_kwh}`
      );
    }

    const recalculatedMetrics: OptimizationMetrics = {
      total_grid_kwh: roundToPrecision(totalGrid, 2),
      total_cost_bdt: roundToPrecision(totalCost, 2),
      peak_grid_kwh: roundToPrecision(peakGrid, 2)
    };

    return {
      isValid: errors.length === 0,
      recalculatedMetrics,
      errors
    };
  }

  public static assertValid(context: OptimizationContext, plan: HourlyPlanEntry[]): OptimizationMetrics {
    const report = this.validate(context, plan);
    if (!report.isValid) {
      throw new ValidationError(`Schedule replay validation failed: ${report.errors.join('; ')}`, {
        errors: report.errors
      });
    }
    return report.recalculatedMetrics;
  }
}
