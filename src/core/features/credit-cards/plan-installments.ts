import { civilDateSchema } from "../../dates/civil-date";
import { moneyInCentsSchema } from "../../money/money-in-cents";

interface PlanInstallmentsInput {
  totalCents: number;
  installmentCount: number;
  purchaseDate: string;
  closingDay: number;
  dueDay: number;
}

export interface PlannedInstallment {
  number: number;
  amountCents: number;
  invoiceMonth: string;
  dueDate: string;
}

function monthWithOffset(year: number, month: number, offset: number) {
  const value = year * 12 + month - 1 + offset;
  return { year: Math.floor(value / 12), month: (value % 12) + 1 };
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function planInstallments(input: PlanInstallmentsInput): PlannedInstallment[] {
  const totalCents = moneyInCentsSchema.refine((value) => value > 0).parse(input.totalCents);
  const purchaseDate = civilDateSchema.parse(input.purchaseDate);
  for (const day of [input.closingDay, input.dueDay]) {
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("Dia inválido");
  }
  if (!Number.isInteger(input.installmentCount) || input.installmentCount < 1) {
    throw new Error("Quantidade de parcelas inválida");
  }

  const [year, month, day] = purchaseDate.split("-").map(Number);
  const closingDateDay = Math.min(input.closingDay, daysInMonth(year, month));
  const firstInvoiceOffset = day <= closingDateDay ? 0 : 1;
  const regularAmount = Math.floor(totalCents / input.installmentCount);
  const firstAmount = regularAmount + (totalCents % input.installmentCount);

  return Array.from({ length: input.installmentCount }, (_, index) => {
    const invoice = monthWithOffset(year, month, firstInvoiceOffset + index);
    const due = monthWithOffset(
      invoice.year,
      invoice.month,
      input.dueDay <= input.closingDay ? 1 : 0,
    );
    return {
      number: index + 1,
      amountCents: index === 0 ? firstAmount : regularAmount,
      invoiceMonth: `${invoice.year}-${twoDigits(invoice.month)}`,
      dueDate: `${due.year}-${twoDigits(due.month)}-${twoDigits(Math.min(input.dueDay, daysInMonth(due.year, due.month)))}`,
    };
  });
}
