import { Request, Response, NextFunction } from 'express';
import { ScenarioService } from './scenario.service';
import { scenarioRequestSchema } from '../../shared/validation/scenario-request.schema';
import { isDatabaseConnected } from '../../infrastructure/database/connection';
import { OptimizationRun } from '../../infrastructure/database/models/optimization-run.model';

export class ScenarioController {
  private scenarioService: ScenarioService;

  constructor(scenarioService: ScenarioService) {
    this.scenarioService = scenarioService;
  }

  public getHealth = (_req: Request, res: Response): void => {
    res.status(200).json({ status: 'ok' });
  };

  public optimizeEnergy = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const validatedRequest = scenarioRequestSchema.parse(req.body);
      const result = await this.scenarioService.processScenario(validatedRequest);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public getRecentRuns = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!isDatabaseConnected()) {
        res.status(200).json({ runs: [] });
        return;
      }
      const runs = await OptimizationRun.find()
        .sort({ created_at: -1 })
        .limit(10)
        .lean();
      res.status(200).json({ runs });
    } catch (err) {
      next(err);
    }
  };
}
