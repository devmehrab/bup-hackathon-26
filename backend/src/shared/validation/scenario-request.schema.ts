import { z } from 'zod';

const hourlyEntrySchema = z.object({
  hour: z.number().int().min(0).max(23),
  demand_kwh: z.number().finite().nonnegative(),
  solar_kwh: z.number().finite().nonnegative(),
  tariff_bdt_per_kwh: z.number().finite().nonnegative()
});

const batteryConfigSchema = z.object({
  capacity_kwh: z.number().finite().positive(),
  initial_energy_kwh: z.number().finite().nonnegative(),
  minimum_energy_kwh: z.number().finite().nonnegative(),
  max_charge_kwh_per_hour: z.number().finite().nonnegative(),
  max_discharge_kwh_per_hour: z.number().finite().nonnegative()
}).refine(
  (data) => data.initial_energy_kwh <= data.capacity_kwh,
  { message: 'initial_energy_kwh cannot exceed capacity_kwh' }
).refine(
  (data) => data.minimum_energy_kwh <= data.capacity_kwh,
  { message: 'minimum_energy_kwh cannot exceed capacity_kwh' }
);

export const scenarioRequestSchema = z.object({
  scenario_id: z.string().min(1),
  operator_notes: z.array(z.string().min(1)).min(1).max(3),
  hours: z.array(hourlyEntrySchema).length(24).refine(
    (entries) => {
      const hours = entries.map((e) => e.hour);
      const uniqueHours = new Set(hours);
      if (uniqueHours.size !== 24) return false;
      for (let i = 0; i < 24; i++) {
        if (!uniqueHours.has(i)) return false;
      }
      return true;
    },
    { message: 'hours array must contain exactly 24 unique entries for hours 0 through 23' }
  ),
  battery: batteryConfigSchema
});

export type ScenarioRequest = z.infer<typeof scenarioRequestSchema>;
