import { Temporal } from '@js-temporal/polyfill';
import type { CalculationContext, PlainMonthDayRange } from './types.js';
import {
  calculateNewDateRanges,
  calculateNewMonthDayRanges,
  intersectDateRangeWithMonthDayRange,
  splitMonthDayRangeForNonLeapYear,
} from './utils/range-ops.js';

/**
 * Defines the contract for all constraints that can be applied to a `BirthdayRange` calculation.
 */
export interface Constraint {
  /**
   * A unique identifier for the constraint (e.g., 'year', 'age').
   */
  readonly id: string;
  /**
   * A preliminary step that runs before the main `apply` logic.
   * It's typically used to populate the initial context with raw values.
   * @param ctx The current calculation context.
   */
  prepareContext(ctx: CalculationContext): void;
  /**
   * The main logic for the constraint. It takes the current context,
   * applies its filtering logic, and returns a new, updated context.
   * @param ctx The current calculation context.
   * @returns The updated calculation context after applying the constraint.
   */
  apply(ctx: CalculationContext): CalculationContext;
}

/**
 * An abstract base class that provides a default implementation for the `Constraint` interface.
 * Custom constraints should extend this class for convenience.
 */
export abstract class BaseConstraint implements Constraint {
  readonly id: string;
  constructor(id: string) {
    this.id = id;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prepareContext(ctx: CalculationContext): void {}
  abstract apply(ctx: CalculationContext): CalculationContext;
}

/**
 * A constraint that restricts birthdays to a specific year.
 */
export class YearConstraint extends BaseConstraint {
  constructor(private year: number) {
    super('year');
  }
  prepareContext(ctx: CalculationContext): void {
    ctx.year = this.year;
  }
  apply(ctx: CalculationContext): CalculationContext {
    const dr = {
      start: Temporal.PlainDate.from({ year: this.year, month: 1, day: 1 }),
      end: Temporal.PlainDate.from({ year: this.year, month: 12, day: 31 }),
    };
    const dateRanges = calculateNewDateRanges(ctx.dateRanges, [dr]);

    const mdr = {
      start: dr.start.toPlainMonthDay(),
      end: dr.end.toPlainMonthDay(),
    };
    const monthDayRanges = calculateNewMonthDayRanges(ctx.monthDayRanges, [
      mdr,
    ]);

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}

/**
 * A constraint that restricts birthdays based on a person's age as of a certain date.
 */
export class AgeConstraint extends BaseConstraint {
  constructor(
    private age: number,
    private asOfDate?: Temporal.PlainDate | string
  ) {
    super('age');

    if (this.age < 0) {
      throw new Error('Age cannot be negative');
    }
  }
  prepareContext(ctx: CalculationContext): void {
    ctx.age = this.age;
    ctx.asOfDate = this.asOfDate
      ? Temporal.PlainDate.from(this.asOfDate)
      : Temporal.Now.plainDateISO();
  }
  apply(ctx: CalculationContext): CalculationContext {
    const dr = {
      start: ctx.asOfDate!.subtract({ years: this.age + 1 }).add({ days: 1 }),
      end: ctx.asOfDate!.subtract({ years: this.age }),
    };

    const dateRanges = calculateNewDateRanges(ctx.dateRanges, [dr]);

    const mdr = dateRanges.map((r) => ({
      start: r.start.toPlainMonthDay(),
      end: r.end.toPlainMonthDay(),
    }));
    const monthDayRanges = calculateNewMonthDayRanges(ctx.monthDayRanges, mdr);

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}

/**
 * A constraint that filters for birthdays that fall in a leap year or not.
 */
export class IsLeapYearConstraint extends BaseConstraint {
  constructor(private isLeapYear: boolean) {
    super('isLeapYear');
  }
  prepareContext(ctx: CalculationContext): void {
    ctx.isLeapYear = this.isLeapYear;
  }
  apply(ctx: CalculationContext): CalculationContext {
    if (ctx.dateRanges === null && ctx.monthDayRanges === null) {
      return { ...ctx, isLeapYear: this.isLeapYear };
    }

    // Should I create a range for Feb 29 only?
    const leapYearMonthDay = Temporal.PlainMonthDay.from({ month: 2, day: 29 });

    let dateRanges = ctx.dateRanges;
    if (dateRanges !== null) {
      dateRanges = dateRanges.filter((dr) => {
        // Incoming date range should be already splited by year, i.e. dr.start.year === dr.end.year
        const calcIsLeapYear =
          leapYearMonthDay.toPlainDate({ year: dr.start.year }).day === 29;
        return calcIsLeapYear === this.isLeapYear;
      });
    }

    let monthDayRanges = ctx.monthDayRanges;
    if (monthDayRanges !== null && this.isLeapYear === false) {
      // If isLeapYear is false (i.e., no Feb 29), split ranges that include Feb 29
      monthDayRanges = monthDayRanges.flatMap((mdr) => {
        return splitMonthDayRangeForNonLeapYear(mdr);
      });
    }

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}

/**
 * A constraint that restricts birthdays to a specific month.
 */
export class MonthConstraint extends BaseConstraint {
  constructor(private month: number) {
    super('month');

    if (this.month < 1 || this.month > 12) {
      throw new Error('Invalid month');
    }
  }
  prepareContext(ctx: CalculationContext): void {
    ctx.month = this.month;
  }
  apply(ctx: CalculationContext): CalculationContext {
    const mdr = {
      start: Temporal.PlainMonthDay.from({ month: this.month, day: 1 }),
      end: Temporal.PlainMonthDay.from({
        month: this.month,
        day: 31, // auto adjust
      }),
    };

    const monthDayRanges = calculateNewMonthDayRanges(ctx.monthDayRanges, [
      mdr,
    ]);

    if (ctx.dateRanges === null) {
      return {
        ...ctx,
        monthDayRanges,
      };
    }

    const dateRanges = intersectDateRangeWithMonthDayRange(ctx.dateRanges, [
      mdr,
    ]);

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}

import {
  getZodiacDateRange,
  getZodiacSign,
  ZodiacSign,
} from 'zodiac-mapper';

/**
 * A constraint that restricts birthdays to a specific zodiac sign.
 */
export class ZodiacConstraint extends BaseConstraint {
  private zodiacSign: ZodiacSign;
  constructor(private zodiac: string) {
    super('zodiac');

    const sign = getZodiacSign(zodiac);
    if (sign === null) {
      throw new Error(`Invalid zodiac sign: ${zodiac}`);
    }
    this.zodiacSign = sign;
  }

