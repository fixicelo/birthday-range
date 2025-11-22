import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { DayConstraint } from '../../src/constraints.js';
import { CalculationContext } from '../../src/index.js';

const getEmptyContext = (): CalculationContext => ({
  year: null,
  age: null,
  asOfDate: null,
  isLeapYear: null,
  month: null,
  zodiac: null,
  day: null,
  opts: {},
  dateRanges: null,
  monthDayRanges: null,
});

describe('DayConstraint', () => {
  it('should throw for an invalid day', () => {
    expect(() => new DayConstraint(0)).toThrow('Invalid day');
  });

  it('should create month-day ranges for a specified day (e.g., the 15th)', () => {
    const context = getEmptyContext();
    const constraint = new DayConstraint(15);

    constraint.prepareContext(context);
    expect(context.day).toBe(15);

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges?.length).toBe(12);
    expect(resultContext.monthDayRanges?.[0]).toEqual({
      start: Temporal.PlainMonthDay.from({ month: 1, day: 15 }),
      end: Temporal.PlainMonthDay.from({ month: 1, day: 15 }),
    });
  });

  it('should handle day 29', () => {
    const context = getEmptyContext();
    const constraint = new DayConstraint(29);
    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);
    // `PlainMonthDay` is not year-aware, so Feb 29 is always considered valid.
    // It exists in all 12 months in this context.
    expect(resultContext.monthDayRanges?.length).toBe(12);
  });

  it('should handle day 30', () => {
    const context = getEmptyContext();
    const constraint = new DayConstraint(30);
    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);
    // Should not include February
    expect(resultContext.monthDayRanges?.length).toBe(11);
  });

  it('should handle a day that does not exist in some months (e.g., the 31st)', () => {
    const context = getEmptyContext();
    const constraint = new DayConstraint(31);

    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);

    // Should only generate ranges for months that actually have 31 days (Jan, Mar, May, Jul, Aug, Oct, Dec).
    expect(resultContext.monthDayRanges?.length).toBe(7);
  });
});
