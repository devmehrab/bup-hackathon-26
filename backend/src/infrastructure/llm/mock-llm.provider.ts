import { LLMProvider, InterpretationContext } from './llm-provider.interface';
import { DirectiveInterpretation } from '../../modules/optimization/domain/types';

export class MockLLMProvider implements LLMProvider {
  private customResponses: Map<string, DirectiveInterpretation[]> = new Map();

  public setCustomResponse(key: string, interpretations: DirectiveInterpretation[]): void {
    this.customResponses.set(key, interpretations);
  }

  public async interpretOperatorNotes(
    notes: string[],
    _context?: InterpretationContext
  ): Promise<DirectiveInterpretation[]> {
    const key = notes.join('|||');
    if (this.customResponses.has(key)) {
      return this.customResponses.get(key)!;
    }

    const results: DirectiveInterpretation[] = [];

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i].toLowerCase();

      if (
        note.includes('solar') &&
        (note.includes('drop') || note.includes('reduc') || note.includes('one-fifth') || note.includes('cleaning') || note.includes('pv production'))
      ) {
        let factor = 0.2;
        if (note.includes('80% reduction') || note.includes('one-fifth') || note.includes('20%')) {
          factor = 0.2;
        } else if (note.includes('50%')) {
          factor = 0.5;
        } else if (note.includes('zero') || note.includes('0%')) {
          factor = 0.0;
        }

        let hours = [13, 14];
        if (note.includes('1 pm') && note.includes('3 pm')) {
          hours = [13, 14];
        } else if (note.includes('13:00') && note.includes('15:00')) {
          hours = [13, 14];
        } else if (note.includes('10 am') && note.includes('12 pm')) {
          hours = [10, 11];
        }

        results.push({
          note_index: i,
          applies: true,
          directive_type: 'solar_reduction',
          structured_adjustment: {
            hours,
            factor
          },
          explanation: 'Solar availability is reduced during the maintenance window.'
        });
      } else if (
        note.includes('reserve') ||
        note.includes('keep at least')
      ) {
        let hours = [18, 19, 20];
        let reserve = 120;

        const numMatch = note.match(/(\d+)\s*kwh/);
        if (numMatch) {
          reserve = parseFloat(numMatch[1]);
        }

        if (note.includes('6 pm') && note.includes('9 pm')) {
          hours = [18, 19, 20];
        }

        results.push({
          note_index: i,
          applies: true,
          directive_type: 'minimum_battery_reserve',
          structured_adjustment: {
            hours,
            minimum_energy_kwh: reserve
          },
          explanation: 'Battery reserve constraint applied.'
        });
      } else if (
        note.includes('do not charge') ||
        note.includes('no charge') ||
        note.includes('prevent charge') ||
        note.includes('charge is disabled')
      ) {
        let hours = [14, 15];
        if (note.includes('2 pm') && note.includes('4 pm')) {
          hours = [14, 15];
        } else if (note.includes('10 am') && note.includes('12 pm')) {
          hours = [10, 11];
        }

        results.push({
          note_index: i,
          applies: true,
          directive_type: 'no_charge_window',
          structured_adjustment: {
            hours
          },
          explanation: 'Battery charging restricted during specified hours.'
        });
      } else if (
        note.includes('do not discharge') ||
        note.includes('no discharge') ||
        note.includes('prevent discharge') ||
        note.includes('discharge is disabled')
      ) {
        let hours = [14, 15];
        if (note.includes('2 pm') && note.includes('4 pm')) {
          hours = [14, 15];
        } else if (note.includes('18') && note.includes('20')) {
          hours = [18, 19];
        }

        results.push({
          note_index: i,
          applies: true,
          directive_type: 'no_discharge_window',
          structured_adjustment: {
            hours
          },
          explanation: 'Battery discharging restricted during specified hours.'
        });
      } else if (
        note.includes('max grid') ||
        note.includes('grid import may not exceed') ||
        note.includes('cap grid') ||
        note.includes('grid cap') ||
        note.includes('limit grid')
      ) {
        let hours = [14, 15];
        let maxGrid = 100;

        const numMatch = note.match(/(\d+)\s*kwh/);
        if (numMatch) {
          maxGrid = parseFloat(numMatch[1]);
        }

        results.push({
          note_index: i,
          applies: true,
          directive_type: 'max_grid_window',
          structured_adjustment: {
            hours,
            max_grid_kwh: maxGrid
          },
          explanation: 'Grid import capped during specified hours.'
        });
      } else {
        results.push({
          note_index: i,
          applies: false,
          directive_type: 'no_op',
          structured_adjustment: null,
          explanation: 'The note does not affect the 24-hour campus energy schedule.'
        });
      }
    }

    return results;
  }
}
