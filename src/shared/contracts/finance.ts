import { z } from "zod";
import { civilDateSchema } from "../../core/dates/civil-date";
import { moneyInCentsSchema } from "../../core/money/money-in-cents";

const optionalTextSchema = z.string().trim().max(500).optional();
const nameSchema = z.string().trim().min(1, "Informe um nome").max(80);

export const financialCategoryTypeSchema = z.enum(["income", "expense"]);
export type FinancialCategoryType = z.infer<typeof financialCategoryTypeSchema>;

export const financialCategorySchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  type: financialCategoryTypeSchema,
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
export type FinancialCategory = z.infer<typeof financialCategorySchema>;

export const saveCategoryInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: nameSchema,
    type: financialCategoryTypeSchema,
    active: z.boolean().optional(),
  })
  .strict();
export type SaveCategoryInput = z.input<typeof saveCategoryInputSchema>;

export const financialInstitutionSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
export type FinancialInstitution = z.infer<typeof financialInstitutionSchema>;

export const saveInstitutionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: nameSchema,
    active: z.boolean().optional(),
  })
  .strict();
export type SaveInstitutionInput = z.input<typeof saveInstitutionInputSchema>;

export const transactionSchema = z.object({
  id: z.string().uuid(),
  description: optionalTextSchema,
  amountCents: moneyInCentsSchema.refine((value) => value > 0, "Informe um valor maior que zero"),
  categoryId: z.string().uuid(),
  institutionId: z.string().uuid().optional(),
  date: civilDateSchema,
  isConfirmed: z.boolean(),
  notes: optionalTextSchema,
  createdAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const saveTransactionInputSchema = transactionSchema
  .pick({
    description: true,
    amountCents: true,
    categoryId: true,
    institutionId: true,
    date: true,
    isConfirmed: true,
    notes: true,
  })
  .strict();
export type SaveTransactionInput = z.input<typeof saveTransactionInputSchema>;

export const initialBalanceSchema = z.object({
  amountCents: moneyInCentsSchema,
  date: civilDateSchema,
});
export type InitialBalance = z.infer<typeof initialBalanceSchema>;
export const initialBalanceInputSchema = initialBalanceSchema.strict();
export type InitialBalanceInput = z.input<typeof initialBalanceInputSchema>;

export const financeSummarySchema = z.object({
  initialBalance: initialBalanceSchema.nullable(),
  availableCents: moneyInCentsSchema,
  projectedCents: moneyInCentsSchema,
  receivedThisMonthCents: moneyInCentsSchema,
  paidThisMonthCents: moneyInCentsSchema,
});
export type FinanceSummary = z.infer<typeof financeSummarySchema>;

export const financeIpcChannels = {
  getSummary: "finance:get-summary",
  getCategories: "finance:get-categories",
  saveCategory: "finance:save-category",
  getInstitutions: "finance:get-institutions",
  saveInstitution: "finance:save-institution",
  getTransactions: "finance:get-transactions",
  saveTransaction: "finance:save-transaction",
  setInitialBalance: "finance:set-initial-balance",
} as const;

export interface FinanceApi {
  getSummary(): Promise<FinanceSummary>;
  getCategories(): Promise<FinancialCategory[]>;
  saveCategory(input: SaveCategoryInput): Promise<FinancialCategory>;
  getInstitutions(): Promise<FinancialInstitution[]>;
  saveInstitution(input: SaveInstitutionInput): Promise<FinancialInstitution>;
  getTransactions(): Promise<Transaction[]>;
  saveTransaction(input: SaveTransactionInput): Promise<Transaction>;
  setInitialBalance(input: InitialBalanceInput): Promise<FinanceSummary>;
}
