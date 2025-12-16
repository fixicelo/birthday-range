import { describe, it, expect } from 'vitest';
import BirthdayRange, {
  BirthdayRangeOptions,
  BaseConstraint,
  CalculationContext,
  PlainMonthDayRange,
  calculateNewMonthDayRanges,
  intersectDateRangeWithMonthDayRange,
  mergeDateRanges,
  calculateAgeRange,
  PlainDateRange,
} from '../src/index.js';
import { Temporal } from '@js-temporal/polyfill';

describe('README Examples', () => {
  it('1. Chainable Builder Pattern', () => {
    // Find all birthdays in February for the year 2000 (a leap year)
    const result = new BirthdayRange().year(2000).month(2).calc();

    // console.log(result.dateRanges);
    // Outputs:
    // [{ start: '2000-02-01', end: '2000-02-29' }]

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2000-02-01'),
        end: Temporal.PlainDate.from('2000-02-29'),
      },
    ]);
  });

  it('2. Constructor with Options', () => {
    const options: BirthdayRangeOptions = {
      year: 2001, // a non-leap year
      month: 2,
    };

    const result = new BirthdayRange(options).calc();

    // console.log(result.dateRanges);
    // Outputs:
    // [{ start: '2001-02-01', end: '2001-02-28' }]

    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('2001-02-01'),
        end: Temporal.PlainDate.from('2001-02-28'),
      },
    ]);
  });

  it('Inspecting context', () => {
    const builder = new BirthdayRange().year(2000).month(5);
    const context = builder.getContext();

    // console.log(context.year); // 2000
    // console.log(context.month); // 5
    // console.log(context.age); // null

    expect(context.year).toBe(2000);
    expect(context.month).toBe(5);
    expect(context.age).toBeNull();
  });

  it('Immutability', () => {
    const initialBuilder = new BirthdayRange().year(2000);
    const mayBuilder = initialBuilder.month(5);
    const juneBuilder = initialBuilder.month(6);

    // initialBuilder is not affected by the subsequent calls.
    // console.log(initialBuilder.calc().year); // 2000
    // console.log(initialBuilder.calc().month); // null
    expect(initialBuilder.calc().year).toBe(2000);
    expect(initialBuilder.calc().month).toBeNull();

    // mayBuilder and juneBuilder are new, independent instances.
    // console.log(mayBuilder.calc().month); // 5
    // console.log(juneBuilder.calc().month); // 6
    expect(mayBuilder.calc().month).toBe(5);
    expect(juneBuilder.calc().month).toBe(6);
  });

  describe('Custom Constraints', () => {
    const QUARTER_RANGES: Record<string, PlainMonthDayRange> = {
      Q1: {
        start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 31 }),
      },
      Q2: {
        start: Temporal.PlainMonthDay.from({ month: 4, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 6, day: 30 }),
      },
      Q3: {
        start: Temporal.PlainMonthDay.from({ month: 7, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 9, day: 30 }),
      },
      Q4: {
        start: Temporal.PlainMonthDay.from({ month: 10, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
      },
    };

    class QuarterConstraint extends BaseConstraint {
      constructor(private quarter: string) {
        super('quarter'); // Unique ID for this constraint
      }

      prepareContext(ctx: CalculationContext): void {
        ctx.opts.quarter = this.quarter;
      }

      apply(ctx: CalculationContext): CalculationContext {
        const quarterRange = QUARTER_RANGES[this.quarter];
        const monthDayRanges = calculateNewMonthDayRanges(
          ctx.monthDayRanges, // based on previous calculations
          [quarterRange] // new ranges for restricting results
        );

        // If we're not working with concrete dates yet (i.e., no year is specified),
        // we only need to update the month-day ranges.
        if (ctx.dateRanges === null) {
          return { ...ctx, monthDayRanges };
        }

        // Handle new date ranges
        const dateRanges = intersectDateRangeWithMonthDayRange(ctx.dateRanges, [
          quarterRange,
        ]);

        return { ...ctx, dateRanges, monthDayRanges };
      }
    }

    it('Using the Custom Constraint', () => {
      const q1 = new BirthdayRange().add(new QuarterConstraint('Q1'));
      // console.log(q1.calc().monthDayRanges);
      // [{"start":"01-01","end":"03-31"}]
      expect(q1.calc().monthDayRanges).toEqual([
        {
          start: Temporal.PlainMonthDay.from('01-01'),
          end: Temporal.PlainMonthDay.from('03-31'),
        },
      ]);

      const q1WithMonth = q1.month(2);
      // console.log(q1WithMonth.calc().monthDayRanges); // Restricted to February
      // [{"start":"02-01","end":"02-29"}]
      expect(q1WithMonth.calc().monthDayRanges).toEqual([
        {
          start: Temporal.PlainMonthDay.from('02-01'),
          end: Temporal.PlainMonthDay.from('02-29'),
        },
      ]);

      // Use a non-leap year (2001)
      const q1WithYear = q1WithMonth.year(2001);
      // console.log(q1WithYear.calc().monthDayRanges);
      // [{"start":"02-01","end":"02-28"}]
      expect(q1WithYear.calc().monthDayRanges).toEqual([
        {
          start: Temporal.PlainMonthDay.from('02-01'),
          end: Temporal.PlainMonthDay.from('02-28'),
        },
      ]);
    });
  });

  it('Utility Functions: mergeDateRanges', () => {
    // Merges [2000-12-16 -> 2000-12-31] and [2001-01-01 -> 2001-12-15]
    const ranges: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2000-12-16'),
        end: Temporal.PlainDate.from('2000-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2001-01-01'),
        end: Temporal.PlainDate.from('2001-12-15'),
      },
    ];
    const merged = mergeDateRanges(ranges);
    // Result: [{ start: '2000-12-16', end: '2001-12-15' }]

    expect(merged).toEqual([
      {
        start: Temporal.PlainDate.from('2000-12-16'),
        end: Temporal.PlainDate.from('2001-12-15'),
      },
    ]);
  });

  it('Utility Functions: calculateAgeRange', () => {
    // Assume we have calculated ranges for someone born in 2000 as of 2023-06-01
    const asOfDate = Temporal.PlainDate.from('2023-06-01');

    // Method 1:
    const result1 = calculateAgeRange({ year: 2000 }, asOfDate);
    expect(result1).toEqual({ min: 22, max: 23 });

    // Method 2:
    const result2 = calculateAgeRange(
      [
        {
          start: Temporal.PlainDate.from('2000-01-01'),
          end: Temporal.PlainDate.from('2000-12-31'),
        },
      ],
      asOfDate
    );
    // Result: { min: 22, max: 23 }
    expect(result2).toEqual({ min: 22, max: 23 });

    // If month/day are omitted, the full range of that year/month is considered.
    const ageRangeFromDate = calculateAgeRange(
      { year: 2000, month: 2 },
      asOfDate
    );
    // Result: { min: 23, max: 23 } (since Feb 2000 is before June 2023)
    expect(ageRangeFromDate).toEqual({ min: 23, max: 23 });
  });
});
