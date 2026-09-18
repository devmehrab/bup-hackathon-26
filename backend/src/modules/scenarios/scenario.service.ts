import { ScenarioRequest } from '../../shared/validation/scenario-request.schema';
import { OptimizationResponse } from '../optimization/domain/types';
import { InterpreterService } from '../operator-notes/interpreter.service';
import { DirectiveEngine } from '../optimization/directive-engine';
import { OptimizerService } from '../optimization/optimizer.service';
import { isDatabaseConnected } from '../../infrastructure/database/connection';
import { OptimizationRun } from '../../infrastructure/database/models/optimization-run.model';

export class ScenarioService {
  private interpreterService: InterpreterService;

  constructor(interpreterService: InterpreterService) {
    this.interpreterService = interpreterService;
  }

  public async processScenario(
    request: ScenarioRequest
  ): Promise<OptimizationResponse> {
    const startTime = Date.now();

    const directives = await this.interpreterService.interpret(
      request.scenario_id,
      request.operator_notes,
      request.battery
    );

    const context = DirectiveEngine.buildOptimizationContext(
      request.scenario_id,
      request.hours,
      request.battery,
      directives
    );

    const optimizationResult = OptimizerService.optimize(context);

    const durationMs = Date.now() - startTime;

    const response: OptimizationResponse = {
      scenario_id: request.scenario_id,
      directive_interpretation: directives,
      hourly_plan: optimizationResult.hourly_plan,
      total_grid_kwh: optimizationResult.total_grid_kwh,
      total_cost_bdt: optimizationResult.total_cost_bdt,
      peak_grid_kwh: optimizationResult.peak_grid_kwh,
      plan_summary: optimizationResult.plan_summary
    };

    if (isDatabaseConnected()) {
      OptimizationRun.create({
        scenario_id: request.scenario_id,
        operator_notes: request.operator_notes,
        battery_config: request.battery,
        directive_interpretation: directives,
        hourly_plan: optimizationResult.hourly_plan,
        total_grid_kwh: optimizationResult.total_grid_kwh,
        total_cost_bdt: optimizationResult.total_cost_bdt,
        peak_grid_kwh: optimizationResult.peak_grid_kwh,
        plan_summary: optimizationResult.plan_summary,
        execution_duration_ms: durationMs
      }).catch(() => {});
    }

    return response;
  }
}