  prepareContext(ctx: CalculationContext): void {
    ctx.zodiac = this.zodiac;
  }
  apply(ctx: CalculationContext): CalculationContext {
    const zodiacDateRange = getZodiacDateRange(this.zodiacSign);

    let mdr: PlainMonthDayRange[];

    if (zodiacDateRange.crossesYear) {
      mdr = [
        {
          start: Temporal.PlainMonthDay.from(zodiacDateRange.start),
          end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
        },
        {
          start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
          end: Temporal.PlainMonthDay.from(zodiacDateRange.end),
        },
      ];
    } else {
      mdr = [
        {
          start: Temporal.PlainMonthDay.from(zodiacDateRange.start),
          end: Temporal.PlainMonthDay.from(zodiacDateRange.end),
        },
      ];
    }

    const monthDayRanges = calculateNewMonthDayRanges(ctx.monthDayRanges, mdr);

    if (ctx.dateRanges === null) {
      return {
        ...ctx,
        monthDayRanges,
      };
    }

    const dateRanges = intersectDateRangeWithMonthDayRange(ctx.dateRanges, mdr);

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}

/**
 * A constraint that restricts birthdays to a specific day of the month.
 */
export class DayConstraint extends BaseConstraint {
  constructor(private day: number) {
    super('day');

    if (this.day < 1 || this.day > 31) {
      throw new Error('Invalid day');
    }
  }
  prepareContext(ctx: CalculationContext): void {
    ctx.day = this.day;
  }
  apply(ctx: CalculationContext): CalculationContext {
    const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const mdrs = MONTHS.map((month) => {
      const md = Temporal.PlainMonthDay.from({ month: month, day: this.day });
      const mdr = { start: md, end: md };
      return mdr;
    }).filter((mdr) => mdr.start.day === this.day); // prevent auto adjust

    const monthDayRanges = calculateNewMonthDayRanges(ctx.monthDayRanges, mdrs);

    if (ctx.dateRanges === null) {
      return {
        ...ctx,
        monthDayRanges,
      };
    }

    const dateRanges = intersectDateRangeWithMonthDayRange(
      ctx.dateRanges,
      mdrs
    ).filter(
      (dr) =>
        // handle input 29 for Feb returns 28 for non-leap year
        this.day === dr.start.day && this.day === dr.end.day
    );

    return {
      ...ctx,
      dateRanges,
      monthDayRanges,
    };
  }
}
