import BirthdayRange from './birthday-range.js';

// Re-export core types and classes for extensibility and utility.
export { Temporal } from '@js-temporal/polyfill';
export { BaseConstraint } from './constraints.js';
export type { Constraint } from './constraints.js';
export {
  calculateNewDateRanges,
  calculateNewMonthDayRanges,
  intersectDateRangeWithMonthDayRange,
  mergeDateRanges,
} from './utils/range-ops.js';

// Re-export all public types from the dedicated types file
export type * from './types.js';

export default BirthdayRange;
