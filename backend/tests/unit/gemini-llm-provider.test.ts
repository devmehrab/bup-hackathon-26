import { describe, it, expect, vi } from 'vitest';
import { GeminiLLMProvider } from '../../src/infrastructure/llm/gemini-llm.provider';
import { LLMInterpretationError } from '../../src/shared/errors/app-error';

// Mock @google/genai
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: vi.fn()
        }
      };
    })
  };
});

describe('GeminiLLMProvider Unit Tests', () => {
  it('parses valid directives array from Gemini response', async () => {
    const provider = new GeminiLLMProvider('test-key', 'gemini-2.5-flash');
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: JSON.stringify({
        directives: [
          {
            note_index: 0,
            applies: true,
            directive_type: 'solar_reduction',
            structured_adjustment: { hours: [12, 13], factor: 0.5 },
            explanation: 'Solar halved from 12 to 14'
          }
        ]
      })
    });

    // Replace internal client's generateContent
    (provider as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: { generateContent: mockGenerateContent }
    };

    const result = await provider.interpretOperatorNotes(['Solar panels reduced to 50% between 12 PM and 2 PM']);
    expect(result).toHaveLength(1);
    expect(result[0].directive_type).toBe('solar_reduction');
    expect(result[0].applies).toBe(true);
    expect(result[0].structured_adjustment?.factor).toBe(0.5);
  });

  it('handles markdown code block wrappers around JSON', async () => {
    const provider = new GeminiLLMProvider('test-key');
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: '```json\n{\n  "directives": [\n    {\n      "note_index": 0,\n      "applies": false,\n      "directive_type": "no_op",\n      "structured_adjustment": null,\n      "explanation": "irrelevant"\n    }\n  ]\n}\n```'
    });

    (provider as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: { generateContent: mockGenerateContent }
    };

    const result = await provider.interpretOperatorNotes(['Lunch break at 1pm']);
    expect(result).toHaveLength(1);
    expect(result[0].directive_type).toBe('no_op');
    expect(result[0].applies).toBe(false);
  });

  it('throws LLMInterpretationError when Gemini returns invalid JSON after retries', async () => {
    const provider = new GeminiLLMProvider('test-key');
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: 'not-valid-json'
    });

    (provider as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: { generateContent: mockGenerateContent }
    };

    await expect(provider.interpretOperatorNotes(['Some note'])).rejects.toThrow(LLMInterpretationError);
  });

  it('throws LLMInterpretationError when Gemini returns empty response', async () => {
    const provider = new GeminiLLMProvider('test-key');
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: ''
    });

    (provider as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: { generateContent: mockGenerateContent }
    };

    await expect(provider.interpretOperatorNotes(['Some note'])).rejects.toThrow(LLMInterpretationError);
  });
});
