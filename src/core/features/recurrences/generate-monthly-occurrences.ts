import { civilDateSchema } from "../../dates/civil-date";

export function generateMonthlyOccurrences(startDate: string, count: number): string[] {
  civilDateSchema.parse(startDate);
  if (!Number.isInteger(count) || count < 1) throw new Error("Quantidade inválida");
  const [year, month, day] = startDate.split("-").map(Number);

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  });
}
