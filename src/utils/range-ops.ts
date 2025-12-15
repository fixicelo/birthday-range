import { Temporal } from '@js-temporal/polyfill';
import { PlainDateRange, PlainMonthDayRange } from '..';

/**
 * Splits a {@link PlainDateRange} into multiple ranges if it crosses a year boundary.
 * For example, a range from '2023-12-01' to '2024-01-31' will be split into
 * ['2023-12-01' to '2023-12-31'] and ['2024-01-01' to '2024-01-31'].
 *
 * This ensures that each returned range is contained within a single calendar year.
 *
 * @param dr The {@link PlainDateRange} to split.
 * @returns An array of {@link PlainDateRange} objects, none of which cross year boundaries.
 */
export function splitDateRangeCrossingYearEnd(
  dr: PlainDateRange
): PlainDateRange[] {
  const ranges: PlainDateRange[] = [];
  let currentStart = dr.start;

  while (currentStart.year < dr.end.year) {
    const endOfYear = Temporal.PlainDate.from({
      year: currentStart.year,
      month: 12,
      day: 31,
    });
    ranges.push({ start: currentStart, end: endOfYear });
    currentStart = endOfYear.add({ days: 1 });
  }

  ranges.push({ start: currentStart, end: dr.end });

  return ranges;
}

/**
 * Splits a {@link PlainMonthDayRange} into one or two ranges if it crosses a year boundary
 * (i.e., the start month-day is lexicographically after the end month-day, e.g., '12-01' to '01-31').
 * If it crosses, it splits into a range for the end of the year and a range for the beginning of the year.
 * For example, a range from '12-01' to '01-31' will be split into
 * ['12-01' to '12-31'] and ['01-01' to '01-31'].
 *
 * @param mdr The {@link PlainMonthDayRange} to split.
 * @returns An array of {@link PlainMonthDayRange} objects. If the original range crosses a year boundary,
 *   it returns two ranges; otherwise, it returns an array containing the original range.
 */
export function splitMonthDayRangeCrossingYearEnd(
  mdr: PlainMonthDayRange
): PlainMonthDayRange[] {
  // If start is after end when compared lexicographically, it crosses the year boundary
  if (mdr.start.toString() > mdr.end.toString()) {
    return [
      {
        start: mdr.start,
        end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        end: mdr.end,
      },
    ];
  }

  // Otherwise, return the original range in an array
  return [mdr];
}

/**
 * Checks if two {@link PlainDateRange} objects overlap.
 * Ranges are considered overlapping if they share at least one common date.
 *
 * @param r1 The first {@link PlainDateRange}.
 * @param r2 The second {@link PlainDateRange}.
 * @returns `true` if the ranges overlap, `false` otherwise.
 */
export function isDateRangesOverlapping(
  r1: PlainDateRange,
  r2: PlainDateRange
): boolean {
  return (
    Temporal.PlainDate.compare(r1.start, r2.end) <= 0 &&
    Temporal.PlainDate.compare(r2.start, r1.end) <= 0
  );
}

/**
 * Calculates the intersection of two arrays of {@link PlainDateRange} objects.
 * It iterates through all possible pairs of ranges from the two input arrays
 * and finds their overlapping parts.
 *
 * @param r1 The first array of {@link PlainDateRange} objects.
 * @param r2 The second array of {@link PlainDateRange} objects.
 * @returns An array of {@link PlainDateRange} objects representing the intersections.
 *   Returns an empty array if no intersections are found.
 */
export function intersectDateRanges(
  r1: PlainDateRange[],
  r2: PlainDateRange[]
): PlainDateRange[] {
  const results: PlainDateRange[] = [];
  for (const a of r1) {
    for (const b of r2) {
      if (isDateRangesOverlapping(a, b)) {
        const start =
          Temporal.PlainDate.compare(a.start, b.start) > 0 ? a.start : b.start;
        const end =
          Temporal.PlainDate.compare(a.end, b.end) < 0 ? a.end : b.end;
        results.push({ start, end });
      }
    }
  }
  return results;
}

/**
 * Calculates the intersection of two arrays of {@link PlainMonthDayRange} objects.
 * This function handles month-day ranges by converting them to {@link PlainDateRange}
 * using a dummy leap year (2000) to correctly account for February 29th,
 * then performs the intersection, and converts them back to {@link PlainMonthDayRange}.
 * The input ranges should not cross year boundaries; use {@link splitMonthDayRangeCrossingYearEnd}
 *
 * @param r1 The first array of {@link PlainMonthDayRange} objects.
 * @param r2 The second array of {@link PlainMonthDayRange} objects.
 * @returns An array of {@link PlainMonthDayRange} objects representing the intersections.
 *   Returns an empty array if no intersections are found.
 */
