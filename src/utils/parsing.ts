/**
 * Parses a number or string input into an integer and validates it.
 *
 * @param value The value to parse (number or string).
 * @param errorMessage The error message to throw if validation fails.
 * @param predicate An optional function to validate the parsed number.
 * @returns The parsed integer.
 * @throws {Error} If the value is NaN, not an integer, or fails the predicate check.
 */
export function ensureNumber(
  value: number | string,
  errorMessage: string,
  predicate?: (val: number) => boolean
): number {
  const parsed = typeof value === 'string' ? Number(value.trim()) : value;

  if (
    isNaN(parsed) ||
    !Number.isInteger(parsed) ||
    (predicate && !predicate(parsed))
  ) {
    throw new Error(errorMessage);
  }

  return parsed;
}
