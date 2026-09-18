import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { LLMProvider } from './infrastructure/llm/llm-provider.interface';
import { InterpreterService } from './modules/operator-notes/interpreter.service';
import { ScenarioService } from './modules/scenarios/scenario.service';
import { ScenarioController } from './modules/scenarios/scenario.controller';
import { errorHandler } from './shared/errors/error-handler.middleware';

export function createApp(llmProvider: LLMProvider): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  const interpreterService = new InterpreterService(llmProvider);
  const scenarioService = new ScenarioService(interpreterService);
  const scenarioController = new ScenarioController(scenarioService);

  app.get('/health', scenarioController.getHealth);
  app.post('/optimize-energy', scenarioController.optimizeEnergy);
  app.get('/runs', scenarioController.getRecentRuns);

  app.use(errorHandler);

  return app;
}