export function intersectMonthDayRanges(
  r1: PlainMonthDayRange[],
  r2: PlainMonthDayRange[]
): PlainMonthDayRange[] {
  const results: PlainMonthDayRange[] = [];

  const dummyYear = 2000; // Leap year to handle Feb 29
  const dr1 = r1.map((r) => ({
    start: r.start.toPlainDate({ year: dummyYear }),
    end: r.end.toPlainDate({ year: dummyYear }),
  }));
  const dr2 = r2.map((r) => ({
    start: r.start.toPlainDate({ year: dummyYear }),
    end: r.end.toPlainDate({ year: dummyYear }),
  }));

  const intersectedDR = intersectDateRanges(dr1, dr2);
  for (const dr of intersectedDR) {
    results.push({
      start: dr.start.toPlainMonthDay(),
      end: dr.end.toPlainMonthDay(),
    });
  }
  return results;
}

/**
 * Calculates the intersection of an array of {@link PlainDateRange} objects with an array of {@link PlainMonthDayRange} objects.
 * For each {@link PlainDateRange}, it attempts to find intersections with all {@link PlainMonthDayRange}s
 * by converting the month-day range into a date range within the context of the date range's year.
 * The input date ranges should not cross year boundaries.
 *
 * @param r1 An array of {@link PlainDateRange} objects.
 * @param r2 An array of {@link PlainMonthDayRange} objects.
 * @returns An array of {@link PlainDateRange} objects representing the intersections.
 *   Returns an empty array if no intersections are found.
 */
export function intersectDateRangeWithMonthDayRange(
  r1: PlainDateRange[],
  r2: PlainMonthDayRange[]
): PlainDateRange[] {
  const results: PlainDateRange[] = [];
  for (const dr of r1) {
    for (const mdr of r2) {
      // dr.start and dr.end are same year (splitDateRangeCrossingYearEnd() applied)
      const mdStartDate = mdr.start.toPlainDate({ year: dr.start.year });
      const mdEndDate = mdr.end.toPlainDate({ year: dr.end.year });
      const mdDateRange: PlainDateRange = {
        start: mdStartDate,
        end: mdEndDate,
      };
      // for cases like February 29 auto adjusted to February 28, which does not match the day
      results.push(...intersectDateRanges([dr], [mdDateRange]));
    }
  }
  return results;
}

/**
 * Calculates new {@link PlainDateRange}s by intersecting a set of existing ranges
 * with a new set of ranges. This function handles the initial application of constraints
 * (if `existingRanges` is `null`) and manages empty result sets.
 * New ranges are flattened and split by year boundaries before intersection.
 *
 * @param existingRanges The currently calculated {@link PlainDateRange}s, or `null` if this is the first constraint being applied.
 * @param newRanges The new {@link PlainDateRange}s to apply as a constraint.
 * @returns An array of {@link PlainDateRange} objects representing the combined constraints.
 *   Returns an empty array if no valid ranges remain after intersection.
 */
export function calculateNewDateRanges(
  existingRanges: PlainDateRange[] | null,
  newRanges: PlainDateRange[]
): PlainDateRange[] {
  let results: PlainDateRange[] = [];

  // if existingRanges is null, this is the first constraint being applied
  // if existingRanges is not null but empty, means no valid ranges anymore, so return empty
  if (existingRanges !== null && existingRanges.length === 0) {
    return [];
  }

  const wipNewRanges: PlainDateRange[] = newRanges.flatMap((r) =>
    splitDateRangeCrossingYearEnd(r)
  );

  // if existingRanges is null, this is the first constraint being applied
  if (existingRanges === null) {
    return wipNewRanges;
  }

  results = intersectDateRanges(existingRanges, wipNewRanges);
  return results;
}

/**
 * Calculates new {@link PlainMonthDayRange}s by intersecting a set of existing ranges
 * with a new set of ranges. Similar to `calculateNewDateRanges`, this function
 * handles initial constraint application and empty result sets.
 * New ranges are flattened and split by year boundaries (if crossing) before intersection.
 *
 * @param existingRanges The currently calculated {@link PlainMonthDayRange}s, or `null` if this is the first constraint being applied.
 * @param newRanges The new {@link PlainMonthDayRange}s to apply as a constraint.
 * @returns An array of {@link PlainMonthDayRange} objects representing the combined constraints.
 *   Returns an empty array if no valid ranges remain after intersection.
 */
