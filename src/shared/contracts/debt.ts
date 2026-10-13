import { z } from "zod";
import { civilDateSchema } from "../../core/dates/civil-date";
import { moneyInCentsSchema } from "../../core/money/money-in-cents";

const positiveMoneySchema = moneyInCentsSchema.refine((value) => value > 0);

export const debtInstallmentInputSchema = z.object({
  number: z.number().int().min(1).max(360),
  amountCents: positiveMoneySchema,
  dueDate: civilDateSchema,
});

export const createDebtInputSchema = z
  .object({
    creditorName: z.string().trim().min(1).max(200),
    totalCents: positiveMoneySchema,
    installments: debtInstallmentInputSchema.array().min(1).max(360),
  })
  .strict();
export type CreateDebtInput = z.input<typeof createDebtInputSchema>;

export const debtSchema = z.object({
  id: z.string().uuid(),
  creditorName: z.string(),
  totalCents: positiveMoneySchema,
  remainingCents: moneyInCentsSchema,
  createdAt: z.string().datetime(),
});
export type Debt = z.infer<typeof debtSchema>;

export const debtInstallmentSchema = debtInstallmentInputSchema.extend({
  id: z.string().uuid(),
  debtId: z.string().uuid(),
  paidAt: civilDateSchema.nullable(),
  status: z.enum(["pending", "paid", "overdue"]),
});
export type DebtInstallment = z.infer<typeof debtInstallmentSchema>;

export const payDebtInstallmentInputSchema = z
  .object({ installmentId: z.string().uuid(), paymentDate: civilDateSchema })
  .strict();
export type PayDebtInstallmentInput = z.input<typeof payDebtInstallmentInputSchema>;

export const debtIdSchema = z.string().uuid();
export const debtIpcChannels = {
  create: "debt:create",
  list: "debt:list",
  listInstallments: "debt:list-installments",
  payInstallment: "debt:pay-installment",
} as const;

export interface DebtApi {
  create(input: CreateDebtInput): Promise<Debt>;
  list(): Promise<Debt[]>;
  listInstallments(debtId: string): Promise<DebtInstallment[]>;
  payInstallment(input: PayDebtInstallmentInput): Promise<void>;
}
