import {
  DirectiveInterpretation,
  HourlyPlanEntry,
  OptimizationMetrics
} from './domain/types';

export class SummaryGenerator {
  public static generateSummary(
    scenarioId: string,
    directives: DirectiveInterpretation[],
    hourlyPlan: HourlyPlanEntry[],
    metrics: OptimizationMetrics,
    initialBatteryEnergy: number
  ): string {
    const appliedDirectives = directives.filter((d) => d.applies);
    const directiveDescriptions = appliedDirectives.map((d) => d.directive_type).join(', ');

    let totalCharged = 0;
    let totalDischarged = 0;
    for (const entry of hourlyPlan) {
      if (entry.battery_action === 'charge') {
        totalCharged += entry.battery_kwh;
      } else if (entry.battery_action === 'discharge') {
        totalDischarged += entry.battery_kwh;
      }
    }

    const finalBatteryEnergy = hourlyPlan[23]?.battery_energy_after_kwh ?? initialBatteryEnergy;
    const directivesSummary = appliedDirectives.length > 0
      ? `Applied ${appliedDirectives.length} active directives (${directiveDescriptions}).`
      : 'No active operator adjustments applied.';

    return [
      `Optimization completed for scenario ${scenarioId}.`,
      directivesSummary,
      `Total grid energy import is ${metrics.total_grid_kwh.toFixed(2)} kWh with a peak grid demand of ${metrics.peak_grid_kwh.toFixed(2)} kWh.`,
      `Total electricity cost is ${metrics.total_cost_bdt.toFixed(2)} BDT.`,
      `Battery storage charged ${totalCharged.toFixed(2)} kWh and discharged ${totalDischarged.toFixed(2)} kWh, maintaining end-of-day neutrality at ${finalBatteryEnergy.toFixed(2)} kWh.`
    ].join(' ');
  }
}
