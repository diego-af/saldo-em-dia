import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createDatabaseClient, type DatabaseClient } from "./database-client";
import { createFinanceRepository } from "./finance-repository";
import { createRecurrenceRepository } from "./recurrence-repository";

let client: DatabaseClient | undefined;

afterEach(() => client?.close());

describe("recurrence SQLite repository", () => {
  it("keeps past occurrences and changes cash only on confirmation", async () => {
    const now = () => new Date("2026-10-13T12:00:00.000Z");
    client = await createDatabaseClient(
      join(mkdtempSync(join(tmpdir(), "saldo-em-dia-recurrence-")), "app.sqlite"),
    );
    const finance = createFinanceRepository(client, now);
    const recurrences = createRecurrenceRepository(client, now);
    finance.setInitialBalance({ amountCents: 100_00, date: "2026-10-01" });
    const category = finance.saveCategory({ name: "Salário", type: "income" });

    const salary = recurrences.create({
      description: "Salário",
      categoryId: category.id,
      amountCents: 20_00,
      startDate: "2026-09-10",
      isSalary: true,
    });
    const occurrences = recurrences.listOccurrences(salary.id);

    expect(occurrences).toHaveLength(12);
    expect(occurrences[0]).toMatchObject({ dueDate: "2026-09-10", status: "overdue" });
    expect(finance.getSummary()).toMatchObject({
      availableCents: 100_00,
      projectedCents: 340_00,
    });

    recurrences.updateOccurrence({
      occurrenceId: occurrences[1].id,
      amountCents: 25_00,
      dueDate: "2026-10-11",
      scope: "future",
    });
    const updated = recurrences.listOccurrences(salary.id);
    expect(updated[0]).toMatchObject({ amountCents: 20_00, dueDate: "2026-09-10" });
    expect(updated[1]).toMatchObject({ amountCents: 25_00, dueDate: "2026-10-11" });
    expect(updated[2]).toMatchObject({ amountCents: 25_00, dueDate: "2026-11-11" });

    recurrences.confirmOccurrence({
      occurrenceId: updated[1].id,
      amountCents: 26_00,
      confirmationDate: "2026-10-13",
    });

    expect(recurrences.listOccurrences(salary.id)[1]).toMatchObject({
      amountCents: 25_00,
      actualAmountCents: 26_00,
      status: "confirmed",
    });
    expect(finance.getSummary().availableCents).toBe(126_00);
  });
});
