import { Temporal } from 'temporal-polyfill';

/**
 * Represents a range between two `Temporal.PlainDate` objects.
 */
export type PlainDateRange = {
  start: Temporal.PlainDate;
  end: Temporal.PlainDate;
};

/**
 * Represents a range between two `Temporal.PlainMonthDay` objects.
 */
export type PlainMonthDayRange = {
  start: Temporal.PlainMonthDay;
  end: Temporal.PlainMonthDay;
};

/**
 * The final result object returned by the `calc()` method.
 * It contains all the context and the calculated date and month-day ranges.
 */
export type CalculationResult = {
  /** The specific year constraint, if provided. */
  year: number | null;
  /** The age constraint, if provided. */
  age: number | null;
  /** The date used for age calculation. */
  asOfDate: Temporal.PlainDate | null;
  /** The zodiac sign constraint, if provided. */
  zodiac: string | null;
  /** The month constraint, if provided. */
  month: number | null;
  /** The day constraint, if provided. */
  day: number | null;
  /** The leap year constraint, if provided. */
  isLeapYear: boolean | null;
  /** A record for options from user-defined constraints. */
  opts: Record<string, unknown>;
  /** The final calculated date ranges that satisfy all constraints. */
  dateRanges: PlainDateRange[] | null;
  /** The final calculated month-day ranges that satisfy all constraints. */
  monthDayRanges: PlainMonthDayRange[] | null;
};

/**
 * @internal
 * The internal state used during the calculation process.
 */
export type CalculationContext = CalculationResult;

/**
 * An options object for initializing a `BirthdayRange` with a set of constraints.
 */
export interface BirthdayRangeOptions {
  /** Restricts birthdays to a specific year. */
  year?: number | string;
  /**
   * Restricts birthdays based on age. Can be a number, a string representing a number,
   * or an object with a `value` for the age and an optional `asOfDate`.
   */
  age?:
    | number
    | string
    | { value: number | string; asOfDate?: string | Temporal.PlainDate };
  /** Restricts birthdays to a specific month (1-12). */
  month?: number | string;
  /** Restricts birthdays to a specific day of the month (1-31). */
  day?: number | string;
  /** Restricts birthdays to a specific zodiac sign (case-insensitive). */
  zodiac?: string;
  /** Filters for birthdays that fall in a leap year (`true`) or not (`false`). */
  isLeapYear?: boolean;
}
