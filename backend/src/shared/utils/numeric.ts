export const DEFAULT_TOLERANCE = 0.01;

export function isApproximatelyEqual(
  a: number,
  b: number,
  tolerance: number = DEFAULT_TOLERANCE
): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function isGreaterThanOrApprox(
  a: number,
  b: number,
  tolerance: number = DEFAULT_TOLERANCE
): boolean {
  return a >= b - tolerance;
}

export function isLessThanOrApprox(
  a: number,
  b: number,
  tolerance: number = DEFAULT_TOLERANCE
): boolean {
  return a <= b + tolerance;
}

export function roundToPrecision(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
