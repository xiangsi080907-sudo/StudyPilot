import { addDays, atMinutes, minutesBetween, startOfDay } from "@/lib/date";
import type { PlannerData, PlanningResult, ScoredTask, StudySession, StudyTask } from "@/lib/types";

const MAX_SESSION_MINS = 90;
const MIN_SESSION_MINS = 45;
const BREAK_MINS = 15;
const PLAN_DAYS = 14;

export function scoreTask(task: StudyTask, now = new Date()): ScoredTask {
  const remainingMins = Math.max(0, Math.ceil(task.estimatedMins * (1 - task.progress / 100)));
  const daysUntilDue = Math.max(0, Math.ceil((new Date(task.dueAt).getTime() - now.getTime()) / 86_400_000));
  const urgency = 44 / (daysUntilDue + 1);
  const difficulty = task.difficulty * 4;
  const priority = task.priority * 4;
  const workload = Math.min(20, remainingMins / 45);
  const examBoost = task.type === "EXAM" || task.type === "QUIZ" ? 16 : 0;
  const incompleteBoost = task.progress < 30 ? 6 : 0;
  return { task, remainingMins, daysUntilDue, score: urgency + difficulty + priority + workload + examBoost + incompleteBoost };
}

function overlaps(start: Date, end: Date, otherStart: Date | string, otherEnd: Date | string): boolean {
  return start < new Date(otherEnd) && end > new Date(otherStart);
}

function isAvailable(start: Date, end: Date, data: PlannerData): boolean {
  const day = start.getDay();
  const startMins = start.getHours() * 60 + start.getMinutes();
  const endMins = end.getHours() * 60 + end.getMinutes();
  const hasWindow = data.availability.some((window) => window.dayOfWeek === day && startMins >= window.startMins && endMins <= window.endMins);
  if (!hasWindow) return false;
  return ![...data.blockedTimes, ...data.sessions]
    .filter((item) => !("status" in item) || item.status !== "SKIPPED")
    .some((item) => overlaps(start, end, item.startsAt, item.endsAt));
}

function slotsForDay(date: Date, data: PlannerData): Array<{ start: Date; end: Date }> {
  return data.availability
    .filter((window) => window.dayOfWeek === date.getDay())
    .flatMap((window) => {
      const slots: Array<{ start: Date; end: Date }> = [];
      let cursor = atMinutes(date, window.startMins);
      const limit = atMinutes(date, window.endMins);
      while (minutesBetween(cursor, limit) >= MIN_SESSION_MINS) {
        const duration = Math.min(MAX_SESSION_MINS, minutesBetween(cursor, limit));
        const end = new Date(cursor.getTime() + duration * 60_000);
        if (isAvailable(cursor, end, data)) slots.push({ start: cursor, end });
        cursor = new Date(end.getTime() + BREAK_MINS * 60_000);
      }
      return slots;
    });
}

/**
 * Produces bounded, availability-aware sessions. Existing sessions remain fixed;
 * callers should remove only future sessions in the same plan version before persisting a new result.
 */
export function generateStudyPlan(data: PlannerData, now = new Date()): PlanningResult {
  const scored = data.tasks
    .filter((task) => task.progress < 100 && new Date(task.dueAt) > now)
    .map((task) => scoreTask(task, now))
    .filter((item) => item.remainingMins > 0)
    .sort((a, b) => b.score - a.score);
  const remaining = new Map(scored.map((item) => [item.task.id, item.remainingMins]));
  const sessions: StudySession[] = [];
  const planVersion = `plan-${now.toISOString().slice(0, 10)}`;

  for (let dayOffset = 0; dayOffset < PLAN_DAYS && remaining.size > 0; dayOffset += 1) {
    const day = addDays(startOfDay(now), dayOffset);
    for (const slot of slotsForDay(day, { ...data, sessions: [...data.sessions, ...sessions] })) {
      const next = scored.find((item) => (remaining.get(item.task.id) ?? 0) >= MIN_SESSION_MINS && new Date(item.task.dueAt) >= slot.start);
      if (!next) continue;
      const left = remaining.get(next.task.id) ?? 0;
      const duration = Math.min(left, minutesBetween(slot.start, slot.end));
      if (duration < MIN_SESSION_MINS) continue;
      const end = new Date(slot.start.getTime() + duration * 60_000);
      sessions.push({
        id: `generated-${next.task.id}-${slot.start.getTime()}`,
        courseId: next.task.courseId,
        taskId: next.task.id,
        startsAt: slot.start.toISOString(),
        endsAt: end.toISOString(),
        activity: next.task.type === "EXAM" ? `Practice for ${next.task.title}` : `Work on ${next.task.title}`,
        rationale: `${next.daysUntilDue === 0 ? "Due today" : `Due in ${next.daysUntilDue} days`} · priority ${next.task.priority}/5 · ${next.task.progress}% complete`,
        status: "PLANNED",
        planVersion,
      });
      const newRemaining = left - duration;
      if (newRemaining < MIN_SESSION_MINS) remaining.delete(next.task.id);
      else remaining.set(next.task.id, newRemaining);
    }
  }

  return {
    sessions,
    unscheduledTaskIds: [...remaining.keys()],
    totalScheduledMins: sessions.reduce((sum, session) => sum + minutesBetween(session.startsAt, session.endsAt), 0),
  };
}
