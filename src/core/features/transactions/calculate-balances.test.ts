import { describe, expect, it } from "vitest";
import { calculateBalances } from "./calculate-balances";

describe("calculateBalances", () => {
  it("changes available balance only for confirmed transactions", () => {
    expect(
      calculateBalances(100_00, [
        { amountCents: 50_00, type: "income", isConfirmed: true },
        { amountCents: 20_00, type: "expense", isConfirmed: true },
        { amountCents: 90_00, type: "expense", isConfirmed: false },
      ]),
    ).toEqual({ availableCents: 130_00, projectedCents: 40_00 });
  });
});
