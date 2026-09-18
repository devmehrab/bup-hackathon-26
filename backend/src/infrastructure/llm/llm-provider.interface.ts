import { DirectiveInterpretation } from '../../modules/optimization/domain/types';

export interface InterpretationContext {
  scenario_id?: string;
  battery_capacity_kwh?: number;
}

export interface LLMProvider {
  interpretOperatorNotes(
    notes: string[],
    context?: InterpretationContext
  ): Promise<DirectiveInterpretation[]>;
}
