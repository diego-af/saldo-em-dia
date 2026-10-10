import { randomUUID } from "node:crypto";
import type { SqlValue } from "sql.js";
import { planInstallments } from "../../core/features/credit-cards/plan-installments";
import {
  type CardInvoice,
  type CardPurchase,
  type CardSummary,
  type CreateCardPurchaseInput,
  type CreditCard,
  cardInvoiceSchema,
  cardPurchaseSchema,
  createCardPurchaseInputSchema,
  creditCardSchema,
  type PayInvoiceInput,
  payInvoiceInputSchema,
  type SaveCreditCardInput,
  saveCreditCardInputSchema,
} from "../../shared/contracts/credit-card";
import type { DatabaseClient } from "./database-client";

export interface CreditCardRepository {
  getCards(): CreditCard[];
  saveCard(input: SaveCreditCardInput): CreditCard;
  createPurchase(input: CreateCardPurchaseInput): CardPurchase;
  getPurchases(cardId: string): CardPurchase[];
  getCardSummary(cardId: string): CardSummary;
  listInvoices(cardId: string): CardInvoice[];
  payInvoice(input: PayInvoiceInput): void;
}

function query(client: DatabaseClient, sql: string, parameters: SqlValue[] = []): unknown[][] {
  const statement = client.database.prepare(sql);
  try {
    statement.bind(parameters);
    const result: unknown[][] = [];
    while (statement.step()) result.push(statement.get());
    return result;
  } finally {
    statement.free();
  }
}

export function createCreditCardRepository(
  client: DatabaseClient,
  now: () => Date = () => new Date(),
): CreditCardRepository {
  const getCards = () =>
    query(
      client,
      `SELECT id, institution_id, limit_cents, closing_day, due_day, created_at
       FROM credit_cards ORDER BY created_at`,
    ).map(([id, institutionId, limitCents, closingDay, dueDay, createdAt]) =>
      creditCardSchema.parse({ id, institutionId, limitCents, closingDay, dueDay, createdAt }),
    );

  const getCard = (cardId: string) => {
    const card = getCards().find(({ id }) => id === cardId);
    if (!card) throw new Error("Cartão não encontrado");
    return card;
  };

  const listInvoices = (cardId: string) => {
    getCard(cardId);
    return query(
      client,
      `SELECT i.card_id, i.invoice_month, MIN(i.due_date), SUM(i.amount_cents), p.payment_date
       FROM credit_card_installments i
       LEFT JOIN invoice_payments p
         ON p.card_id = i.card_id AND p.invoice_month = i.invoice_month
       WHERE i.card_id = ?
       GROUP BY i.card_id, i.invoice_month, p.payment_date
       ORDER BY i.invoice_month`,
      [cardId],
    ).map(([storedCardId, month, dueDate, amountCents, paidAt]) =>
      cardInvoiceSchema.parse({
        cardId: storedCardId,
        month,
        dueDate,
        amountCents,
        paidAt: paidAt ?? null,
      }),
    );
  };

  const getCardSummary = (cardId: string) => {
    const card = getCard(cardId);
    const committedCents = listInvoices(cardId)
      .filter(({ paidAt }) => !paidAt)
      .reduce((total, invoice) => total + invoice.amountCents, 0);
    return {
      card,
      limitCents: card.limitCents,
      committedCents,
      availableCents: card.limitCents - committedCents,
    } as CardSummary;
  };

  return {
    getCards,
    saveCard: (input) => {
      const valid = saveCreditCardInputSchema.parse(input);
      const institution = query(client, "SELECT active FROM financial_institutions WHERE id = ?", [
        valid.institutionId,
      ])[0];
      if (!institution?.[0]) throw new Error("Instituição inválida");
      const card = creditCardSchema.parse({
        ...valid,
        id: randomUUID(),
        createdAt: now().toISOString(),
      });
      client.database.run(
        `INSERT INTO credit_cards
          (id, institution_id, limit_cents, closing_day, due_day, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          card.id,
          card.institutionId,
          card.limitCents,
          card.closingDay,
          card.dueDay,
          card.createdAt,
        ],
      );
      client.persist();
      return card;
    },
    createPurchase: (input) => {
      const valid = createCardPurchaseInputSchema.parse(input);
      const card = getCard(valid.cardId);
      const category = query(client, "SELECT type, active FROM financial_categories WHERE id = ?", [
        valid.categoryId,
      ])[0];
      if (category?.[0] !== "expense" || !category[1]) {
        throw new Error("Categoria de despesa inválida");
      }
      if (getCardSummary(card.id).availableCents < valid.totalCents) {
        throw new Error("Limite insuficiente");
      }
      const purchase = cardPurchaseSchema.parse({
        ...valid,
        id: randomUUID(),
        createdAt: now().toISOString(),
      });
      const installments = planInstallments({
        totalCents: purchase.totalCents,
        installmentCount: purchase.installmentCount,
        purchaseDate: purchase.purchaseDate,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
      });
      client.database.exec("BEGIN IMMEDIATE");
      try {
        client.database.run(
          `INSERT INTO credit_card_purchases
            (id, card_id, category_id, description, notes, total_cents, purchase_date,
             installment_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            purchase.id,
            purchase.cardId,
            purchase.categoryId,
            purchase.description ?? "",
            purchase.notes ?? null,
            purchase.totalCents,
            purchase.purchaseDate,
            purchase.installmentCount,
            purchase.createdAt,
          ],
        );
        for (const installment of installments) {
          client.database.run(
            `INSERT INTO credit_card_installments
              (id, purchase_id, card_id, installment_number, amount_cents, invoice_month, due_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              purchase.id,
              purchase.cardId,
              installment.number,
              installment.amountCents,
              installment.invoiceMonth,
              installment.dueDate,
            ],
          );
        }
        client.database.exec("COMMIT");
        client.persist();
        return purchase;
      } catch (error) {
        client.database.exec("ROLLBACK");
        throw error;
      }
    },
    getPurchases: (cardId) => {
      getCard(cardId);
      return query(
        client,
        `SELECT id, card_id, category_id, description, notes, total_cents, purchase_date,
          installment_count, created_at FROM credit_card_purchases WHERE card_id = ?
         ORDER BY purchase_date DESC, created_at DESC`,
        [cardId],
      ).map(
        ([
          id,
          storedCardId,
          categoryId,
          description,
          notes,
          totalCents,
          purchaseDate,
          installmentCount,
          createdAt,
        ]) =>
          cardPurchaseSchema.parse({
            id,
            cardId: storedCardId,
            categoryId,
            description: description || undefined,
            notes: notes || undefined,
            totalCents,
            purchaseDate,
            installmentCount,
            createdAt,
          }),
      );
    },
    getCardSummary,
    listInvoices,
    payInvoice: (input) => {
      const valid = payInvoiceInputSchema.parse(input);
      const invoice = listInvoices(valid.cardId).find(({ month }) => month === valid.month);
      if (!invoice) throw new Error("Fatura não encontrada");
      if (invoice.paidAt) throw new Error("Fatura já paga");
      client.database.run(
        `INSERT INTO invoice_payments
          (id, card_id, invoice_month, amount_cents, payment_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          valid.cardId,
          valid.month,
          invoice.amountCents,
          valid.paymentDate,
          now().toISOString(),
        ],
      );
      client.persist();
    },
  };
}