export function calculateNewMonthDayRanges(
  existingRanges: PlainMonthDayRange[] | null,
  newRanges: PlainMonthDayRange[]
): PlainMonthDayRange[] {
  let results: PlainMonthDayRange[] = [];

  // if existingRanges is null, this is the first constraint being applied
  // if existingRanges is not null but empty, means no valid ranges anymore, so return empty
  if (existingRanges !== null && existingRanges.length === 0) {
    return [];
  }

  const wipNewRanges: PlainMonthDayRange[] = newRanges.flatMap((r) =>
    splitMonthDayRangeCrossingYearEnd(r)
  );

  // if existingRanges is null, this is the first constraint being applied
  if (existingRanges === null) {
    return wipNewRanges;
  }

  // intersect month-day ranges
  results = intersectMonthDayRanges(existingRanges, wipNewRanges);
  return results;
}

/**
 * In non-leap years, this function splits any {@link PlainMonthDayRange} that crosses or includes February 29th.
 * It ensures that the resulting ranges are valid for a non-leap year by adjusting or removing February 29th.
 * Assumes the input range is within a single year (i.e., does not cross year boundaries).
 *
 * @param range The {@link PlainMonthDayRange} to process.
 * @returns An array of one or two valid {@link PlainMonthDayRange}s (or an empty array if nothing survives,
 *   e.g., if the input was only Feb 29th).
 *
 * @example
 *   [02-29→02-29] → []
 * @example
 *   [01-01→02-29] → [01-01→02-28]
 * @example
 *   [02-29→04-01] → [03-01→04-01]
 * @example
 *   [02-01→04-01] → [02-01→02-28, 03-01→04-01]
 * @example
 *   [01-01→02-01] → [01-01→02-01] (no change)
 */
export function splitMonthDayRangeForNonLeapYear(
  range: PlainMonthDayRange
): PlainMonthDayRange[] {
  const feb28 = Temporal.PlainMonthDay.from({ month: 2, day: 28 });
  const feb29 = Temporal.PlainMonthDay.from({ month: 2, day: 29 });
  const mar01 = Temporal.PlainMonthDay.from({ month: 3, day: 1 });
  const isFeb29 = (md: Temporal.PlainMonthDay) => md.equals(feb29);

  const { start, end } = range;

  const result: PlainMonthDayRange[] = [];

  // Case 1: [02-29→02-29] → []
  if (start.equals(feb29) && end.equals(feb29)) {
    return result; // empty
  }

  // Case 2: [01-01→02-29] → [01-01→02-28]
  if (!isFeb29(start) && isFeb29(end)) {
    result.push({
      start,
      end: feb28,
    });
    return result;
  }

  // Case 3: [02-29→04-01] → [03-01→04-01]
  if (isFeb29(start) && !isFeb29(end)) {
    result.push({
      start: mar01,
      end,
    });
    return result;
  }

  // Case 4: [02-01→04-01] → [02-01→02-28, 03-01→04-01]
  if (start.toString() < '02-29' && end.toString() > '02-29') {
    result.push({
      start,
      end: feb28,
    });
    result.push({
      start: mar01,
      end,
    });
    return result;
  }

  // Case 5: No Feb 29 involved, return as is
  result.push(range);

  return result;
}

/**
 * Merges a list of {@link PlainDateRange} objects.
 * Overlapping or adjacent ranges are combined into a single range.
 * The result is sorted by start date.
 *
 * @param ranges The array of {@link PlainDateRange} objects to merge.
 * @returns A new array of merged {@link PlainDateRange} objects.
 */
export function mergeDateRanges(ranges: PlainDateRange[]): PlainDateRange[] {
  if (ranges.length === 0) {
    return [];
  }

  // Sort ranges by start date
  const sortedRanges = [...ranges].sort((a, b) =>
    Temporal.PlainDate.compare(a.start, b.start)
  );

  const merged: PlainDateRange[] = [];
  let currentRange = sortedRanges[0];

  for (let i = 1; i < sortedRanges.length; i++) {
    const nextRange = sortedRanges[i];

    // Check if nextRange overlaps or is adjacent to currentRange
    // Adjacent means nextRange.start <= currentRange.end + 1 day
    const currentEndPlusOne = currentRange.end.add({ days: 1 });

    if (Temporal.PlainDate.compare(nextRange.start, currentEndPlusOne) <= 0) {
      // Merge ranges
      // The end date is the max of the two end dates
      const newEnd =
        Temporal.PlainDate.compare(currentRange.end, nextRange.end) >= 0
          ? currentRange.end
          : nextRange.end;

      currentRange = {
        start: currentRange.start,
        end: newEnd,
      };
    } else {
      // No overlap/adjacency, push currentRange and start a new one
      merged.push(currentRange);
      currentRange = nextRange;
    }
  }

  merged.push(currentRange);

  return merged;
}
