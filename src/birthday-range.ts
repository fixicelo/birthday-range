import { Temporal } from 'temporal-polyfill';
import { calculate } from './calculator.js';
import {
  AgeConstraint,
  Constraint,
  DayConstraint,
  IsLeapYearConstraint,
  MonthConstraint,
  YearConstraint,
  ZodiacConstraint,
} from './constraints.js';
import type {
  BirthdayRangeOptions,
  CalculationContext,
  CalculationResult,
} from './types.js';

/**
 * A builder class for calculating possible birthday date ranges.
 * Instances of this class are **immutable**. Each constraint method returns a new `BirthdayRange` instance.
 */
export default class BirthdayRange {
  private readonly constraints: readonly Constraint[];

  /**
   * The execution order of standard constraints.
   * Year and age constraints are applied first to establish the date ranges, and restricting constraints follow.
   * @internal
   */
  private readonly executionOrder = [
    'year',
    'age',
    'month',
    'zodiac',
    'day',
    'isLeapYear',
  ];

  constructor();
  constructor(options: BirthdayRangeOptions);
  constructor(constraints: readonly Constraint[]);
  constructor(arg?: BirthdayRangeOptions | readonly Constraint[]) {
    let constraints: Constraint[] = [];
    if (!arg) {
      // Handles new BirthdayRange()
    } else if (Array.isArray(arg)) {
      // Handles new BirthdayRange(constraints)
      constraints = [...arg];
    } else {
      // Handle new BirthdayRange(options)
      const options = arg as BirthdayRangeOptions;
      if (options.year !== undefined) {
        constraints.push(new YearConstraint(options.year));
      }
      if (options.age !== undefined) {
        if (
          typeof options.age === 'number' ||
          typeof options.age === 'string'
        ) {
          constraints.push(new AgeConstraint(options.age));
        } else {
          constraints.push(
            new AgeConstraint(options.age.value, options.age.asOfDate)
          );
        }
      }
      if (options.month !== undefined) {
        constraints.push(new MonthConstraint(options.month));
      }
      if (options.day !== undefined) {
        constraints.push(new DayConstraint(options.day));
      }
      if (options.zodiac !== undefined) {
        constraints.push(new ZodiacConstraint(options.zodiac));
      }
      if (options.isLeapYear !== undefined) {
        constraints.push(new IsLeapYearConstraint(options.isLeapYear));
      }
    }
    this.constraints = constraints;
  }

  /**
   * Returns a new `BirthdayRange` instance with an added constraint.
   * @param constraint The constraint to add.
   * @internal
   */
  private addConstraint(constraint: Constraint): BirthdayRange {
    return new BirthdayRange([...this.constraints, constraint]);
  }

  /**
   * Restricts birthdays to a specific year.
   * @param year The year to filter by.
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  year(year: number | string): BirthdayRange {
    return this.addConstraint(new YearConstraint(year));
  }

  /**
   * Restricts birthdays based on age.
   * @param age The age to filter by.
   * @param opts Options for the age calculation.
   * @param opts.asOfDate The date to calculate the age from. Defaults to the current date if not provided.
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  age(
    age: number | string,
    opts?: { asOfDate?: string | Temporal.PlainDate }
  ): BirthdayRange {
    return this.addConstraint(new AgeConstraint(age, opts?.asOfDate));
  }

  /**
   * Restricts birthdays to a specific month.
   * @param month The month number (1-12).
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  month(month: number | string): BirthdayRange {
    return this.addConstraint(new MonthConstraint(month));
  }

  /**
   * Restricts birthdays to a specific day of the month.
   * @param day The day number (1-31).
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  day(day: number | string): BirthdayRange {
    return this.addConstraint(new DayConstraint(day));
  }

  /**
   * Restricts birthdays to a specific zodiac sign.
   * @param sign The zodiac sign (case-insensitive).
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  zodiac(sign: string): BirthdayRange {
    return this.addConstraint(new ZodiacConstraint(sign));
  }

  /**
   * Filters for birthdays that fall in a leap year or not.
   * @param isLeapYear `true` to only include leap years, `false` to exclude them.
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  isLeapYear(isLeapYear: boolean): BirthdayRange {
    return this.addConstraint(new IsLeapYearConstraint(isLeapYear));
  }

  /**
   * Adds a custom-defined constraint to the calculation.
   * @param constraint An object that implements the `Constraint` interface.
   * @returns A new `BirthdayRange` instance with the added constraint.
   */
  add(constraint: Constraint): BirthdayRange {
    const newInstance = this.addConstraint(constraint);
    // Also add the new constraint's ID to the run sequence if it's not a standard one
    if (!this.executionOrder.includes(constraint.id)) {
      (newInstance.executionOrder as string[]).push(constraint.id);
    }
    return newInstance;
  }

  /**
   * Retrieves the current calculation context.
   * This method runs the `prepareContext` step for all constraints to populate the context
   * with the input parameters. Note that `dateRanges` and `monthDayRanges` will be null
   * at this stage, as they are only computed by the `calc()` method.
   * @returns The full calculation context.
   */
  getContext(): CalculationContext {
    const context: CalculationContext = {
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
    };

    for (const c of this.constraints) {
      c.prepareContext(context);
    }

    return context;
  }

  /**
   * Executes all the chained constraints and returns the final calculated ranges.
   * @returns A {@link CalculationResult} object containing the possible date and month-day ranges.
   */
  calc(): CalculationResult {
    return calculate(this.constraints, this.executionOrder);
  }
}
