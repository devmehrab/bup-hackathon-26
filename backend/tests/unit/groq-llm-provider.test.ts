import { describe, it, expect, vi } from 'vitest';
import { GroqLLMProvider } from '../../src/infrastructure/llm/groq-llm.provider';
import { LLMInterpretationError } from '../../src/shared/errors/app-error';

// Mock groq-sdk
vi.mock('groq-sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn()
          }
        }
      };
    })
  };
});

describe('GroqLLMProvider Unit Tests', () => {
  it('parses valid directives array from Groq response', async () => {
    const provider = new GroqLLMProvider('test-key', 'llama-3.3-70b-versatile');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
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
          }
        }
      ]
    });

    (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client = {
      chat: { completions: { create: mockCreate } }
    };

    const result = await provider.interpretOperatorNotes(['Solar panels reduced to 50% between 12 PM and 2 PM']);
    expect(result).toHaveLength(1);
    expect(result[0].directive_type).toBe('solar_reduction');
    expect(result[0].applies).toBe(true);
    expect(result[0].structured_adjustment?.factor).toBe(0.5);
  });

  it('handles markdown code block wrappers around JSON', async () => {
    const provider = new GroqLLMProvider('test-key');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: '```json\n{\n  "directives": [\n    {\n      "note_index": 0,\n      "applies": false,\n      "directive_type": "no_op",\n      "structured_adjustment": null,\n      "explanation": "irrelevant"\n    }\n  ]\n}\n```'
          }
        }
      ]
    });

    (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client = {
      chat: { completions: { create: mockCreate } }
    };

    const result = await provider.interpretOperatorNotes(['Lunch break at 1pm']);
    expect(result).toHaveLength(1);
    expect(result[0].directive_type).toBe('no_op');
    expect(result[0].applies).toBe(false);
  });

  it('throws LLMInterpretationError when Groq returns invalid JSON after retries', async () => {
    const provider = new GroqLLMProvider('test-key');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'not-valid-json'
          }
        }
      ]
    });

    (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client = {
      chat: { completions: { create: mockCreate } }
    };

    await expect(provider.interpretOperatorNotes(['Some note'])).rejects.toThrow(LLMInterpretationError);
  });

  it('throws LLMInterpretationError when Groq returns empty response', async () => {
    const provider = new GroqLLMProvider('test-key');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: ''
          }
        }
      ]
    });

    (provider as unknown as { client: { chat: { completions: { create: typeof mockCreate } } } }).client = {
      chat: { completions: { create: mockCreate } }
    };

    await expect(provider.interpretOperatorNotes(['Some note'])).rejects.toThrow(LLMInterpretationError);
  });
});
