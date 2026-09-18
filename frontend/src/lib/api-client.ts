import { OptimizationResponse, HourlyScenarioInput, BatteryConfig } from '../types/energy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface OptimizeEnergyPayload {
  scenario_id: string;
  operator_notes: string[];
  hours: HourlyScenarioInput[];
  battery: BatteryConfig;
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`, {
    method: 'GET',
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export async function optimizeEnergy(
  payload: OptimizeEnergyPayload
): Promise<OptimizationResponse> {
  const response = await fetch(`${API_BASE}/optimize-energy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Unknown server error' }));
    throw new Error(errorBody.error || errorBody.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
