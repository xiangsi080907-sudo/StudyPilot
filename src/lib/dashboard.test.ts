import { describe, expect, it } from "vitest";
import { calculateWeeklyStudyTime, formatDashboardGreeting, formatStudyTimeComparison, greetingForLocalTime } from "@/lib/dashboard";
import type { StudySession } from "@/lib/types";

function session(id: string, startsAt: Date, actualMins: number, status: StudySession["status"] = "COMPLETED"): StudySession {
  return {
    id,
    courseId: "course-1",
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 60 * 60_000).toISOString(),
    activity: "Review notes",
    rationale: "Test data",
    status,
    actualMins,
  };
}

describe("dashboard greeting", () => {
  it("uses the signed-in user's name and the browser's local hour", () => {
    expect(formatDashboardGreeting("Avery Student", new Date(2026, 8, 16, 9))).toBe("Good morning, Avery Student");
    expect(formatDashboardGreeting("Avery Student", new Date(2026, 8, 16, 14))).toBe("Good afternoon, Avery Student");
    expect(formatDashboardGreeting("Avery Student", new Date(2026, 8, 16, 19))).toBe("Good evening, Avery Student");
    expect(greetingForLocalTime(new Date(2026, 8, 16, 2))).toBe("Good evening");
    expect(formatDashboardGreeting("Avery Student", new Date(2026, 8, 16, 19))).not.toContain("Maya");
  });
});

describe("weekly study time", () => {
  it("shows a neutral comparison when a new user has no completed study history", () => {
    const result = calculateWeeklyStudyTime([], new Date(2026, 8, 16, 13));
    expect(result).toMatchObject({ currentWeekMinutes: 0, previousWeekMinutes: 0 });
    expect(formatStudyTimeComparison(result.currentWeekMinutes, result.previousWeekMinutes)).toBe("No study time recorded last week");
  });

  it("compares completed current- and previous-week study time without counting planned sessions", () => {
    const now = new Date(2026, 8, 16, 13);
    const result = calculateWeeklyStudyTime([
      session("current", new Date(2026, 8, 14, 9), 90),
      session("planned", new Date(2026, 8, 15, 9), 120, "PLANNED"),
      session("previous", new Date(2026, 8, 10, 9), 30),
    ], now);

    expect(result).toMatchObject({ currentWeekMinutes: 90, previousWeekMinutes: 30, differenceMinutes: 60 });
    expect(formatStudyTimeComparison(result.currentWeekMinutes, result.previousWeekMinutes)).toBe("+1h from last week");
  });
});
