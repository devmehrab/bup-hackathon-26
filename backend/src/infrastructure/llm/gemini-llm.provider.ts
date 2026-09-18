import { GoogleGenAI } from '@google/genai';
import { LLMProvider, InterpretationContext } from './llm-provider.interface';
import { DirectiveInterpretation } from '../../modules/optimization/domain/types';
import { OPERATOR_NOTES_SYSTEM_PROMPT } from '../../modules/operator-notes/prompts/operator-notes-prompt';
import { LLMInterpretationError } from '../../shared/errors/app-error';

export class GeminiLLMProvider implements LLMProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
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
        const response = await this.ai.models.generateContent({
          model: this.model,
          contents: userPrompt,
          config: {
            systemInstruction: OPERATOR_NOTES_SYSTEM_PROMPT,
            temperature: 0.0,
            responseMimeType: 'application/json'
          }
        });

        rawContent = response.text ?? '';
        if (!rawContent) {
          throw new Error('Received empty response from Gemini API');
        }

        const cleanedContent = rawContent
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedContent);
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
