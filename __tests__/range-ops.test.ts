import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
  splitDateRangeCrossingYearEnd,
  splitMonthDayRangeCrossingYearEnd,
  intersectDateRanges,
  calculateNewDateRanges,
  calculateNewMonthDayRanges,
  splitMonthDayRangeForNonLeapYear,
  mergeDateRanges,
} from '../src/utils/range-ops.js';
import { PlainDateRange, PlainMonthDayRange } from '../src/index.js';

describe('splitDateRangeCrossingYearEnd', () => {
  it('should not split a range within the same year', () => {
    const dr: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-01'),
      end: Temporal.PlainDate.from('2023-12-30'),
    };
    expect(splitDateRangeCrossingYearEnd(dr)).toEqual([dr]);
  });

  it('should split a range crossing one year end', () => {
    const dr: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-12-15'),
      end: Temporal.PlainDate.from('2024-01-15'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2023-12-15'),
        end: Temporal.PlainDate.from('2023-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2024-01-01'),
        end: Temporal.PlainDate.from('2024-01-15'),
      },
    ];
    expect(splitDateRangeCrossingYearEnd(dr)).toEqual(expected);
  });

  it('should handle ranges spanning multiple years', () => {
    const dr: PlainDateRange = {
      start: Temporal.PlainDate.from('2022-12-15'),
      end: Temporal.PlainDate.from('2024-01-15'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2022-12-15'),
        end: Temporal.PlainDate.from('2022-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2023-01-01'),
        end: Temporal.PlainDate.from('2023-12-31'),
      },
      {
        start: Temporal.PlainDate.from('2024-01-01'),
        end: Temporal.PlainDate.from('2024-01-15'),
      },
    ];
    expect(splitDateRangeCrossingYearEnd(dr)).toEqual(expected);
  });

  it('should handle a range that is a single day', () => {
    const dr: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-05-10'),
      end: Temporal.PlainDate.from('2023-05-10'),
    };
    expect(splitDateRangeCrossingYearEnd(dr)).toEqual([dr]);
  });
});

describe('splitMonthDayRangeCrossingYearEnd', () => {
  it('should not split a range that does not cross the year end', () => {
    const mdr: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 3, day: 21 }),
      end: Temporal.PlainMonthDay.from({ month: 4, day: 19 }),
    };
    expect(splitMonthDayRangeCrossingYearEnd(mdr)).toEqual([mdr]);
  });

  it('should split a range that crosses the year end (e.g., Capricorn)', () => {
    const mdr: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 12, day: 22 }),
      end: Temporal.PlainMonthDay.from({ month: 1, day: 19 }),
    };
    const expected: PlainMonthDayRange[] = [
      {
        start: Temporal.PlainMonthDay.from({ month: 12, day: 22 }),
        end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 1, day: 19 }),
      },
    ];
    const result = splitMonthDayRangeCrossingYearEnd(mdr);
    expect(result).toEqual(expected);
  });

  it('should handle a single day range', () => {
    const mdr: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 7, day: 23 }),
      end: Temporal.PlainMonthDay.from({ month: 7, day: 23 }),
    };
    expect(splitMonthDayRangeCrossingYearEnd(mdr)).toEqual([mdr]);
  });
});

describe('intersectDateRanges', () => {
  const r1: PlainDateRange[] = [
    {
      start: Temporal.PlainDate.from('2023-01-10'),
      end: Temporal.PlainDate.from('2023-01-20'),
    },
  ];
  const r2: PlainDateRange[] = [
    {
      start: Temporal.PlainDate.from('2023-01-15'),
      end: Temporal.PlainDate.from('2023-01-25'),
    },
  ];
  const r3: PlainDateRange[] = [
    {
      start: Temporal.PlainDate.from('2023-02-01'),
      end: Temporal.PlainDate.from('2023-02-10'),
    },
  ];

  it('should find intersection for overlapping ranges', () => {
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2023-01-15'),
        end: Temporal.PlainDate.from('2023-01-20'),
      },
    ];
    expect(intersectDateRanges(r1, r2)).toEqual(expected);
  });

  it('should return empty array for non-overlapping ranges', () => {
    expect(intersectDateRanges(r1, r3)).toEqual([]);
  });

  it('should handle one range containing another', () => {
    const containing: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2023-01-01'),
        end: Temporal.PlainDate.from('2023-01-31'),
      },
    ];
    expect(intersectDateRanges(r1, containing)).toEqual(r1);
  });

  it('should handle empty input arrays', () => {
    expect(intersectDateRanges([], r1)).toEqual([]);
    expect(intersectDateRanges(r1, [])).toEqual([]);
  });
});

