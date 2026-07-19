import { describe, it, expect } from 'vitest';
import { Temporal } from 'temporal-polyfill';
import { IsLeapYearConstraint } from '../../src/constraints.js';
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

describe('IsLeapYearConstraint', () => {
  it('should return no ranges if only isLeapYear is set', () => {
    const context = getEmptyContext();
    const constraint = new IsLeapYearConstraint(true);

    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);

    expect(resultContext.isLeapYear).toBe(true);
    expect(resultContext.dateRanges).toBeNull();
    expect(resultContext.monthDayRanges).toBeNull();
  });

  it('should filter date ranges to only include leap years', () => {
    const context = getEmptyContext();
    context.dateRanges = [
      // A non-leap year
      {
        start: Temporal.PlainDate.from('2001-01-01'),
        end: Temporal.PlainDate.from('2001-12-31'),
      },
      // A leap year
      {
        start: Temporal.PlainDate.from('2000-01-01'),
        end: Temporal.PlainDate.from('2000-12-31'),
      },
    ];
    const constraint = new IsLeapYearConstraint(true);

    constraint.prepareContext(context);
    expect(context.isLeapYear).toBe(true);

    const resultContext = constraint.apply(context);
    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2000-01-01'),
        end: Temporal.PlainDate.from('2000-12-31'),
      },
    ]);
  });

  it('should filter date ranges to exclude leap years', () => {
    const context = getEmptyContext();
    context.dateRanges = [
      // A non-leap year
      {
        start: Temporal.PlainDate.from('2001-01-01'),
        end: Temporal.PlainDate.from('2001-12-31'),
      },
      // A leap year
      {
        start: Temporal.PlainDate.from('2000-01-01'),
        end: Temporal.PlainDate.from('2000-12-31'),
      },
    ];
    const constraint = new IsLeapYearConstraint(false);

    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);
    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2001-01-01'),
        end: Temporal.PlainDate.from('2001-12-31'),
      },
    ]);
  });

  it('should not change month-day ranges when isLeapYear is true', () => {
    const context = getEmptyContext();
    context.monthDayRanges = [
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 15 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 15 }),
      },
    ];
    const constraint = new IsLeapYearConstraint(true);
    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual(context.monthDayRanges);
  });

  it('should split month-day ranges crossing Feb 29 when isLeapYear is false', () => {
    const context = getEmptyContext();
    context.monthDayRanges = [
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 15 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 15 }),
      },
    ];
    const constraint = new IsLeapYearConstraint(false);
    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 15 }),
        end: Temporal.PlainMonthDay.from({ month: 2, day: 28 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 3, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 15 }),
      },
    ]);
  });
});
