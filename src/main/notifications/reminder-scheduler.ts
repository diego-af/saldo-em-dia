import { civilDateSchema } from "../../core/dates/civil-date";
import { selectDueReminders } from "../../core/features/reminders/select-due-reminders";
import type { ReminderRepository } from "../database/reminder-repository";

export interface ReminderNotification {
  title: string;
  body: string;
}

function localDate(date: Date) {
  return civilDateSchema.parse(
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
  );
}

export function runReminderCheck(
  repository: ReminderRepository,
  notify: (notification: ReminderNotification) => boolean,
  now = new Date(),
): void {
  if (now.getHours() < 9) return;
  const today = localDate(now);
  for (const reminder of selectDueReminders(repository.listPending(), today)) {
    if (repository.wasDelivered(reminder.key, today)) continue;
    if (notify({ title: reminder.title, body: reminder.body })) {
      repository.markDelivered(reminder.key, today, now.toISOString());
    }
  }
}

export function scheduleReminderChecks(
  repository: ReminderRepository,
  notify: (notification: ReminderNotification) => boolean,
): () => void {
  let timer: NodeJS.Timeout;
  const schedule = () => {
    const now = new Date();
    runReminderCheck(repository, notify, now);
    const next = new Date(now);
    next.setHours(9, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    timer = setTimeout(schedule, next.getTime() - now.getTime());
  };
  schedule();
  return () => clearTimeout(timer);
}
