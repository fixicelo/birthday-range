/**
 * Parses a number or string input into a number and validates it.
 *
 * @param value The value to parse (number or string).
 * @param errorMessage The error message to throw if validation fails.
 * @param predicate An optional function to validate the parsed number.
 * @returns The parsed number.
 * @throws {Error} If the value is NaN or fails the predicate check.
 */
export function ensureNumber(
  value: number | string,
  errorMessage: string,
  predicate?: (val: number) => boolean
): number {
  const parsed = typeof value === 'string' ? parseInt(value.trim(), 10) : value;

  if (isNaN(parsed) || (predicate && !predicate(parsed))) {
    throw new Error(errorMessage);
  }

  return parsed;
}
