import { describe, it, expect } from 'vitest';
import { Temporal } from 'temporal-polyfill';
import { ZodiacConstraint } from '../../src/constraints.js';
import type { CalculationContext } from '../../src/types.js';

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

describe('ZodiacConstraint', () => {
  it('should create correct month-day range for an English sign (Aries)', () => {
    const context = getEmptyContext();
    const constraint = new ZodiacConstraint('Aries');

    constraint.prepareContext(context);
    expect(context.zodiac).toBe('Aries');

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 3, day: 21 }),
        end: Temporal.PlainMonthDay.from({ month: 4, day: 19 }),
      },
    ]);
  });

  it('should create correct month-day ranges for an English cross-year sign (Capricorn)', () => {
    const context = getEmptyContext();
    const constraint = new ZodiacConstraint('capricorn');

    constraint.prepareContext(context);
    expect(context.zodiac).toBe('capricorn');

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 12, day: 22 }),
        end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 1, day: 19 }),
      },
    ]);
  });

  it('should create correct month-day range for a French sign (Taureau)', () => {
    const context = getEmptyContext();
    const constraint = new ZodiacConstraint('Taureau'); // French for Taurus

    constraint.prepareContext(context);
    expect(context.zodiac).toBe('Taureau');

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 4, day: 20 }),
        end: Temporal.PlainMonthDay.from({ month: 5, day: 20 }),
      },
    ]);
  });

  it('should create correct month-day ranges for a German cross-year sign (Steinbock)', () => {
    const context = getEmptyContext();
    const constraint = new ZodiacConstraint('Steinbock'); // German for Capricorn

    constraint.prepareContext(context);
    expect(context.zodiac).toBe('Steinbock');

    const resultContext = constraint.apply(context);
    expect(resultContext.monthDayRanges).toEqual([
      {
        start: Temporal.PlainMonthDay.from({ month: 12, day: 22 }),
        end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 1, day: 19 }),
      },
    ]);
  });

  it('should throw an error for an invalid zodiac sign from constructor', () => {
    expect(() => new ZodiacConstraint('Ophiuchus')).toThrow(
      'Invalid zodiac sign: Ophiuchus'
    );
  });
});
