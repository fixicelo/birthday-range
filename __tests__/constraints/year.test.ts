import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { YearConstraint } from '../../src/constraints.js';
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

describe('YearConstraint', () => {
  it('should set the year and create a full year date range for a leap year', () => {
    const context = getEmptyContext();
    const constraint = new YearConstraint(2000); // A leap year

    constraint.prepareContext(context);
    expect(context.year).toBe(2000);

    const resultContext = constraint.apply(context);
    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2000-01-01'),
        end: Temporal.PlainDate.from('2000-12-31'),
      },
    ]);
  });

  it('should set the year and create a full year date range for a non-leap year', () => {
    const context = getEmptyContext();
    const constraint = new YearConstraint(2001); // A non-leap year

    constraint.prepareContext(context);
    expect(context.year).toBe(2001);

    const resultContext = constraint.apply(context);
    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2001-01-01'),
        end: Temporal.PlainDate.from('2001-12-31'),
      },
    ]);
  });
});
