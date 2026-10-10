import { z } from "zod";

export const moneyInCentsSchema = z.number().int().safe().brand<"MoneyInCents">();

export type MoneyInCents = z.infer<typeof moneyInCentsSchema>;
