import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createCreditCardRepository } from "./credit-card-repository";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createFinanceRepository } from "./finance-repository";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("credit card SQLite repository", () => {
  it("persists installments, commits the limit and changes cash only on full invoice payment", async () => {
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-card-")), "app.sqlite"),
    );
    const finance = createFinanceRepository(client, () => new Date("2026-10-10T12:00:00.000Z"));
    const cards = createCreditCardRepository(client, () => new Date("2026-10-10T12:00:00.000Z"));
    finance.setInitialBalance({ amountCents: 1_000_00, date: "2026-10-01" });
    const institution = finance.saveInstitution({ name: "Banco local" });
    const category = finance.saveCategory({ name: "Casa", type: "expense" });
    const card = cards.saveCard({
      institutionId: institution.id,
      limitCents: 2_000_00,
      closingDay: 10,
      dueDay: 17,
    });

    cards.createPurchase({
      cardId: card.id,
      categoryId: category.id,
      description: "Móvel",
      totalCents: 10_00,
      purchaseDate: "2026-10-09",
      installmentCount: 3,
    });

    expect(cards.getCardSummary(card.id)).toMatchObject({
      limitCents: 2_000_00,
      committedCents: 10_00,
      availableCents: 1_990_00,
    });
    expect(() =>
      cards.createPurchase({
        cardId: card.id,
        categoryId: category.id,
        totalCents: 2_000_00,
        purchaseDate: "2026-10-09",
        installmentCount: 1,
      }),
    ).toThrow("Limite insuficiente");
    expect(cards.listInvoices(card.id)).toMatchObject([
      { month: "2026-10", dueDate: "2026-10-17", amountCents: 334, paidAt: null },
      { month: "2026-11", dueDate: "2026-11-17", amountCents: 333, paidAt: null },
      { month: "2026-12", dueDate: "2026-12-17", amountCents: 333, paidAt: null },
    ]);
    expect(finance.getSummary().availableCents).toBe(1_000_00);

    cards.payInvoice({ cardId: card.id, month: "2026-10", paymentDate: "2026-10-17" });

    expect(cards.getCardSummary(card.id).committedCents).toBe(666);
    expect(finance.getSummary().availableCents).toBe(996_66);
    expect(() =>
      cards.payInvoice({ cardId: card.id, month: "2026-10", paymentDate: "2026-10-18" }),
    ).toThrow("Fatura já paga");
    expect(client.database.exec("SELECT id FROM credit_card_purchases")[0]?.values).toHaveLength(1);
    expect(client.database.exec("SELECT id FROM invoice_payments")[0]?.values).toHaveLength(1);
  });
});
