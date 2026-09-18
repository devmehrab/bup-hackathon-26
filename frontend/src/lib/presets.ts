import { ScenarioPreset } from '../types/energy';

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'grid-101',
    title: 'GRID-101: Official Challenge Benchmark',
    description: 'Solar reduction (1 PM - 3 PM), No-charge window (2 PM - 4 PM), and Cafeteria distractor note.',
    scenario_id: 'GRID-101',
    operator_notes: [
      'Solar output will drop to about 20% from 1 PM to 3 PM.',
      'Do not charge the battery between 2 PM and 4 PM.',
      'The cafeteria menu changes tomorrow.'
    ],
    battery: {
      capacity_kwh: 500,
      initial_energy_kwh: 200,
      minimum_energy_kwh: 50,
      max_charge_kwh_per_hour: 100,
      max_discharge_kwh_per_hour: 100
    },
    generateHours: () => {
      return Array.from({ length: 24 }, (_, h) => {
        let demand = 120;
        let solar = 0;
        let tariff = 7.0;

        if (h >= 8 && h <= 17) demand = 220;
        if (h >= 18 && h <= 21) demand = 180;

        if (h >= 9 && h <= 15) {
          const peakDist = 3 - Math.abs(h - 12);
          solar = Math.max(0, 140 + peakDist * 25);
        }

        if (h >= 17 && h <= 22) {
          tariff = 14.5;
        } else if (h >= 0 && h <= 5) {
          tariff = 5.0;
        }

        return {
          hour: h,
          demand_kwh: demand,
          solar_kwh: solar,
          tariff_bdt_per_kwh: tariff
        };
      });
    }
  },
  {
    id: 'grid-102',
    title: 'GRID-102: Reserve & Substation Capping',
    description: 'Minimum 120 kWh battery reserve for evening event plus 90 kWh grid limit during substation repairs.',
    scenario_id: 'GRID-102',
    operator_notes: [
      'Keep at least 120 kWh in reserve from 6 PM until 9 PM.',
      'Grid import may not exceed 90 kWh between 2 PM and 4 PM.'
    ],
    battery: {
      capacity_kwh: 600,
      initial_energy_kwh: 250,
      minimum_energy_kwh: 60,
      max_charge_kwh_per_hour: 120,
      max_discharge_kwh_per_hour: 120
    },
    generateHours: () => {
      return Array.from({ length: 24 }, (_, h) => {
        const demand = (h >= 9 && h <= 18) ? 200 : 110;
        const solar = (h >= 8 && h <= 16) ? 100 : 0;
        const tariff = (h >= 18 && h <= 22) ? 15.0 : 6.5;
        return {
          hour: h,
          demand_kwh: demand,
          solar_kwh: solar,
          tariff_bdt_per_kwh: tariff
        };
      });
    }
  },
  {
    id: 'grid-103',
    title: 'GRID-103: Extreme Solar & Arbitrage',
    description: 'High daytime solar output charging the storage system, discharging during severe evening tariff spikes.',
    scenario_id: 'GRID-103',
    operator_notes: [
      'PV production will drop to about 20% between 13:00 and 15:00.',
      'Do not discharge the battery between 2 PM and 4 PM.'
    ],
    battery: {
      capacity_kwh: 800,
      initial_energy_kwh: 300,
      minimum_energy_kwh: 80,
      max_charge_kwh_per_hour: 200,
      max_discharge_kwh_per_hour: 200
    },
    generateHours: () => {
      return Array.from({ length: 24 }, (_, h) => {
        const demand = 160;
        const solar = (h >= 9 && h <= 15) ? 280 : 0;
        const tariff = (h >= 17 && h <= 21) ? 18.0 : 6.0;
        return {
          hour: h,
          demand_kwh: demand,
          solar_kwh: solar,
          tariff_bdt_per_kwh: tariff
        };
      });
    }
  }
];
