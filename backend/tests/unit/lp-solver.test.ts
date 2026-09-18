import { describe, it, expect } from 'vitest';
import { LPSolver, LPProblem } from '../../src/modules/optimization/domain/lp-solver';

describe('LPSolver', () => {
  it('solves simple minimization problem', () => {
    const problem: LPProblem = {
      objective: [2, 3],
      constraints: [
        {
          coefficients: [1, 1],
          type: 'ge',
          rhs: 4
        },
        {
          coefficients: [1, 2],
          type: 'ge',
          rhs: 5
        }
      ]
    };

    const solution = LPSolver.solve(problem);
    expect(solution.status).toBe('optimal');
    expect(solution.variableValues[0]).toBeCloseTo(3, 3);
    expect(solution.variableValues[1]).toBeCloseTo(1, 3);
    expect(solution.objectiveValue).toBeCloseTo(9, 3);
  });

  it('handles bounded variables and equality', () => {
    const problem: LPProblem = {
      objective: [5, 1],
      constraints: [
        {
          coefficients: [1, 1],
          type: 'eq',
          rhs: 10
        }
      ],
      upperBounds: [6, 8]
    };

    const solution = LPSolver.solve(problem);
    expect(solution.status).toBe('optimal');
    expect(solution.variableValues[1]).toBeCloseTo(8, 3);
    expect(solution.variableValues[0]).toBeCloseTo(2, 3);
    expect(solution.objectiveValue).toBeCloseTo(18, 3);
  });
});
