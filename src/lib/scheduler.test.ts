import { describe, expect, it } from "vitest";
import { generateStudyPlan, scoreTask } from "@/lib/scheduler";
import type { PlannerData, StudyTask } from "@/lib/types";

const now = new Date("2026-09-14T09:00:00.000Z");
const urgent: StudyTask = { id: "urgent", courseId: "cse", title: "Project", type: "PROJECT", dueAt: "2026-09-16T23:00:00.000Z", estimatedMins: 240, difficulty: 5, progress: 0, priority: 5 };
const later: StudyTask = { ...urgent, id: "later", dueAt: "2026-09-25T23:00:00.000Z", title: "Reading", difficulty: 2, priority: 2 };

describe("study scheduler", () => {
  it("scores urgent, difficult work above a distant low-priority task", () => {
    expect(scoreTask(urgent, now).score).toBeGreaterThan(scoreTask(later, now).score);
  });

  it("splits work into realistic sessions and respects availability", () => {
    const data: PlannerData = { courses: [], tasks: [urgent], blockedTimes: [], sessions: [], availability: [{ dayOfWeek: 1, startMins: 600, endMins: 840 }, { dayOfWeek: 2, startMins: 600, endMins: 840 }] };
    const result = generateStudyPlan(data, now);
    expect(result.sessions).toHaveLength(3);
    expect(result.sessions.every((session) => new Date(session.endsAt).getTime() - new Date(session.startsAt).getTime() <= 90 * 60_000)).toBe(true);
  });
});
