# 🎂 Birthday Range Calculator

[![npm version](https://img.shields.io/npm/v/birthday-range.svg)](https://www.npmjs.com/package/birthday-range)
[![License](https://img.shields.io/npm/l/birthday-range.svg)](https://github.com/fixicelo/birthday-range/blob/main/LICENSE)

A TypeScript library for calculating possible birthday date ranges from partial information like age, zodiac sign, month, or year. It is built on the Temporal API via `@js-temporal/polyfill`.

## ✨ Key Features

- ✨ **Immutable & Chainable API:** Each method returns a new, immutable instance, allowing for safe and predictable query building.
- 🎛️ **Multiple Constraints:** Filter by year, age, month, day, zodiac sign, and leap year status.
- 📅 **Modern Date-Time Logic:** Uses the Temporal API to avoid common pitfalls of the legacy `Date` object.
- 🧩 **Extensible:** Supports custom constraints for unique filtering logic.
- 🔒 **Fully Typed:** Written in TypeScript for type safety.

## 🚀 Installation

Install the package using your package manager:

```bash
# pnpm
pnpm add birthday-range

# npm
npm install birthday-range

# yarn
yarn add birthday-range
```

This package includes `@js-temporal/polyfill` as a direct dependency to ensure version compatibility and stability, as the Temporal API is still experimental.

## 👨‍💻 Usage

Import the `BirthdayRange` builder class and initialize it in one of two ways:

### 1. 🔗 Chainable Builder Pattern

Call `new BirthdayRange()` with no arguments and chain constraint methods.

```typescript
import BirthdayRange from 'birthday-range';

// Find all birthdays in February for the year 2000 (a leap year)
const result = new BirthdayRange().year(2000).month(2).calc();

console.log(result.dateRanges);
// Outputs:
// [{ start: '2000-02-01', end: '2000-02-29' }]
```

### 2. ⚙️ Constructor with Options

Pass a single options object to the constructor to set multiple constraints at once.

```typescript
import BirthdayRange, { BirthdayRangeOptions } from 'birthday-range';

const options: BirthdayRangeOptions = {
  year: 2001, // a non-leap year
  month: 2,
};

const result = new BirthdayRange(options).calc();

console.log(result.dateRanges);
// Outputs:
// [{ start: '2001-02-01', end: '2001-02-28' }]
```

### Inspecting context

You can inspect the current constraints at any point by using the `.getContext()` method.

```typescript
const builder = new BirthdayRange().year(2000).month(5);
const context = builder.getContext();

console.log(context.year); // 2000
console.log(context.month); // 5
console.log(context.age); // null
```

### Immutability

The builder is immutable. Each constraint method call creates and returns a new `BirthdayRange` instance, leaving the original unchanged.

```typescript
const initialBuilder = new BirthdayRange().year(2000);
const mayBuilder = initialBuilder.month(5);
const juneBuilder = initialBuilder.month(6);

// initialBuilder is not affected by the subsequent calls.
console.log(initialBuilder.calc().year); // 2000
console.log(initialBuilder.calc().month); // null

// mayBuilder and juneBuilder are new, independent instances.
console.log(mayBuilder.calc().month); // 5
console.log(juneBuilder.calc().month); // 6
```

## 📝 API Reference

### `new BirthdayRange()` / `new BirthdayRange(options)`

Creates a new builder instance. The constructor is overloaded:

- **`new BirthdayRange()`**: Called with no arguments, it returns an empty builder instance, ready for you to chain constraint methods.
- **`new BirthdayRange(options: BirthdayRangeOptions)`**: Called with an options object, it returns an instance with all the specified constraints already applied.

### Utility Methods

- `.getContext()`: Inspects the current inputs and returns the context as an object.

### Constraint Methods

All constraint methods return a **new, immutable `BirthdayRange` instance**.

- `.year(year: number)`: Restricts birthdays to a specific year.
- `.age(age: number, options?: { asOfDate?: string | Temporal.PlainDate })`: Calculates the date range for a given age as of a reference date (defaults to today).
- `.month(month: number)`: Restricts birthdays to a specific month (1-12).
- `.day(day: number)`: Restricts birthdays to a specific day of the month (1-31).
- `.zodiac(sign: string)`: Restricts to a zodiac sign. Supports names in multiple languages (e.g., "Aries", "獅子座", "Taureau").
- `.isLeapYear(isLeap: boolean)`: Filters for birthdays that fall in a leap year or not.
- `.add(constraint: Constraint)`: Adds a custom-defined constraint to the calculation.

### Core Types

These types are part of the public API and are useful for understanding method signatures and return values.

- `BirthdayRangeOptions`: An options object for setting multiple constraints at once in the constructor.
- `CalculationResult`: The final result object from `.calc()`, containing the calculated date ranges and context. If no year info (`year`/`age`), then no `dataRanges` returned.
- `PlainDateRange`: A date range with `start` and `end` properties (`Temporal.PlainDate`).
- `PlainMonthDayRange`: A month-day range with `start` and `end` properties (`Temporal.PlainMonthDay`).

### Custom Constraints

You can create your own constraints by extending the `BaseConstraint`.

**Example: `QuarterConstraint`**

This class will map a quarter name to a specific month-day range.

```typescript
const QUARTER_RANGES: Record<string, PlainMonthDayRange> = {
  Q1: {
    start: Temporal.PlainMonthDay.from({ month: 1, day: 1 }),
    end: Temporal.PlainMonthDay.from({ month: 3, day: 31 }),
  },
  Q2: {
    start: Temporal.PlainMonthDay.from({ month: 4, day: 1 }),
    end: Temporal.PlainMonthDay.from({ month: 6, day: 30 }),
  },
  Q3: {
    start: Temporal.PlainMonthDay.from({ month: 7, day: 1 }),
    end: Temporal.PlainMonthDay.from({ month: 9, day: 30 }),
  },
  Q4: {
    start: Temporal.PlainMonthDay.from({ month: 10, day: 1 }),
    end: Temporal.PlainMonthDay.from({ month: 12, day: 31 }),
  },
};

class QuarterConstraint extends BaseConstraint {
  constructor(private quarter: string) {
    super('quarter'); // Unique ID for this constraint
  }

  prepareContext(ctx: CalculationContext): void {
    ctx.opts.quarter = this.quarter;
  }

  apply(ctx: CalculationContext): CalculationContext {
    const quarterRange = QUARTER_RANGES[this.quarter];
    const monthDayRanges = calculateNewMonthDayRanges(
      ctx.monthDayRanges, // based on previous calculations
      [quarterRange]  // new ranges for restricting results
    );

    // If we're not working with concrete dates yet (i.e., no year is specified),
    // we only need to update the month-day ranges.
    if (ctx.dateRanges === null) {
      return { ...ctx, monthDayRanges };
    }

    // Handle new date ranges
    const dateRanges = intersectDateRangeWithMonthDayRange(
      ctx.dateRanges, 
      [quarterRange]
    );

    return { ...ctx, dateRanges, monthDayRanges};
  }
}

// You can then use it with the .add() method:
// const q1 = new BirthdayRange().add(new QuarterConstraint('Q1'));
```

**Using the Custom Constraint**

```typescript
import BirthdayRange from 'birthday-range';
// import { QuarterConstraint } from './path/to/QuarterConstraint'; // Assuming QuarterConstraint is in its own file

const q1 = new BirthdayRange().add(new QuarterConstraint('Q1'));
console.log(q1.calc().monthDayRanges);
// [{"start":"01-01","end":"03-31"}]

const q1WithMonth = q1.month(2);
console.log(q1WithMonth.calc().monthDayRanges); // Restricted to February
// [{"start":"02-01","end":"02-29"}]

// Use a non-leap year (2001)
const q1WithYear = q1WithMonth.year(2001);
console.log(q1WithYear.calc().monthDayRanges);
// [{"start":"02-01","end":"02-28"}]
```

## 🛠️ Development

This project uses `pnpm` as its package manager.

- **Install Dependencies:** `pnpm install`
- **Build:** `pnpm build`
- **Run Tests:** `pnpm test`
- **Lint:** `pnpm lint`
- **Format:** `pnpm format`

## 📜 License

This project is licensed under the **MIT License**.
