import { z } from 'zod';
import {
  BatteryConfig,
  DirectiveInterpretation,
  SupportedDirectiveType
} from '../optimization/domain/types';
import { ValidationError } from '../../shared/errors/app-error';

const ascendingHoursSchema = z.array(z.number().int().min(0).max(23))
  .min(1)
  .refine(
    (hours) => {
      for (let i = 0; i < hours.length; i++) {
        if (i > 0 && hours[i] <= hours[i - 1]) {
          return false;
        }
      }
      return true;
    },
    { message: 'hours must be unique integers between 0 and 23 in strictly ascending order' }
  );

const solarReductionAdjustmentSchema = z.object({
  hours: ascendingHoursSchema,
  factor: z.number().finite().min(0).max(1)
}).strict();

const minimumBatteryReserveAdjustmentSchema = (batteryCapacity: number) =>
  z.object({
    hours: ascendingHoursSchema,
    minimum_energy_kwh: z.number().finite().nonnegative().max(batteryCapacity)
  }).strict();

const noChargeWindowAdjustmentSchema = z.object({
  hours: ascendingHoursSchema
}).strict();

const noDischargeWindowAdjustmentSchema = z.object({
  hours: ascendingHoursSchema
}).strict();

const maxGridWindowAdjustmentSchema = z.object({
  hours: ascendingHoursSchema,
  max_grid_kwh: z.number().finite().nonnegative()
}).strict();

export function validateDirectiveInterpretation(
  rawInterpretations: unknown,
  expectedNoteCount: number,
  battery: BatteryConfig
): DirectiveInterpretation[] {
  if (!Array.isArray(rawInterpretations)) {
    throw new ValidationError('directive_interpretation must be an array');
  }

  if (rawInterpretations.length !== expectedNoteCount) {
    throw new ValidationError(
      `Expected exactly ${expectedNoteCount} directive interpretations, but received ${rawInterpretations.length}`
    );
  }

  const validatedEntries: DirectiveInterpretation[] = [];

  for (let i = 0; i < expectedNoteCount; i++) {
    const entry = rawInterpretations[i];

    if (!entry || typeof entry !== 'object') {
      throw new ValidationError(`Directive interpretation at index ${i} is not an object`);
    }

    const { note_index, applies, directive_type, structured_adjustment, explanation } = entry as Record<string, unknown>;

    if (note_index !== i) {
      throw new ValidationError(
        `Directive entry at index ${i} has invalid note_index ${note_index}. Must be sequential 0..${expectedNoteCount - 1}`
      );
    }

    if (typeof applies !== 'boolean') {
      throw new ValidationError(`Directive entry at index ${i} has non-boolean applies field`);
    }

    if (typeof explanation !== 'string' || explanation.trim().length === 0) {
      throw new ValidationError(`Directive entry at index ${i} has empty or non-string explanation`);
    }

    const validDirectiveTypes: SupportedDirectiveType[] = [
      'solar_reduction',
      'minimum_battery_reserve',
      'no_charge_window',
      'no_discharge_window',
      'max_grid_window',
      'no_op'
    ];

    if (!validDirectiveTypes.includes(directive_type as SupportedDirectiveType)) {
      throw new ValidationError(`Unsupported directive type: ${directive_type}`);
    }

    const type = directive_type as SupportedDirectiveType;

    if (type === 'no_op') {
      if (applies !== false) {
        throw new ValidationError('no_op directive must have applies = false');
      }
      if (structured_adjustment !== null && structured_adjustment !== undefined) {
        throw new ValidationError('no_op directive must have structured_adjustment = null');
      }

      validatedEntries.push({
        note_index: i,
        applies: false,
        directive_type: 'no_op',
        structured_adjustment: null,
        explanation: explanation.trim()
      });
      continue;
    }

    if (applies !== true) {
      throw new ValidationError(`Non-no_op directive ${type} must have applies = true`);
    }

    if (structured_adjustment === null || structured_adjustment === undefined) {
      throw new ValidationError(`Directive ${type} must have non-null structured_adjustment`);
    }

    let parsedAdjustment;

    switch (type) {
      case 'solar_reduction': {
        const result = solarReductionAdjustmentSchema.safeParse(structured_adjustment);
        if (!result.success) {
          throw new ValidationError(`Invalid solar_reduction adjustment: ${result.error.message}`);
        }
        parsedAdjustment = result.data;
        break;
      }
      case 'minimum_battery_reserve': {
        const schema = minimumBatteryReserveAdjustmentSchema(battery.capacity_kwh);
        const result = schema.safeParse(structured_adjustment);
        if (!result.success) {
          throw new ValidationError(`Invalid minimum_battery_reserve adjustment: ${result.error.message}`);
        }
        parsedAdjustment = result.data;
        break;
      }
      case 'no_charge_window': {
        const result = noChargeWindowAdjustmentSchema.safeParse(structured_adjustment);
        if (!result.success) {
          throw new ValidationError(`Invalid no_charge_window adjustment: ${result.error.message}`);
        }
        parsedAdjustment = result.data;
        break;
      }
      case 'no_discharge_window': {
        const result = noDischargeWindowAdjustmentSchema.safeParse(structured_adjustment);
        if (!result.success) {
          throw new ValidationError(`Invalid no_discharge_window adjustment: ${result.error.message}`);
        }
        parsedAdjustment = result.data;
        break;
      }
      case 'max_grid_window': {
        const result = maxGridWindowAdjustmentSchema.safeParse(structured_adjustment);
        if (!result.success) {
          throw new ValidationError(`Invalid max_grid_window adjustment: ${result.error.message}`);
        }
        parsedAdjustment = result.data;
        break;
      }
    }

    validatedEntries.push({
      note_index: i,
      applies: true,
      directive_type: type,
      structured_adjustment: parsedAdjustment,
      explanation: explanation.trim()
    });
  }

  return validatedEntries;
}
