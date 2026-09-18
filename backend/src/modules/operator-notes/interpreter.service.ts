import { LLMProvider } from '../../infrastructure/llm/llm-provider.interface';
import { BatteryConfig, DirectiveInterpretation } from '../optimization/domain/types';
import { validateDirectiveInterpretation } from './directive-validator';

export class InterpreterService {
  private llmProvider: LLMProvider;

  constructor(llmProvider: LLMProvider) {
    this.llmProvider = llmProvider;
  }

  public async interpret(
    scenarioId: string,
    notes: string[],
    battery: BatteryConfig
  ): Promise<DirectiveInterpretation[]> {
    const rawDirectives = await this.llmProvider.interpretOperatorNotes(notes, {
      scenario_id: scenarioId,
      battery_capacity_kwh: battery.capacity_kwh
    });

    return validateDirectiveInterpretation(rawDirectives, notes.length, battery);
  }
}
