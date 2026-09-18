import Groq from 'groq-sdk';
import { LLMProvider, InterpretationContext } from './llm-provider.interface';
import { DirectiveInterpretation } from '../../modules/optimization/domain/types';
import { OPERATOR_NOTES_SYSTEM_PROMPT } from '../../modules/operator-notes/prompts/operator-notes-prompt';
import { LLMInterpretationError } from '../../shared/errors/app-error';

export class GroqLLMProvider implements LLMProvider {
  private client: Groq;
  private model: string;

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  public async interpretOperatorNotes(
    notes: string[],
    context?: InterpretationContext
  ): Promise<DirectiveInterpretation[]> {
    const userPrompt = JSON.stringify({
      scenario_id: context?.scenario_id,
      battery_capacity_kwh: context?.battery_capacity_kwh,
      operator_notes: notes.map((text, index) => ({
        note_index: index,
        text
      }))
    });

    let rawContent = '';
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: OPERATOR_NOTES_SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          model: this.model,
          temperature: 0.0,
          response_format: { type: 'json_object' }
        });

        rawContent = completion.choices[0]?.message?.content ?? '';
        if (!rawContent) {
          throw new Error('Received empty response from Groq API');
        }

        const parsed = JSON.parse(rawContent);
        const directives = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.directives)
          ? parsed.directives
          : parsed.directive_interpretation;

        if (Array.isArray(directives)) {
          return directives as DirectiveInterpretation[];
        }

        throw new Error('LLM output does not contain directives array');
      } catch (err: unknown) {
        if (attempt === maxRetries) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown LLM error';
          throw new LLMInterpretationError(`LLM interpretation failed: ${errorMessage}`);
        }
      }
    }

    throw new LLMInterpretationError('Failed to interpret operator notes after retries');
  }
}
