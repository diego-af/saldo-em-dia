import { z } from "zod";
import { civilDateSchema } from "../../core/dates/civil-date";
import { moneyInCentsSchema } from "../../core/money/money-in-cents";

const positiveMoneySchema = moneyInCentsSchema.refine((value) => value > 0);

export const createRecurrenceInputSchema = z
  .object({
    description: z.string().trim().min(1).max(500),
    categoryId: z.string().uuid(),
    amountCents: positiveMoneySchema,
    startDate: civilDateSchema,
    isSalary: z.boolean(),
  })
  .strict();
export type CreateRecurrenceInput = z.input<typeof createRecurrenceInputSchema>;

export const recurrenceSchema = createRecurrenceInputSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type Recurrence = z.infer<typeof recurrenceSchema>;

export const recurrenceOccurrenceStatusSchema = z.enum(["pending", "overdue", "confirmed"]);
export const recurrenceOccurrenceSchema = z.object({
  id: z.string().uuid(),
  recurrenceId: z.string().uuid(),
  amountCents: positiveMoneySchema,
  actualAmountCents: positiveMoneySchema.nullable(),
  dueDate: civilDateSchema,
  confirmationDate: civilDateSchema.nullable(),
  status: recurrenceOccurrenceStatusSchema,
});
export type RecurrenceOccurrence = z.infer<typeof recurrenceOccurrenceSchema>;

export const updateRecurrenceOccurrenceInputSchema = z
  .object({
    occurrenceId: z.string().uuid(),
    amountCents: positiveMoneySchema,
    dueDate: civilDateSchema,
    scope: z.enum(["single", "future"]),
  })
  .strict();
export type UpdateRecurrenceOccurrenceInput = z.input<typeof updateRecurrenceOccurrenceInputSchema>;

export const confirmRecurrenceOccurrenceInputSchema = z
  .object({
    occurrenceId: z.string().uuid(),
    amountCents: positiveMoneySchema,
    confirmationDate: civilDateSchema,
  })
  .strict();
export type ConfirmRecurrenceOccurrenceInput = z.input<
  typeof confirmRecurrenceOccurrenceInputSchema
>;

export const recurrenceIdSchema = z.string().uuid();
export const recurrenceIpcChannels = {
  create: "recurrence:create",
  list: "recurrence:list",
  listOccurrences: "recurrence:list-occurrences",
  updateOccurrence: "recurrence:update-occurrence",
  confirmOccurrence: "recurrence:confirm-occurrence",
} as const;

export interface RecurrenceApi {
  create(input: CreateRecurrenceInput): Promise<Recurrence>;
  list(): Promise<Recurrence[]>;
  listOccurrences(recurrenceId: string): Promise<RecurrenceOccurrence[]>;
  updateOccurrence(input: UpdateRecurrenceOccurrenceInput): Promise<void>;
  confirmOccurrence(input: ConfirmRecurrenceOccurrenceInput): Promise<void>;
}
