export interface LPConstraint {
  coefficients: number[];
  type: 'le' | 'ge' | 'eq';
  rhs: number;
}

export interface LPProblem {
  objective: number[];
  constraints: LPConstraint[];
  upperBounds?: (number | undefined)[];
}

export interface LPSolution {
  status: 'optimal' | 'infeasible' | 'unbounded';
  objectiveValue: number;
  variableValues: number[];
}

export class LPSolver {
  private static readonly EPSILON = 1e-8;
  private static readonly MAX_ITERATIONS = 20000;

  public static solve(problem: LPProblem): LPSolution {
    const numVars = problem.objective.length;
    const allConstraints: LPConstraint[] = [];

    for (const c of problem.constraints) {
      allConstraints.push({
        coefficients: [...c.coefficients],
        type: c.type,
        rhs: c.rhs
      });
    }

    if (problem.upperBounds) {
      for (let j = 0; j < numVars; j++) {
        const ub = problem.upperBounds[j];
        if (ub !== undefined && Number.isFinite(ub)) {
          const coeffs = new Array(numVars).fill(0);
          coeffs[j] = 1;
          allConstraints.push({
            coefficients: coeffs,
            type: 'le',
            rhs: ub
          });
        }
      }
    }

    for (let i = 0; i < allConstraints.length; i++) {
      const c = allConstraints[i];
      if (c.rhs < -this.EPSILON) {
        for (let j = 0; j < c.coefficients.length; j++) {
          c.coefficients[j] = -c.coefficients[j];
        }
        c.rhs = -c.rhs;
        if (c.type === 'le') c.type = 'ge';
        else if (c.type === 'ge') c.type = 'le';
      }
    }

    let slackCount = 0;
    let artificialCount = 0;

    for (const c of allConstraints) {
      if (c.type === 'le') {
        slackCount++;
      } else if (c.type === 'ge') {
        slackCount++;
        artificialCount++;
      } else if (c.type === 'eq') {
        artificialCount++;
      }
    }

    const m = allConstraints.length;
    const totalCols = numVars + slackCount + artificialCount + 1;
    const rhsCol = totalCols - 1;

    const tableau: number[][] = Array.from({ length: m + 2 }, () =>
      new Array(totalCols).fill(0)
    );

    const basis: number[] = new Array(m);
    let currentSlack = numVars;
    let currentArtificial = numVars + slackCount;

    for (let i = 0; i < m; i++) {
      const c = allConstraints[i];
      for (let j = 0; j < numVars; j++) {
        tableau[i][j] = c.coefficients[j];
      }

      if (c.type === 'le') {
        tableau[i][currentSlack] = 1;
        basis[i] = currentSlack;
        currentSlack++;
      } else if (c.type === 'ge') {
        tableau[i][currentSlack] = -1;
        currentSlack++;
        tableau[i][currentArtificial] = 1;
        basis[i] = currentArtificial;
        currentArtificial++;
      } else if (c.type === 'eq') {
        tableau[i][currentArtificial] = 1;
        basis[i] = currentArtificial;
        currentArtificial++;
      }

      tableau[i][rhsCol] = c.rhs;
    }

    for (let j = 0; j < numVars; j++) {
      tableau[m][j] = problem.objective[j];
    }

    if (artificialCount > 0) {
      for (let j = numVars + slackCount; j < numVars + slackCount + artificialCount; j++) {
        tableau[m + 1][j] = 1;
      }

      for (let i = 0; i < m; i++) {
        if (basis[i] >= numVars + slackCount) {
          for (let k = 0; k < totalCols; k++) {
            tableau[m + 1][k] -= tableau[i][k];
          }
        }
      }

      const phase1Result = this.runSimplex(
        tableau,
        basis,
        m + 1,
        m + 1,
        totalCols - 1,
        rhsCol,
        m
      );

      if (phase1Result === 'unbounded') {
        return { status: 'unbounded', objectiveValue: 0, variableValues: [] };
      }

      const phase1Obj = tableau[m + 1][rhsCol];
      if (Math.abs(phase1Obj) > 1e-4) {
        return { status: 'infeasible', objectiveValue: 0, variableValues: [] };
      }

      for (let i = 0; i < m; i++) {
        if (basis[i] >= numVars + slackCount) {
          for (let j = 0; j < numVars + slackCount; j++) {
            if (Math.abs(tableau[i][j]) > this.EPSILON) {
              this.pivot(tableau, basis, i, j, m + 1, totalCols);
              break;
            }
          }
        }
      }
    }

    for (let i = 0; i < m; i++) {
      const basicVar = basis[i];
      const factor = tableau[m][basicVar];
      if (Math.abs(factor) > this.EPSILON) {
        for (let k = 0; k < totalCols; k++) {
          tableau[m][k] -= factor * tableau[i][k];
        }
      }
    }

    const phase2Result = this.runSimplex(
      tableau,
      basis,
      m,
      m,
      numVars + slackCount,
      rhsCol,
      m
    );

    if (phase2Result === 'unbounded') {
      return { status: 'unbounded', objectiveValue: 0, variableValues: [] };
    }

    const variableValues = new Array(numVars).fill(0);
    for (let i = 0; i < m; i++) {
      const basicVar = basis[i];
      if (basicVar < numVars) {
        variableValues[basicVar] = Math.max(0, tableau[i][rhsCol]);
      }
    }

    const objectiveValue = -tableau[m][rhsCol];

    return {
      status: 'optimal',
      objectiveValue,
      variableValues
    };
  }

  private static runSimplex(
    tableau: number[][],
    basis: number[],
    objRow: number,
    totalRowsToUpdate: number,
    candidateCols: number,
    rhsCol: number,
    numRows: number
  ): 'optimal' | 'unbounded' {
    let iterations = 0;

    while (iterations < this.MAX_ITERATIONS) {
      iterations++;

      let pivotCol = -1;
      let minVal = -this.EPSILON;

      for (let j = 0; j < candidateCols; j++) {
        if (tableau[objRow][j] < minVal) {
          minVal = tableau[objRow][j];
          pivotCol = j;
        }
      }

      if (pivotCol === -1) {
        return 'optimal';
      }

      let pivotRow = -1;
      let minRatio = Infinity;

      for (let i = 0; i < numRows; i++) {
        const entry = tableau[i][pivotCol];
        if (entry > this.EPSILON) {
          const ratio = tableau[i][rhsCol] / entry;
          if (ratio < minRatio - this.EPSILON) {
            minRatio = ratio;
            pivotRow = i;
          }
        }
      }

      if (pivotRow === -1) {
        return 'unbounded';
      }

      this.pivot(tableau, basis, pivotRow, pivotCol, totalRowsToUpdate, rhsCol + 1);
    }

    return 'optimal';
  }

  private static pivot(
    tableau: number[][],
    basis: number[],
    pRow: number,
    pCol: number,
    totalRowsToUpdate: number,
    numCols: number
  ): void {
    const pivotVal = tableau[pRow][pCol];
    for (let j = 0; j < numCols; j++) {
      tableau[pRow][j] /= pivotVal;
    }

    for (let i = 0; i <= totalRowsToUpdate; i++) {
      if (i !== pRow) {
        const factor = tableau[i][pCol];
        if (Math.abs(factor) > this.EPSILON) {
          for (let j = 0; j < numCols; j++) {
            tableau[i][j] -= factor * tableau[pRow][j];
          }
        }
      }
    }

    basis[pRow] = pCol;
  }
}
