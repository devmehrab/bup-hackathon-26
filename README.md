# BUP CSE Fest 2026 - Smart Campus Energy Optimization Platform

Production-quality implementation of the BUP CSE Fest 2026 Preliminary Hackathon Challenge: **Smart Campus Energy Optimization with LLM-Assisted Operator Directive Interpretation**.

---

## 1. Architectural Overview

The system implements the strict end-to-end pipeline specified in the Problem Statement:

```
Natural Language Operator Notes
              ↓
   Gemini LLM Interpretation (LLMProvider)
              ↓
  Deterministic Guardrail Validation (Zod)
              ↓
  Directive Application Engine (DirectiveEngine)
              ↓
   Deterministic Simplex LP Optimizer (LPSolver)
              ↓
 Independent Schedule Replay Validator (ScheduleValidator)
              ↓
 Recalculated Metrics & Deterministic Summary
              ↓
       Standard JSON API Response
```

### Core Architecture Principles:
- **LLM Isolation**: The Gemini language model is strictly confined to interpreting natural-language notes into structured machine-checkable directives. The LLM never computes math, battery states, energy balances, or schedules.
- **Zero-Dependency Simplex Optimizer**: Mathematical optimization is solved using a pure TypeScript two-phase Simplex Linear Programming engine (`LPSolver`). This provides microsecond latency, zero native binary compilation issues, and 100% deterministic reproducibility across all platforms.
- **Single Battery Action Guarantee**: The optimizer guarantees that in every hour, the battery takes exactly one action (`charge`, `discharge`, or `idle`), with `battery_kwh = 0` when `idle`.
- **Independent Schedule Replay Validator**: Schedule outputs are replayed hour-by-hour by an independent auditor that recalculates `total_grid_kwh`, `total_cost_bdt`, and `peak_grid_kwh`, and strictly verifies energy balance, rate limits, battery bounds, and end-of-day neutrality within 0.01 tolerance.
- **Resilient Persistence**: MongoDB with Mongoose persists scenarios and optimization telemetry asynchronously without blocking or delaying critical-path API responses.

---

## 2. Supported Directives

The platform implements the exact 6 directive types specified in Section 04 of the Problem Statement:

1. `solar_reduction`: `{"hours": [...], "factor": number}`
2. `minimum_battery_reserve`: `{"hours": [...], "minimum_energy_kwh": number}`
3. `no_charge_window`: `{"hours": [...]}`
4. `no_discharge_window`: `{"hours": [...]}`
5. `max_grid_window`: `{"hours": [...], "max_grid_kwh": number}`
6. `no_op`: `structured_adjustment = null`, `applies = false`

Time windows use whole-hour intervals with inclusive start and exclusive end (e.g. 1 PM to 3 PM maps to `[13, 14]`).

---

## 3. Environment Variables

### Backend Configuration
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Optional | `8000` | HTTP port for the backend API |
| `MONGODB_URI` | Optional | `mongodb://127.0.0.1:27017/bup_energy` | MongoDB connection string |
| `GEMINI_API_KEY` | Recommended | `""` | Gemini API Key for operator note interpretation. If omitted, the system falls back to `MockLLMProvider` for deterministic testing. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Gemini model identifier |

### Frontend Configuration
| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Optional | `http://localhost:8000` | Base URL of the backend API service |

---

## 4. Quickstart Guide (Local Development)

### Prerequisites
- Node.js >= 18 (Node 20 or 22 recommended)
- npm >= 9
- (Optional) MongoDB running locally on port 27017

### 1. Clone & Setup
```bash
git clone <repository-url>
cd bup-cse-fest-2026-energy-optimizer
```

### 2. Backend Setup & Run
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY if testing with live Gemini models

