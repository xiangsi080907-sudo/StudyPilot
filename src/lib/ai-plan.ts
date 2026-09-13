import OpenAI from "openai";
import { generateStudyPlan } from "@/lib/scheduler";
import { aiPlanResponseSchema } from "@/lib/validation";
import type { PlannerData, PlanningResult } from "@/lib/types";

/**
 * The deterministic engine owns dates and duration constraints. When available,
 * an LLM enriches those fixed slots with concise, task-specific activities and reasons.
 * This prevents malformed model output from creating impossible calendar events.
 */
export async function generateAiAwarePlan(data: PlannerData): Promise<{ result: PlanningResult; source: "ai" | "deterministic" }> {
  const result = generateStudyPlan(data);
  if (!process.env.OPENAI_API_KEY || result.sessions.length === 0) return { result, source: "deterministic" };

  try {
    const taskById = new Map(data.tasks.map((task) => [task.id, task]));
    const slots = result.sessions.map(({ id, taskId, startsAt, endsAt }) => ({ id, taskId, startsAt, endsAt, task: taskId ? taskById.get(taskId)?.title : undefined }));
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return JSON only: { sessions: [{ id, taskId, startsAt, endsAt, activity, rationale }] }. Preserve every id, taskId, startsAt, and endsAt exactly. Make activity an actionable study step and rationale under 18 words. Do not add or omit sessions." },
        { role: "user", content: JSON.stringify({ slots }) },
      ],
    });
    const parsed = aiPlanResponseSchema.safeParse(JSON.parse(completion.choices[0]?.message.content ?? "{}"));
    if (!parsed.success || parsed.data.sessions.length !== result.sessions.length) return { result, source: "deterministic" };
    const enriched = new Map(parsed.data.sessions.map((session) => [session.id, session]));
    const valid = result.sessions.every((session) => {
      const candidate = enriched.get(session.id);
      if (!candidate) return false;
      return candidate.taskId === session.taskId && candidate.startsAt === session.startsAt && candidate.endsAt === session.endsAt;
    });
    if (!valid) return { result, source: "deterministic" };
    return {
      source: "ai",
      result: { ...result, sessions: result.sessions.map((session) => ({ ...session, activity: enriched.get(session.id)?.activity ?? session.activity, rationale: enriched.get(session.id)?.rationale ?? session.rationale })) },
    };
  } catch {
    return { result, source: "deterministic" };
  }
}