describe('splitMonthDayRangeForNonLeapYear', () => {
  it('Case 1: should return an empty array for a range that is exactly Feb 29', () => {
    const range: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 2, day: 29 }),
      end: Temporal.PlainMonthDay.from({ month: 2, day: 29 }),
    };
    expect(splitMonthDayRangeForNonLeapYear(range)).toEqual([]);
  });

  it('Case 2: should shorten a range ending on Feb 29', () => {
    const range: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 2, day: 15 }),
      end: Temporal.PlainMonthDay.from({ month: 2, day: 29 }),
    };
    const expected: PlainMonthDayRange[] = [
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 15 }),
        end: Temporal.PlainMonthDay.from({ month: 2, day: 28 }),
      },
    ];
    expect(splitMonthDayRangeForNonLeapYear(range)).toEqual(expected);
  });

  it('Case 3: should move the start date for a range starting on Feb 29', () => {
    const range: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 2, day: 29 }),
      end: Temporal.PlainMonthDay.from({ month: 3, day: 10 }),
    };
    const expected: PlainMonthDayRange[] = [
      {
        start: Temporal.PlainMonthDay.from({ month: 3, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 10 }),
      },
    ];
    expect(splitMonthDayRangeForNonLeapYear(range)).toEqual(expected);
  });

  it('Case 4: should split a range that contains Feb 29', () => {
    const range: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 2, day: 20 }),
      end: Temporal.PlainMonthDay.from({ month: 3, day: 5 }),
    };
    const expected: PlainMonthDayRange[] = [
      {
        start: Temporal.PlainMonthDay.from({ month: 2, day: 20 }),
        end: Temporal.PlainMonthDay.from({ month: 2, day: 28 }),
      },
      {
        start: Temporal.PlainMonthDay.from({ month: 3, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 3, day: 5 }),
      },
    ];
    expect(splitMonthDayRangeForNonLeapYear(range)).toEqual(expected);
  });

  it('Case 5: should not change a range that does not involve Feb 29', () => {
    const range: PlainMonthDayRange = {
      start: Temporal.PlainMonthDay.from({ month: 3, day: 15 }),
      end: Temporal.PlainMonthDay.from({ month: 4, day: 1 }),
    };
    expect(splitMonthDayRangeForNonLeapYear(range)).toEqual([range]);
  });
});

describe('calculateNewDateRanges', () => {
  it('should return empty array when existing ranges are already empty', () => {
    const newRanges: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2024-01-01'),
        end: Temporal.PlainDate.from('2024-12-31'),
      },
    ];

    expect(calculateNewDateRanges([], newRanges)).toEqual([]);
  });
});

describe('calculateNewMonthDayRanges', () => {
  it('should return empty array when existing ranges are already empty', () => {
    const newRanges: PlainMonthDayRange[] = [
      {
        start: Temporal.PlainMonthDay.from({ month: 6, day: 1 }),
        end: Temporal.PlainMonthDay.from({ month: 6, day: 30 }),
      },
    ];

    expect(calculateNewMonthDayRanges([], newRanges)).toEqual([]);
  });
});

describe('mergeDateRanges', () => {
  it('should return empty array for empty input', () => {
    expect(mergeDateRanges([])).toEqual([]);
  });

  it('should return the same range for single range input', () => {
    const dr: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-01'),
      end: Temporal.PlainDate.from('2023-01-31'),
    };
    expect(mergeDateRanges([dr])).toEqual([dr]);
  });

  it('should merge adjacent ranges', () => {
    const r1: PlainDateRange = {
      start: Temporal.PlainDate.from('1998-12-16'),
      end: Temporal.PlainDate.from('1998-12-31'),
    };
    const r2: PlainDateRange = {
      start: Temporal.PlainDate.from('1999-01-01'),
      end: Temporal.PlainDate.from('1999-12-15'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('1998-12-16'),
        end: Temporal.PlainDate.from('1999-12-15'),
      },
    ];
    expect(mergeDateRanges([r1, r2])).toEqual(expected);
  });

  it('should merge overlapping ranges', () => {
    const r1: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-01'),
      end: Temporal.PlainDate.from('2023-01-15'),
    };
    const r2: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-10'),
      end: Temporal.PlainDate.from('2023-01-20'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2023-01-01'),
        end: Temporal.PlainDate.from('2023-01-20'),
      },
    ];
    expect(mergeDateRanges([r1, r2])).toEqual(expected);
  });

  it('should not merge separated ranges', () => {
    const r1: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-01'),
      end: Temporal.PlainDate.from('2023-01-10'),
    };
    const r2: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-12'),
      end: Temporal.PlainDate.from('2023-01-20'),
    };
    expect(mergeDateRanges([r1, r2])).toEqual([r1, r2]);
  });

  it('should handle unsorted ranges', () => {
    const r1: PlainDateRange = {
      start: Temporal.PlainDate.from('1999-01-01'),
      end: Temporal.PlainDate.from('1999-12-15'),
    };
    const r2: PlainDateRange = {
      start: Temporal.PlainDate.from('1998-12-16'),
      end: Temporal.PlainDate.from('1998-12-31'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('1998-12-16'),
        end: Temporal.PlainDate.from('1999-12-15'),
      },
    ];
    expect(mergeDateRanges([r1, r2])).toEqual(expected);
  });

  it('should merge multiple ranges', () => {
    const r1: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-01'),
      end: Temporal.PlainDate.from('2023-01-05'),
    };
    const r2: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-06'),
      end: Temporal.PlainDate.from('2023-01-10'),
    };
    const r3: PlainDateRange = {
      start: Temporal.PlainDate.from('2023-01-12'),
      end: Temporal.PlainDate.from('2023-01-15'),
    };
    const expected: PlainDateRange[] = [
      {
        start: Temporal.PlainDate.from('2023-01-01'),
        end: Temporal.PlainDate.from('2023-01-10'),
      },
      {
        start: Temporal.PlainDate.from('2023-01-12'),
        end: Temporal.PlainDate.from('2023-01-15'),
      },
    ];
    expect(mergeDateRanges([r1, r2, r3])).toEqual(expected);
  });
});
