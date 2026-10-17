import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCreditCardRepository } from "./credit-card-repository";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createDebtRepository } from "./debt-repository";
import { createFinanceRepository } from "./finance-repository";
import { createRecurrenceRepository } from "./recurrence-repository";
import { createReminderRepository } from "./reminder-repository";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("reminder SQLite repository", () => {
  it("collects pending commitments and persists silencing and delivery", async () => {
    const now = () => new Date("2026-10-17T12:00:00.000Z");
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-reminder-")), "app.sqlite"),
    );
    const finance = createFinanceRepository(client, now);
    const cards = createCreditCardRepository(client, now);
    const debts = createDebtRepository(client, now);
    const recurrences = createRecurrenceRepository(client, now);
    const reminders = createReminderRepository(client, now);
    const expense = finance.saveCategory({ name: "Casa", type: "expense" });
    const institution = finance.saveInstitution({ name: "Banco" });
    const card = cards.saveCard({
      institutionId: institution.id,
      limitCents: 1_000_00,
      closingDay: 10,
      dueDay: 17,
    });
    cards.createPurchase({
      cardId: card.id,
      categoryId: expense.id,
      totalCents: 100_00,
      purchaseDate: "2026-10-09",
      installmentCount: 1,
    });
    const debt = debts.create({
      creditorName: "Ana",
      totalCents: 50_00,
      installments: [{ number: 1, amountCents: 50_00, dueDate: "2026-10-18" }],
    });
    recurrences.create({
      description: "Aluguel",
      categoryId: expense.id,
      amountCents: 200_00,
      startDate: "2026-10-19",
      isSalary: false,
    });

    expect(new Set(reminders.listPending().map(({ title }) => title))).toEqual(
      new Set(["Fatura do cartão", "Parcela para Ana", "Aluguel"]),
    );

    cards.payInvoice({ cardId: card.id, month: "2026-10", paymentDate: "2026-10-17" });
    expect(reminders.listPending().map(({ title }) => title)).not.toContain("Fatura do cartão");

    const installment = debts.listInstallments(debt.id)[0];
    const key = `debt-installment:${installment.id}` as const;
    reminders.silence(key);
    expect(reminders.listSilenced()).toEqual([key]);
    expect(reminders.listPending().map(({ title }) => title)).not.toContain("Parcela para Ana");

    const invoiceKey = `invoice:${card.id}:2026-10` as const;
    expect(reminders.wasDelivered(invoiceKey, "2026-10-17")).toBe(false);
    reminders.markDelivered(invoiceKey, "2026-10-17", now().toISOString());
    expect(reminders.wasDelivered(invoiceKey, "2026-10-17")).toBe(true);
  });
});
