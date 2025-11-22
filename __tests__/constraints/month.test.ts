import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { MonthConstraint } from '../../src/constraints.js';
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

describe('MonthConstraint', () => {
  it('should throw for an invalid month number', () => {
    expect(() => new MonthConstraint(13)).toThrow('Invalid month');
  });

  it('should create a month-day range for a 31-day month (e.g., May)', () => {
    const context = getEmptyContext();
    const constraint = new MonthConstraint(5); // May

    constraint.prepareContext(context);
    expect(context.month).toBe(5);

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 5, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 5, day: 31 }),
      },
    ]);
  });

  it('should create a month-day range for February (defaults to 29 days)', () => {
    const context = getEmptyContext();
    const constraint = new MonthConstraint(2); // February

    constraint.prepareContext(context);
    expect(context.month).toBe(2);

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 2, day: 29 }),
      },
    ]);
  });

  it('should create a month-day range for a 30-day month (e.g., April)', () => {
    const context = getEmptyContext();
    const constraint = new MonthConstraint(4); // April

    constraint.prepareContext(context);
    expect(context.month).toBe(4);

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 4, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 4, day: 30 }),
      },
    ]);
  });
});
