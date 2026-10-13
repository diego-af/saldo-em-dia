import { civilDateSchema } from "../../dates/civil-date";
import { moneyInCentsSchema } from "../../money/money-in-cents";

export interface PlannedDebtInstallment {
  number: number;
  amountCents: number;
  dueDate: string;
}

export function planDebtInstallments(
  totalCents: number,
  installmentCount: number,
  firstDueDate: string,
): PlannedDebtInstallment[] {
  moneyInCentsSchema.refine((value) => value > 0).parse(totalCents);
  civilDateSchema.parse(firstDueDate);
  if (!Number.isInteger(installmentCount) || installmentCount < 1 || installmentCount > 360) {
    throw new Error("Quantidade de parcelas inválida");
  }

  const [year, month, day] = firstDueDate.split("-").map(Number);
  const regularAmount = Math.floor(totalCents / installmentCount);
  const remainder = totalCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    return {
      number: index + 1,
      amountCents: regularAmount + (index < remainder ? 1 : 0),
      dueDate: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`,
    };
  });
}
