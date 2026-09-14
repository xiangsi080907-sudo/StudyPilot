import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion } = vi.hoisted(() => ({ createCompletion: vi.fn() }));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: createCompletion } };
  },
}));

import { answerStudyQuestion, deterministicAssistant } from "@/lib/assistant";
import type { PlannerData } from "@/lib/types";

const now = new Date("2026-09-15T12:00:00.000Z");

function makePlannerData(): PlannerData {
  return {
    courses: [
      { id: "math", code: "MATH 101", name: "Calculus", color: "#7567F8", icon: "function", priority: 5, currentGrade: 3.3, targetGrade: 3.7 },
      { id: "chem", code: "CHEM 110", name: "Chemistry", color: "#20A36B", icon: "book", priority: 4, currentGrade: 3.0, targetGrade: 3.5 },
    ],
    tasks: [
      { id: "calculus-set", courseId: "math", title: "Calculus problem set", type: "ASSIGNMENT", dueAt: "2026-09-16T18:00:00.000Z", estimatedMins: 120, difficulty: 4, progress: 25, priority: 5 },
      { id: "chem-lab", courseId: "chem", title: "Chemistry lab report", type: "PROJECT", dueAt: "2026-09-14T18:00:00.000Z", estimatedMins: 180, difficulty: 4, progress: 20, priority: 4 },
      { id: "chem-quiz", courseId: "chem", title: "Chemistry quiz review", type: "QUIZ", dueAt: "2026-09-18T18:00:00.000Z", estimatedMins: 90, difficulty: 3, progress: 0, priority: 3 },
    ],
    availability: [{ dayOfWeek: 1, startMins: 1020, endMins: 1200 }],
    blockedTimes: [],
    sessions: [
      { id: "planned", courseId: "math", taskId: "calculus-set", startsAt: "2026-09-15T16:00:00.000Z", endsAt: "2026-09-15T17:00:00.000Z", activity: "Practice derivatives", rationale: "Prepare for the problem set", status: "PLANNED" },
      { id: "completed", courseId: "math", taskId: "calculus-set", startsAt: "2026-09-14T16:00:00.000Z", endsAt: "2026-09-14T17:00:00.000Z", activity: "Review limits", rationale: "Completed practice", status: "COMPLETED", actualMins: 50 },
    ],
  };
}

const originalApiKey = process.env.OPENAI_API_KEY;

describe("rule-based assistant fallback", () => {
  beforeEach(() => {
    createCompletion.mockReset();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("recommends a concrete urgent task for tonight", () => {
    const answer = deterministicAssistant("What should I work on tonight?", makePlannerData(), now);

    expect(answer).toContain("Practice derivatives");
    expect(answer).toContain("Calculus");
  });

  it("grounds behind-status guidance in overdue tasks", () => {
    const answer = deterministicAssistant("Am I behind?", makePlannerData(), now);

    expect(answer).toContain("overdue");
    expect(answer).toContain("Chemistry lab report");
  });

  it("guides a user with no courses or tasks through onboarding", () => {
    const answer = deterministicAssistant("What should I prioritize?", { courses: [], tasks: [], availability: [], blockedTimes: [], sessions: [] }, now);

    expect(answer).toMatch(/Add a course/i);
    expect(answer).not.toContain("Calculus");
  });

  it("summarizes real upcoming deadlines", () => {
    const answer = deterministicAssistant("What is due soon?", makePlannerData(), now);

    expect(answer).toContain("Calculus problem set");
    expect(answer).toContain("Chemistry quiz review");
    expect(answer).toContain("Chemistry lab report");
  });

  it("ranks the user's actual tasks for prioritization without inventing tasks", () => {
    const answer = deterministicAssistant("What should I prioritize?", makePlannerData(), now);

    expect(answer).toContain("Chemistry lab report");
    expect(answer).toContain("Calculus problem set");
    expect(answer).not.toContain("History essay");
  });

  it("uses a subtle planner-based note when OpenAI is not configured", async () => {
    const result = await answerStudyQuestion("What should I prioritize?", makePlannerData());

    expect(result).toMatchObject({ source: "planner", notice: "Based on your StudyPilot plan." });
    expect(result.answer).toContain("Calculus problem set");
  });

  it("uses the useful fallback when an OpenAI request fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    createCompletion.mockRejectedValue(new Error("upstream unavailable"));

    const result = await answerStudyQuestion("How should I study for my calculus exam?", makePlannerData());

    expect(result).toMatchObject({ source: "planner", notice: expect.stringMatching(/AI service is unavailable/i) });
    expect(result.answer).toContain("Calculus");
    expect(result.answer).not.toContain("History essay");
  });
});
