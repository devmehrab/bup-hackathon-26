import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase } from './infrastructure/database/connection';
import { LLMProvider } from './infrastructure/llm/llm-provider.interface';
import { GroqLLMProvider } from './infrastructure/llm/groq-llm.provider';
import { MockLLMProvider } from './infrastructure/llm/mock-llm.provider';

async function bootstrap(): Promise<void> {
  await connectDatabase(env.MONGODB_URI);

  let llmProvider: LLMProvider;
  if (env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0) {
    llmProvider = new GroqLLMProvider(env.GROQ_API_KEY, env.GROQ_MODEL);
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
