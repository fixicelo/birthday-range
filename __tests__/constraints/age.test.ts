import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { AgeConstraint } from '../../src/constraints.js';
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

describe('AgeConstraint', () => {
  it('should calculate the correct date range for a given age', () => {
    const context = getEmptyContext();
    // For someone to be 20 as of Jan 1, 2020, they must be born between Jan 2, 1999 and Jan 1, 2000.
    const asOfDate = Temporal.PlainDate.from('2020-01-01');
    const constraint = new AgeConstraint(20, asOfDate);

    constraint.prepareContext(context);
    expect(context.age).toBe(20);
    expect(context.asOfDate).toEqual(asOfDate);

    const resultContext = constraint.apply(context);
    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1999-01-02'),
        end: Temporal.PlainDate.from('1999-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2000-01-01'),
        end: Temporal.PlainDate.from('2000-01-01'),
      },
    ]);
  });

  it('should throw an error for a negative age from constructor', () => {
    expect(() => new AgeConstraint(-5)).toThrow(
      'Age must be a non-negative number'
    );
  });

  it('should handle age 0', () => {
    const context = getEmptyContext();
    // For someone to be 0 as of Jan 1, 2020, they must be born between Jan 2, 2019 and Jan 1, 2020..
    const asOfDate = Temporal.PlainDate.from('2020-01-01');
    const constraint = new AgeConstraint(0, asOfDate);

    constraint.prepareContext(context);
    const resultContext = constraint.apply(context);

    expect(resultContext.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2019-01-02'),
        end: Temporal.PlainDate.from('2019-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2020-01-01'),
        end: Temporal.PlainDate.from('2020-01-01'),
      },
    ]);
  });
});
