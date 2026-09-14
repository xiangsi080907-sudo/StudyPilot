import { beforeEach, describe, expect, it, vi } from "vitest";

const { answerStudyQuestion, currentUserId, loadPlannerData } = vi.hoisted(() => ({
  answerStudyQuestion: vi.fn(),
  currentUserId: vi.fn(),
  loadPlannerData: vi.fn(),
}));

vi.mock("@/lib/assistant", () => ({ answerStudyQuestion }));
vi.mock("@/lib/current-user", () => ({ currentUserId }));
vi.mock("@/lib/planner-repository", () => ({ loadPlannerData }));

import { POST } from "@/app/api/assistant/route";

const plannerData = { courses: [], tasks: [], availability: [], blockedTimes: [], sessions: [] };

function assistantRequest(body: unknown) {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/assistant", () => {
  beforeEach(() => {
    answerStudyQuestion.mockReset();
    currentUserId.mockReset();
    loadPlannerData.mockReset();
    currentUserId.mockResolvedValue("student-1");
    loadPlannerData.mockResolvedValue(plannerData);
  });

  it("accepts a valid study question and loads only the authenticated user's planner data", async () => {
    answerStudyQuestion.mockResolvedValue({ answer: "Start with practice problems.", source: "planner" });

    const response = await POST(assistantRequest({ question: "  How should I study for my calculus exam?  " }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ answer: "Start with practice problems." });
    expect(loadPlannerData).toHaveBeenCalledWith("student-1");
    expect(answerStudyQuestion).toHaveBeenCalledWith("How should I study for my calculus exam?", plannerData);
  });

  it("rejects empty or too-short prompts with a validation error", async () => {
    const response = await POST(assistantRequest({ question: "  " }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/3 and 500/i) });
    expect(loadPlannerData).not.toHaveBeenCalled();
  });

  it("does not allow unauthenticated requests to supply personal planner data", async () => {
    currentUserId.mockResolvedValue(null);

    const response = await POST(assistantRequest({ question: "What should I work on tonight?", data: plannerData }));

    expect(response.status).toBe(401);
  });

  it("continues to support explicitly marked demo questions", async () => {
    currentUserId.mockResolvedValue(null);
    answerStudyQuestion.mockResolvedValue({ answer: "Try the first demo task.", source: "planner" });

    const response = await POST(assistantRequest({ question: "What should I work on tonight?", demo: true, data: plannerData }));

    expect(response.status).toBe(200);
    expect(answerStudyQuestion).toHaveBeenCalledWith("What should I work on tonight?", plannerData);
  });

  it("returns a service error for an unexpected assistant failure instead of a misleading validation error", async () => {
    answerStudyQuestion.mockRejectedValue(new Error("service unavailable"));

    const response = await POST(assistantRequest({ question: "Help me prepare for my chemistry test." }));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringMatching(/unavailable/i) });
  });
});
