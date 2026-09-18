import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './infrastructure/database/connection';
import { LLMProvider } from './infrastructure/llm/llm-provider.interface';
import { GeminiLLMProvider } from './infrastructure/llm/gemini-llm.provider';
import { MockLLMProvider } from './infrastructure/llm/mock-llm.provider';

async function bootstrap(): Promise<void> {
  await connectDatabase(env.MONGODB_URI);

  let llmProvider: LLMProvider;
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
    llmProvider = new GeminiLLMProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  } else {
    llmProvider = new MockLLMProvider();
  }

  const app = createApp(llmProvider);

  app.listen(env.PORT, '0.0.0.0', () => {
    process.stdout.write(`Server running on port ${env.PORT}\n`);
  });
}

bootstrap().catch((err) => {
  process.stderr.write(`Failed to start server: ${err}\n`);
  process.exit(1);
});