npm run dev
# The backend will start on http://0.0.0.0:8000
```

### 3. Frontend Setup & Run (Optional Dashboard)
```bash
cd ../frontend
npm install
npm run dev
# The frontend dashboard will start on http://localhost:3000
```

---

## 5. Automated Tests

The backend includes a comprehensive 33-test suite covering all 17 cases specified in Section 23 of the challenge instructions:

```bash
cd backend
npm test
```

Test coverage includes:
- Pure Simplex Linear Programming solver unit tests
- 24-hour battery scheduling and neutrality unit tests
- Zod request and directive guardrail validation
- Independent schedule replay validator (rejecting energy balance and bounds violations)
- End-to-end API integration tests for `/health` and `/optimize-energy`
- No-op distractors, solar reductions, minimum reserve, charge/discharge windows, and grid caps
- Paraphrased operator notes, boundary hours (0 and 23), and error handling

---

## 6. Docker & Container Deployment

### Run Full Stack with Docker Compose
```bash
docker-compose up --build
```
Services exposed:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- MongoDB: `localhost:27017`

### Build & Run Backend Standalone Container
```bash
docker build -t bup-energy-backend:latest ./backend
docker run -p 8000:8000 -e GEMINI_API_KEY="your-gemini-key" bup-energy-backend:latest
```

---

## 7. API Verification & Curl Examples

### Health Check
```bash
curl -s http://localhost:8000/health
```

Expected Response (HTTP 200):
```json
{
  "status": "ok"
}
```

### Energy Optimization Request (Canonical Problem Statement Benchmark)
```bash
curl -X POST http://localhost:8000/optimize-energy \
  -H "Content-Type: application/json" \
  -d '{
    "scenario_id": "GRID-101",
    "operator_notes": [
      "Solar output will drop to about 20% from 1 PM to 3 PM.",
      "Do not charge the battery between 2 PM and 4 PM.",
      "The cafeteria menu changes tomorrow."
    ],
    "hours": [
      {"hour": 0, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 1, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 2, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 3, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 4, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 5, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 5},
      {"hour": 6, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 7},
      {"hour": 7, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 7},
      {"hour": 8, "demand_kwh": 220, "solar_kwh": 0, "tariff_bdt_per_kwh": 7},
      {"hour": 9, "demand_kwh": 220, "solar_kwh": 140, "tariff_bdt_per_kwh": 7},
      {"hour": 10, "demand_kwh": 220, "solar_kwh": 165, "tariff_bdt_per_kwh": 7},
      {"hour": 11, "demand_kwh": 220, "solar_kwh": 190, "tariff_bdt_per_kwh": 7},
      {"hour": 12, "demand_kwh": 220, "solar_kwh": 215, "tariff_bdt_per_kwh": 7},
      {"hour": 13, "demand_kwh": 220, "solar_kwh": 190, "tariff_bdt_per_kwh": 7},
      {"hour": 14, "demand_kwh": 220, "solar_kwh": 165, "tariff_bdt_per_kwh": 7},
      {"hour": 15, "demand_kwh": 220, "solar_kwh": 140, "tariff_bdt_per_kwh": 7},
      {"hour": 16, "demand_kwh": 220, "solar_kwh": 0, "tariff_bdt_per_kwh": 7},
      {"hour": 17, "demand_kwh": 220, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 18, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 19, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 20, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 21, "demand_kwh": 180, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 22, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 14.5},
      {"hour": 23, "demand_kwh": 120, "solar_kwh": 0, "tariff_bdt_per_kwh": 7}
    ],
    "battery": {
      "capacity_kwh": 500,
      "initial_energy_kwh": 200,
      "minimum_energy_kwh": 50,
      "max_charge_kwh_per_hour": 100,
      "max_discharge_kwh_per_hour": 100
    }
  }'
```

Expected Response Format:
```json
{
  "scenario_id": "GRID-101",
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": {
        "hours": [13, 14],
        "factor": 0.2
      },
      "explanation": "Solar availability is reduced during the maintenance window."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": {
        "hours": [14, 15]
      },
      "explanation": "Battery charging restricted during specified hours."
    },
    {
      "note_index": 2,
      "applies": false,
      "directive_type": "no_op",
      "structured_adjustment": null,
      "explanation": "The note does not affect the 24-hour campus energy schedule."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 120,
      "solar_used_kwh": 0,
      "battery_action": "idle",
      "battery_kwh": 0,
      "battery_energy_after_kwh": 200
    }
  ],
  "total_grid_kwh": 2984,
  "total_cost_bdt": 26978,
  "peak_grid_kwh": 220,
  "plan_summary": "Optimization completed for scenario GRID-101. Applied 2 active directives (solar_reduction, no_charge_window). Total grid energy import is 2984.00 kWh with a peak grid demand of 220.00 kWh. Total electricity cost is 26978.00 BDT. Battery storage charged 200.00 kWh and discharged 200.00 kWh, maintaining end-of-day neutrality at 200.00 kWh."
}
```

---

## 8. Credits & Dependencies

- **Node.js & Express**: Core HTTP API server.
- **TypeScript**: Strict type safety across backend and frontend.
- **Google Gen AI SDK (`@google/genai`)**: Fast inference engine for natural language operator note interpretation via Google Gemini.
- **Zod**: Deterministic runtime schema guardrails.
- **Next.js & Tailwind CSS**: Modern App Router operator dashboard.
- **Lucide React**: Clean SVG iconography.
- **Vitest & Supertest**: Robust automated test framework.
