import { describe, expect, it } from "vitest";
import { generateMonthlyOccurrences } from "./generate-monthly-occurrences";

describe("generateMonthlyOccurrences", () => {
  it("generates monthly dates without overflowing short months", () => {
    expect(generateMonthlyOccurrences("2026-01-31", 3)).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
  });
});
