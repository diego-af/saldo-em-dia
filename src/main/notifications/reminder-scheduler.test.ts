import { describe, expect, it, vi } from "vitest";
import { civilDateSchema } from "../../core/dates/civil-date";
import { pendingReminder } from "../../core/features/reminders/select-due-reminders";
import type { ReminderRepository } from "../database/reminder-repository";
import { runReminderCheck } from "./reminder-scheduler";

function repository(delivered = false): ReminderRepository {
  return {
    listPending: () => [
      pendingReminder({
        key: "debt-installment:00000000-0000-4000-8000-000000000001",
        title: "Parcela",
        body: "Vence em 17/10/2026",
        dueDate: civilDateSchema.parse("2026-10-17"),
      }),
    ],
    listSilenced: () => [],
    silence: vi.fn(),
    wasDelivered: () => delivered,
    markDelivered: vi.fn(),
  };
}

describe("reminder check", () => {
  it("notifies once after 9h and records delivery", () => {
    const reminders = repository();
    const notify = vi.fn(() => true);
    runReminderCheck(reminders, notify, new Date(2026, 9, 17, 9));
    expect(notify).toHaveBeenCalledOnce();
    expect(reminders.markDelivered).toHaveBeenCalledWith(
      "debt-installment:00000000-0000-4000-8000-000000000001",
      "2026-10-17",
      expect.any(String),
    );
  });

  it("does not notify before 9h or after delivery on the same day", () => {
    const notify = vi.fn(() => true);
    runReminderCheck(repository(), notify, new Date(2026, 9, 17, 8, 59));
    runReminderCheck(repository(true), notify, new Date(2026, 9, 17, 12));
    expect(notify).not.toHaveBeenCalled();
  });
});
