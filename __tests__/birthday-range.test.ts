import { describe, it, expect } from 'vitest';
import { Temporal } from 'temporal-polyfill';
import BirthdayRange, { BaseConstraint } from '../src/index.js';
import { YearConstraint } from '../src/constraints.js';
import type { CalculationContext } from '../src/types.js';

describe('BirthdayRange Builder', () => {
  it('should return the current context via getContext()', () => {
    const builder = new BirthdayRange()
      .year(2000)
      .month(5)
      .age(20, { asOfDate: '2020-01-01' });

    const context = builder.getContext();

    expect(context.year).toBe(2000);
    expect(context.month).toBe(5);
    expect(context.age).toBe(20);
    expect(context.asOfDate).toEqual(Temporal.PlainDate.from('2020-01-01'));
    expect(context.dateRanges).toBeNull();
  });

  it('should handle a simple year and month query', () => {
    // Year 2001 (non-leap) and May
    const result = new BirthdayRange().year(2001).month(5).calc();
    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2001-05-01'),
        end: Temporal.PlainDate.from('2001-05-31'),
      },
    ]);
  });

  it('should handle contradictory constraints, resulting in an empty set', () => {
    // 2001 is not a leap year, but we constrain to leap years.
    const result = new BirthdayRange().year(2001).isLeapYear(true).calc();
    expect(result.dateRanges).toEqual([]);
  });

  it('should correctly calculate age within a specific year', () => {
    // For someone to be 20 as of Jan 1, 2020, they must be born between Jan 2, 1999 and Jan 1, 2000.
    // If we constrain the year to 1999, the result should be Jan 2, 1999 to Dec 31, 1999.
    const result = new BirthdayRange()
      .year(1999)
      .age(20, { asOfDate: '2020-01-01' })
      .calc();

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1999-01-02'),
        end: Temporal.PlainDate.from('1999-12-31'),
      },
    ]);
  });

  it('should handle zodiac signs that cross year boundaries (Capricorn) in a given year', () => {
    const result = new BirthdayRange().year(2001).zodiac('Capricorn').calc();

    // Capricorn in 2001 spans Jan 1-19, 2001 and Dec 22-31, 2001
    expect(result.dateRanges).toEqual(
      expect.arrayContaining([
        {
          start: Temporal.PlainDate.from('2001-01-01'),
          end: Temporal.PlainDate.from('2001-01-19'),
        },
        {
          start: Temporal.PlainDate.from('2001-12-22'),
          end: Temporal.PlainDate.from('2001-12-31'),
        },
      ])
    );
    expect(result.dateRanges?.length).toBe(2);
  });

  it('should handle day(29) in a non-leap year (2001)', () => {
    const result = new BirthdayRange().year(2001).day(29).calc();
    expect(result.dateRanges?.length).toBe(11); // No Feb 29
  });

  it('should handle day(29) in a leap year (2000)', () => {
    const result = new BirthdayRange().year(2000).day(29).calc();
    expect(result.dateRanges?.length).toBe(12); // Including Feb 29
    expect(result.dateRanges).toEqual(
      expect.arrayContaining([
        {
          start: Temporal.PlainDate.from('2000-02-29'),
          end: Temporal.PlainDate.from('2000-02-29'),
        },
      ])
    );
  });

  it('should handle a complex chain of constraints', () => {
    // Find people who are 24 as of Jan 1, 2020, are a Pisces, and have a leap year birthday.
    // Age 24 as of 2020-01-01 -> born between 1995-01-02 and 1996-01-01.
    // The only leap year in that range is 1996.
    // Pisces is Feb 19 - Mar 20.
    // So, we are looking for Pisces birthdays in 1996.
    const result = new BirthdayRange()
      .age(24, { asOfDate: '2020-01-01' })
      .zodiac('pisces')
      .isLeapYear(true)
      .calc();

    // The intersection of the age range (ending 1996-01-01) and the zodiac range in 1996 (starting 1996-02-19) is empty.
    expect(result.dateRanges).toEqual([]);
  });

  it('should correctly find a complex chain of constraints', () => {
    // Find people who are 24 as of Apr 1, 2020, are a Pisces, and have a leap year birthday.
    // Age 24 as of 2020-04-01 -> born between 1995-04-02 and 1996-04-01.
    // The only leap year in that range is 1996.
    // Pisces is Feb 19 - Mar 20.
    // So, we are looking for Pisces birthdays in 1996.
    const result = new BirthdayRange()
      .age(24, { asOfDate: '2020-04-01' })
      .zodiac('pisces')
      .isLeapYear(true)
      .calc();

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1996-02-19'),
        end: Temporal.PlainDate.from('1996-03-20'),
      },
    ]);
  });

  it('should handle age and a cross-year zodiac (capricorn)', () => {
    // Age 1 as of Mar 1, 2001 -> born between Mar 2, 1999 and Mar 1, 2000.
    // Zodiac Capricorn is Dec 22 - Jan 19.
    const result = new BirthdayRange()
      .age(1, { asOfDate: '2001-03-01' })
      .zodiac('capricorn')
      .calc();

    expect(result.dateRanges).toEqual(
      expect.arrayContaining([
        {
          // Dec 22-31 1999
          start: Temporal.PlainDate.from('1999-12-22'),
          end: Temporal.PlainDate.from('1999-12-31'),
        },
        {
          // Jan 1-19 2000
          start: Temporal.PlainDate.from('2000-01-01'),
          end: Temporal.PlainDate.from('2000-01-19'),
        },
      ])
    );
    expect(result.dateRanges?.length).toBe(2);
  });

  it('should return an empty set for month(2).day(29) in a non-leap year', () => {
    const result = new BirthdayRange().year(2001).month(2).day(29).calc();
    expect(result.dateRanges).toEqual([]);
  });

  it('should return a valid range for month(2).day(29) in a leap year', () => {
    const result = new BirthdayRange().year(2000).month(2).day(29).calc();
    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2000-02-29'),
        end: Temporal.PlainDate.from('2000-02-29'),
      },
    ]);
  });

  it('should return an empty set for an invalid date like month(2).day(30)', () => {
    const result = new BirthdayRange().month(2).day(30).calc();
    expect(result.dateRanges).toBeNull(); // No date ranges were ever created
    expect(result.monthDayRanges).toEqual([]); // The day constraint creates an empty set
  });

  it('should register custom constraints added at runtime', () => {
    class CustomConstraint extends BaseConstraint {
      constructor() {
        super('custom');
      }

      apply(ctx: CalculationContext): CalculationContext {
        return {
          ...ctx,
          opts: {
            ...ctx.opts,
            customApplied: true,
          },
        };
      }
    }

    const result = new BirthdayRange().add(new CustomConstraint()).calc();

    expect(result.opts.customApplied).toBe(true);
  });

  it('should not duplicate execution order entries for known ids', () => {
    const result = new BirthdayRange().add(new YearConstraint(1988)).calc();

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1988-01-01'),
        end: Temporal.PlainDate.from('1988-12-31'),
      },
    ]);
  });

  it('should return null ranges if no constraints are given', () => {
    const result = new BirthdayRange().calc();
    expect(result.dateRanges).toBeNull();
    expect(result.monthDayRanges).toBeNull();
  });
});
