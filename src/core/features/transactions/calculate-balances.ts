import type { FinancialCategoryType } from "../../../shared/contracts/finance";

interface BalanceTransaction {
  amountCents: number;
  type: FinancialCategoryType;
  isConfirmed: boolean;
}

export function calculateBalances(initialBalanceCents: number, transactions: BalanceTransaction[]) {
  let availableCents = initialBalanceCents;
  let projectedCents = initialBalanceCents;

  for (const transaction of transactions) {
    const signedAmount =
      transaction.type === "income" ? transaction.amountCents : -transaction.amountCents;
    projectedCents += signedAmount;
    if (transaction.isConfirmed) availableCents += signedAmount;
  }

  return { availableCents, projectedCents };
}
