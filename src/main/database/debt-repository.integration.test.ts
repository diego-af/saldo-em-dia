import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createDebtRepository } from "./debt-repository";
import { createFinanceRepository } from "./finance-repository";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("debt SQLite repository", () => {
  it("tracks status and changes cash only when an installment is paid", async () => {
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-debt-")), "app.sqlite"),
    );
    const now = () => new Date("2026-10-13T12:00:00.000Z");
    const finance = createFinanceRepository(client, now);
    const debts = createDebtRepository(client, now);
    finance.setInitialBalance({ amountCents: 100_00, date: "2026-10-01" });

    const debt = debts.create({
      creditorName: "Ana",
      totalCents: 10_00,
      installments: [
        { number: 1, amountCents: 334, dueDate: "2026-10-12" },
        { number: 2, amountCents: 333, dueDate: "2026-11-12" },
        { number: 3, amountCents: 333, dueDate: "2026-12-12" },
      ],
    });

    expect(debts.listInstallments(debt.id).map(({ status }) => status)).toEqual([
      "overdue",
      "pending",
      "pending",
    ]);
    expect(finance.getSummary().availableCents).toBe(100_00);

    const first = debts.listInstallments(debt.id)[0];
    debts.payInstallment({ installmentId: first.id, paymentDate: "2026-10-13" });

    expect(debts.list()[0].remainingCents).toBe(666);
    expect(debts.listInstallments(debt.id)[0].status).toBe("paid");
    expect(finance.getSummary()).toMatchObject({
      availableCents: 96_66,
      paidThisMonthCents: 334,
    });
    expect(() =>
      debts.payInstallment({ installmentId: first.id, paymentDate: "2026-10-13" }),
    ).toThrow("Parcela não encontrada ou já paga");
    expect(() =>
      debts.create({
        creditorName: "Bia",
        totalCents: 10_00,
        installments: [{ number: 1, amountCents: 999, dueDate: "2026-10-20" }],
      }),
    ).toThrow("A soma das parcelas");
  });
});
