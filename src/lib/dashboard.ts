import { minutesBetween } from "@/lib/date";
import type { StudySession } from "@/lib/types";

export function greetingForLocalTime(now: Date): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDashboardGreeting(name: string, now: Date): string {
  return `${greetingForLocalTime(now)}, ${name}`;
}

export function formatStudyHours(minutes: number): string {
  return `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)}h`;
}

function startOfWeek(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function completedMinutesBetween(sessions: StudySession[], start: Date, end: Date): number {
  return sessions.reduce((total, session) => {
    const startedAt = new Date(session.startsAt);
    if (session.status !== "COMPLETED" || startedAt < start || startedAt >= end) return total;
    return total + (session.actualMins ?? minutesBetween(session.startsAt, session.endsAt));
  }, 0);
}

export function calculateWeeklyStudyTime(sessions: StudySession[], now: Date) {
  const currentWeekStart = startOfWeek(now);
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);

  const currentWeekMinutes = completedMinutesBetween(sessions, currentWeekStart, nextWeekStart);
  const previousWeekMinutes = completedMinutesBetween(sessions, previousWeekStart, currentWeekStart);
  return { currentWeekMinutes, previousWeekMinutes, differenceMinutes: currentWeekMinutes - previousWeekMinutes };
}

export function formatStudyTimeComparison(currentWeekMinutes: number, previousWeekMinutes: number): string {
  if (currentWeekMinutes === 0 && previousWeekMinutes === 0) return "No study time recorded last week";
  if (currentWeekMinutes === previousWeekMinutes) return "Same as last week";
  const difference = currentWeekMinutes - previousWeekMinutes;
  return `${difference > 0 ? "+" : "-"}${formatStudyHours(Math.abs(difference))} from last week`;
}
