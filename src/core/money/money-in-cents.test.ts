import { describe, expect, it } from "vitest";
import { moneyInCentsSchema } from "./money-in-cents";

describe("MoneyInCents", () => {
  it("accepts an integer amount in cents", () => {
    expect(moneyInCentsSchema.parse(7_000_00)).toBe(700_000);
  });

  it("rejects decimal and unsafe amounts", () => {
    expect(moneyInCentsSchema.safeParse(19.9).success).toBe(false);
    expect(moneyInCentsSchema.safeParse(Number.MAX_SAFE_INTEGER + 1).success).toBe(false);
  });
});
