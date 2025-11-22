import type {
  CalculationContext,
  CalculationResult,
  PlainMonthDayRange,
} from './types.js';
import { Constraint } from './constraints';

export function calculate(
  constraints: readonly Constraint[],
  executionOrder: readonly string[]
): CalculationResult {
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

  for (const c of constraints) {
    c.prepareContext(context);
  }

  const sortedConstraints = [...constraints].sort(
    (a, b) => executionOrder.indexOf(a.id) - executionOrder.indexOf(b.id)
  );

  let currentContext = context;
  for (const c of sortedConstraints) {
    currentContext = c.apply(currentContext);
  }

  // If dateRanges are calculated, derive monthDayRanges from them to ensure consistency
  if (currentContext.dateRanges !== null) {
    const uniqueMonthDayRanges = new Map<string, PlainMonthDayRange>();
    currentContext.dateRanges.forEach((dr) => {
      const start = dr.start.toPlainMonthDay();
      const end = dr.end.toPlainMonthDay();
      const key = `${start.toString()}-${end.toString()}`;
      if (!uniqueMonthDayRanges.has(key)) {
        uniqueMonthDayRanges.set(key, { start, end });
      }
    });
    currentContext.monthDayRanges = [...uniqueMonthDayRanges.values()];
  }

  return currentContext;
}
