import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { transactionSchema } from "../../../../shared/contracts/finance";
import { TransactionForm } from "./transaction-form";

describe("transaction form", () => {
  it("warns that correcting a confirmed transaction recalculates finances", () => {
    const transaction = transactionSchema.parse({
      id: "9bfcfbaa-ce80-4c8c-bdca-a63b71d966d4",
      amountCents: 25_00,
      categoryId: "daabbd45-f8cb-42fd-a495-028a2795e0d9",
      date: "2026-10-09",
      isConfirmed: true,
      createdAt: "2026-10-09T12:00:00.000Z",
      updatedAt: "2026-10-09T12:00:00.000Z",
    });

    const html = renderToStaticMarkup(
      <TransactionForm
        transaction={transaction}
        categories={[]}
        institutions={[]}
        onCancel={() => undefined}
        onSaved={async () => undefined}
      />,
    );

    expect(html).toContain("Corrigir lançamento");
    expect(html).toContain("recalculará saldos, projeções e relatórios");
  });
});
