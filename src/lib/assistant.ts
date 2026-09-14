import OpenAI from "openai";
import { formatShortDate, minutesBetween } from "@/lib/date";
import { scoreTask } from "@/lib/scheduler";
import type { PlannerData } from "@/lib/types";

export function deterministicAssistant(question: string, data: PlannerData): string {
  const normalized = question.toLowerCase();
  const ranked = data.tasks.filter((task) => task.progress < 100).map((task) => scoreTask(task)).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top) return "You’re clear on every active task. Take a well-earned break or add your next milestone.";
  const course = data.courses.find((item) => item.id === top.task.courseId);
  const planned = data.sessions.filter((session) => session.status === "PLANNED" && session.taskId === top.task.id).reduce((sum, session) => sum + minutesBetween(session.startsAt, session.endsAt), 0);
  const remaining = Math.max(0, top.remainingMins - planned);

  if (normalized.includes("behind") || normalized.includes("finish")) {
    return `${top.task.title} is your main risk: it’s ${top.task.progress}% complete and due ${formatShortDate(top.task.dueAt)}. ${planned ? `${Math.round(planned / 60)} planned hours are already protected; ` : ""}reserve about ${Math.ceil(remaining / 60)} more focused hours to finish comfortably.`;
  }
  if (normalized.includes("course") || normalized.includes("attention")) {
    return `${course?.code ?? "This course"} needs the most attention right now. ${top.task.title} combines a near deadline, ${top.task.difficulty}/5 difficulty, and ${top.task.priority}/5 priority.`;
  }
  if (normalized.includes("tonight") || normalized.includes("study")) {
    const today = data.sessions.filter((session) => session.status === "PLANNED" && new Date(session.startsAt).toDateString() === new Date().toDateString());
    if (today.length) return `Tonight, start with “${today[0].activity}” (${course?.code ?? "your top course"}). It directly reduces your highest-impact deadline. Then take a 15-minute reset before your next block.`;
  }
  return `Prioritize ${top.task.title} for ${course?.code ?? "your top course"}. It is due ${formatShortDate(top.task.dueAt)}, has ${Math.ceil(top.remainingMins / 60)} hours remaining, and currently has the highest scheduling score.`;
}

export async function answerStudyQuestion(question: string, data: PlannerData): Promise<{ answer: string; source: "ai" | "planner"; notice?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: deterministicAssistant(question, data),
      source: "planner",
      notice: "AI is not configured, so this suggestion is based on your StudyPilot plan.",
    };
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const context = data.tasks.map((task) => ({ title: task.title, type: task.type, dueAt: task.dueAt, progress: task.progress, estimatedHoursRemaining: Math.ceil(task.estimatedMins * (1 - task.progress / 100) / 60), course: data.courses.find((course) => course.id === task.courseId)?.code })).slice(0, 25);
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        { role: "system", content: "You are StudyPilot's practical study coach. Use only the supplied, minimal academic context. Give concise, specific guidance in under 120 words; do not invent facts." },
        { role: "user", content: JSON.stringify({ question, activeTasks: context }) },
      ],
    });
    return { answer: response.choices[0]?.message.content?.trim() || deterministicAssistant(question, data), source: "ai" };
  } catch {
    return {
      answer: deterministicAssistant(question, data),
      source: "planner",
      notice: "The AI service is unavailable right now, so this suggestion is based on your StudyPilot plan.",
    };
  }
}
