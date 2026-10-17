import { type ReminderKey, reminderKeySchema } from "../../../shared/contracts/reminder";
import { type CivilDate, civilDateSchema } from "../../dates/civil-date";

export interface PendingReminder {
  key: ReminderKey;
  title: string;
  body: string;
  dueDate: CivilDate;
}

function addDays(date: CivilDate, days: number): CivilDate {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return civilDateSchema.parse(result.toISOString().slice(0, 10));
}

export function selectDueReminders(
  reminders: PendingReminder[],
  today: CivilDate,
): PendingReminder[] {
  const lastEligibleDate = addDays(today, 2);
  return reminders.filter(({ dueDate }) => dueDate <= lastEligibleDate);
}

export function pendingReminder(input: PendingReminder): PendingReminder {
  return {
    ...input,
    key: reminderKeySchema.parse(input.key),
    dueDate: civilDateSchema.parse(input.dueDate),
  };
}
