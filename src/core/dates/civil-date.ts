import { z } from "zod";

const civilDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export const civilDateSchema = z
  .string()
  .regex(civilDatePattern)
  .refine((value) => {
    const match = civilDatePattern.exec(value);
    if (!match) return false;
    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Data civil inválida")
  .brand<"CivilDate">();

export type CivilDate = z.infer<typeof civilDateSchema>;
