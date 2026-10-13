import { describe, expect, it } from "vitest";
import { planDebtInstallments } from "./plan-debt-installments";

describe("planDebtInstallments", () => {
  it("preserves cents and adjusts monthly due dates", () => {
    expect(planDebtInstallments(1_000, 3, "2026-01-31")).toEqual([
      { number: 1, amountCents: 334, dueDate: "2026-01-31" },
      { number: 2, amountCents: 333, dueDate: "2026-02-28" },
      { number: 3, amountCents: 333, dueDate: "2026-03-31" },
    ]);
  });
});
