import { z } from "zod";
import { civilDateSchema } from "../../core/dates/civil-date";
import { moneyInCentsSchema } from "../../core/money/money-in-cents";

const positiveMoneySchema = moneyInCentsSchema.refine((value) => value > 0);
const daySchema = z.number().int().min(1).max(31);
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const creditCardSchema = z.object({
  id: z.string().uuid(),
  institutionId: z.string().uuid(),
  limitCents: positiveMoneySchema,
  closingDay: daySchema,
  dueDay: daySchema,
  createdAt: z.string().datetime(),
});
export type CreditCard = z.infer<typeof creditCardSchema>;

export const saveCreditCardInputSchema = creditCardSchema
  .pick({ institutionId: true, limitCents: true, closingDay: true, dueDay: true })
  .strict();
export type SaveCreditCardInput = z.input<typeof saveCreditCardInputSchema>;

export const createCardPurchaseInputSchema = z
  .object({
    cardId: z.string().uuid(),
    categoryId: z.string().uuid(),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(500).optional(),
    totalCents: positiveMoneySchema,
    purchaseDate: civilDateSchema,
    installmentCount: z.number().int().min(1).max(360),
  })
  .strict();
export type CreateCardPurchaseInput = z.input<typeof createCardPurchaseInputSchema>;

export const cardPurchaseSchema = createCardPurchaseInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type CardPurchase = z.infer<typeof cardPurchaseSchema>;

export const cardInvoiceSchema = z.object({
  cardId: z.string().uuid(),
  month: monthSchema,
  dueDate: civilDateSchema,
  amountCents: positiveMoneySchema,
  paidAt: civilDateSchema.nullable(),
});
export type CardInvoice = z.infer<typeof cardInvoiceSchema>;

export const cardSummarySchema = z.object({
  card: creditCardSchema,
  limitCents: positiveMoneySchema,
  committedCents: moneyInCentsSchema,
  availableCents: moneyInCentsSchema,
});
export type CardSummary = z.infer<typeof cardSummarySchema>;

export const payInvoiceInputSchema = z
  .object({ cardId: z.string().uuid(), month: monthSchema, paymentDate: civilDateSchema })
  .strict();
export type PayInvoiceInput = z.input<typeof payInvoiceInputSchema>;

export const creditCardIdSchema = z.string().uuid();
export const creditCardIpcChannels = {
  getCards: "credit-card:get-cards",
  saveCard: "credit-card:save-card",
  createPurchase: "credit-card:create-purchase",
  getPurchases: "credit-card:get-purchases",
  getSummary: "credit-card:get-summary",
  listInvoices: "credit-card:list-invoices",
  payInvoice: "credit-card:pay-invoice",
} as const;

export interface CreditCardApi {
  getCards(): Promise<CreditCard[]>;
  saveCard(input: SaveCreditCardInput): Promise<CreditCard>;
  createPurchase(input: CreateCardPurchaseInput): Promise<CardPurchase>;
  getPurchases(cardId: string): Promise<CardPurchase[]>;
  getSummary(cardId: string): Promise<CardSummary>;
  listInvoices(cardId: string): Promise<CardInvoice[]>;
  payInvoice(input: PayInvoiceInput): Promise<void>;
}
