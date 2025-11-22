import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { calculate } from '../src/calculator.js';
import type { CalculationContext } from '../src/types.js';
import type { Constraint } from '../src/constraints.js';

class LeapDayAdjustmentConstraint implements Constraint {
  readonly id = 'leap-adjust';

  prepareContext(): void {}

  apply(ctx: CalculationContext): CalculationContext {
    const feb29 = Temporal.PlainMonthDay.from({ month: 2, day: 29 });
    // When mapped onto a non-leap year the Temporal API constrains this to Feb 28.
    const adjusted = feb29.toPlainDate({ year: 2001 });

    return {
      ...ctx,
      dateRanges: [
        {
          start: adjusted,
          end: adjusted,
        },
      ],
      monthDayRanges: [
        {
          start: feb29,
          end: feb29,
        },
      ],
    };
  }
}

describe('calculate', () => {
  it('derives month-day ranges from date ranges, preserving Feb 29 -> Feb 28 adjustments', () => {
    const result = calculate(
      [new LeapDayAdjustmentConstraint()],
      ['leap-adjust']
    );

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2001-02-28'),
        end: Temporal.PlainDate.from('2001-02-28'),
      },
    ]);

    expect(result.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 28 }),
        end: Temporal.PlainMonthDay.from({ month: 2, day: 28 }),
      },
    ]);
  });
});
