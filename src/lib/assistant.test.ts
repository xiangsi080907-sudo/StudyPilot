import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createCompletion } = vi.hoisted(() => ({ createCompletion: vi.fn() }));

vi.mock("openai", () => ({
  default: class OpenAI {
    chat = { completions: { create: createCompletion } };
  },
}));

import { answerStudyQuestion } from "@/lib/assistant";

const plannerData = {
  courses: [{ id: "course-1", code: "MATH 101", name: "Calculus", color: "#7567F8", icon: "function" as const, priority: 5 }],
  tasks: [{ id: "task-1", courseId: "course-1", title: "Practice derivatives", type: "EXAM" as const, dueAt: "2026-10-01T12:00:00.000Z", estimatedMins: 180, difficulty: 4, progress: 0, priority: 5 }],
  availability: [],
  blockedTimes: [],
  sessions: [],
};

const originalApiKey = process.env.OPENAI_API_KEY;

describe("assistant fallback", () => {
  beforeEach(() => {
    createCompletion.mockReset();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalApiKey;
  });

  it("returns an honest planner-based fallback when AI is not configured", async () => {
    const result = await answerStudyQuestion("How should I study for my calculus exam?", plannerData);

    expect(result).toMatchObject({ source: "planner", notice: expect.stringMatching(/not configured/i) });
    expect(result.answer).toContain("Practice derivatives");
  });

  it("returns an honest planner-based fallback when the AI request fails", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    createCompletion.mockRejectedValue(new Error("upstream unavailable"));

    const result = await answerStudyQuestion("Help me prepare for my chemistry test.", plannerData);

    expect(result).toMatchObject({ source: "planner", notice: expect.stringMatching(/unavailable/i) });
    expect(result.answer).toContain("Practice derivatives");
  });
});
