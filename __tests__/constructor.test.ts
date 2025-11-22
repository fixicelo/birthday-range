import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import BirthdayRange from '../src/index.js';
import { BirthdayRangeOptions } from '../src/types.js';

describe('BirthdayRange constructor', () => {
  it('should create a BirthdayRange instance from an options object', () => {
    const options: BirthdayRangeOptions = {
      year: 2000,
      month: 5,
      age: 20,
    };
    const range = new BirthdayRange(options);
    const context = range.getContext();

    expect(context.year).toBe(2000);
    expect(context.month).toBe(5);
    expect(context.age).toBe(20);
  });

  it('should handle complex age options', () => {
    const options: BirthdayRangeOptions = {
      age: { value: 25, asOfDate: '2025-01-01' },
    };
    const range = new BirthdayRange(options);
    const context = range.getContext();

    expect(context.age).toBe(25);
    expect(context.asOfDate).toEqual(Temporal.PlainDate.from('2025-01-01'));
  });

  it('should produce the same result as the builder pattern', () => {
    const options: BirthdayRangeOptions = {
      year: 1996,
      zodiac: 'pisces',
      isLeapYear: true,
    };
    const fromRange = new BirthdayRange(options);
    const builderRange = new BirthdayRange()
      .year(1996)
      .zodiac('pisces')
      .isLeapYear(true);

    const fromResult = fromRange.calc();
    const builderResult = builderRange.calc();

    expect(fromResult).toEqual(builderResult);
    expect(fromResult.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1996-02-19'),
        end: Temporal.PlainDate.from('1996-03-20'),
      },
    ]);
  });

  it('should handle all options simultaneously', () => {
    const asOfDate = '2020-04-01';
    const options: BirthdayRangeOptions = {
      age: { value: 24, asOfDate },
      zodiac: 'pisces',
      isLeapYear: true,
      month: 3,
      day: 15,
    };
    const range = new BirthdayRange(options);
    const result = range.calc();

    // The only date that matches is March 15, 1996
    expect(result.dateRanges).toEqual([
      {
        start: Temporal.PlainDate.from('1996-03-15'),
        end: Temporal.PlainDate.from('1996-03-15'),
      },
    ]);
  });
});
