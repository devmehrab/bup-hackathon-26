import {
  BatteryConfig,
  DirectiveInterpretation,
  EffectiveHourConstraint,
  HourlyScenarioInput,
  MaxGridWindowAdjustment,
  MinimumBatteryReserveAdjustment,
  OptimizationContext,
  SolarReductionAdjustment
} from './domain/types';

export class DirectiveEngine {
  public static buildOptimizationContext(
    scenarioId: string,
    rawHours: HourlyScenarioInput[],
    battery: BatteryConfig,
    directives: DirectiveInterpretation[]
  ): OptimizationContext {
    const sortedHours = [...rawHours].sort((a, b) => a.hour - b.hour);

    const effectiveHours: EffectiveHourConstraint[] = sortedHours.map((h) => ({
      hour: h.hour,
      demand_kwh: h.demand_kwh,
      original_solar_kwh: h.solar_kwh,
      effective_solar_kwh: h.solar_kwh,
      tariff_bdt_per_kwh: h.tariff_bdt_per_kwh,
      min_battery_reserve_kwh: battery.minimum_energy_kwh,
      max_charge_kwh: battery.max_charge_kwh_per_hour,
      max_discharge_kwh: battery.max_discharge_kwh_per_hour,
      max_grid_kwh: undefined
    }));

    for (const directive of directives) {
      if (!directive.applies || !directive.structured_adjustment) {
        continue;
      }

      switch (directive.directive_type) {
        case 'solar_reduction': {
          const adj = directive.structured_adjustment as SolarReductionAdjustment;
          for (const hour of adj.hours) {
            if (hour >= 0 && hour < 24) {
              effectiveHours[hour].effective_solar_kwh =
                effectiveHours[hour].effective_solar_kwh * adj.factor;
            }
          }
          break;
        }

        case 'minimum_battery_reserve': {
          const adj = directive.structured_adjustment as MinimumBatteryReserveAdjustment;
          for (const hour of adj.hours) {
            if (hour >= 0 && hour < 24) {
              effectiveHours[hour].min_battery_reserve_kwh = Math.max(
                effectiveHours[hour].min_battery_reserve_kwh,
                adj.minimum_energy_kwh
              );
            }
          }
          break;
        }

        case 'no_charge_window': {
          const adj = directive.structured_adjustment as { hours: number[] };
          for (const hour of adj.hours) {
            if (hour >= 0 && hour < 24) {
              effectiveHours[hour].max_charge_kwh = 0;
            }
          }
          break;
        }

        case 'no_discharge_window': {
          const adj = directive.structured_adjustment as { hours: number[] };
          for (const hour of adj.hours) {
            if (hour >= 0 && hour < 24) {
              effectiveHours[hour].max_discharge_kwh = 0;
            }
          }
          break;
        }

        case 'max_grid_window': {
          const adj = directive.structured_adjustment as MaxGridWindowAdjustment;
          for (const hour of adj.hours) {
            if (hour >= 0 && hour < 24) {
              if (effectiveHours[hour].max_grid_kwh === undefined) {
                effectiveHours[hour].max_grid_kwh = adj.max_grid_kwh;
              } else {
                effectiveHours[hour].max_grid_kwh = Math.min(
                  effectiveHours[hour].max_grid_kwh!,
                  adj.max_grid_kwh
                );
              }
            }
          }
          break;
        }

        case 'no_op':
          break;
      }
    }

    return {
      scenario_id: scenarioId,
      hours: effectiveHours,
      battery: { ...battery },
      directives: [...directives]
    };
  }
}
