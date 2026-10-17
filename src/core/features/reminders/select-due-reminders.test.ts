import { describe, expect, it } from "vitest";
import { civilDateSchema } from "../../dates/civil-date";
import { pendingReminder, selectDueReminders } from "./select-due-reminders";

const reminder = (dueDate: string) =>
  pendingReminder({
    key: "debt-installment:00000000-0000-4000-8000-000000000001",
    title: "Parcela",
    body: "Pagamento pendente",
    dueDate: civilDateSchema.parse(dueDate),
  });

describe("due reminders", () => {
  it("includes two days before through every overdue day", () => {
    const today = civilDateSchema.parse("2026-10-17");
    expect(
      selectDueReminders(
        [
          reminder("2026-10-16"),
          reminder("2026-10-17"),
          reminder("2026-10-19"),
          reminder("2026-10-20"),
        ],
        today,
      ).map(({ dueDate }) => dueDate),
    ).toEqual(["2026-10-16", "2026-10-17", "2026-10-19"]);
  });

  it("handles month boundaries as calendar days", () => {
    expect(
      selectDueReminders([reminder("2026-11-01")], civilDateSchema.parse("2026-10-30")),
    ).toHaveLength(1);
  });
});
