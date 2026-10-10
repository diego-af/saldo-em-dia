import { describe, expect, it } from "vitest";
import { planInstallments } from "./plan-installments";

describe("credit card installment plan", () => {
  it("places purchases after closing in the following invoice", () => {
    expect(
      planInstallments({
        totalCents: 100_00,
        installmentCount: 1,
        purchaseDate: "2026-10-11",
        closingDay: 10,
        dueDay: 17,
      }),
    ).toEqual([
      {
        number: 1,
        amountCents: 100_00,
        invoiceMonth: "2026-11",
        dueDate: "2026-11-17",
      },
    ]);
  });

  it("moves the due date after closing and clamps missing month days", () => {
    expect(
      planInstallments({
        totalCents: 100_00,
        installmentCount: 1,
        purchaseDate: "2027-01-31",
        closingDay: 31,
        dueDay: 5,
      }),
    ).toEqual([
      {
        number: 1,
        amountCents: 100_00,
        invoiceMonth: "2027-01",
        dueDate: "2027-02-05",
      },
    ]);
  });

  it("preserves every cent and assigns the remainder to the first installment", () => {
    expect(
      planInstallments({
        totalCents: 10_00,
        installmentCount: 3,
        purchaseDate: "2026-10-09",
        closingDay: 10,
        dueDay: 17,
      }),
    ).toEqual([
      { number: 1, amountCents: 334, invoiceMonth: "2026-10", dueDate: "2026-10-17" },
      { number: 2, amountCents: 333, invoiceMonth: "2026-11", dueDate: "2026-11-17" },
      { number: 3, amountCents: 333, invoiceMonth: "2026-12", dueDate: "2026-12-17" },
    ]);
  });
});
