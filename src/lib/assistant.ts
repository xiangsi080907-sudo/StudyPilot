import OpenAI from "openai";
import { formatShortDate, minutesBetween } from "@/lib/date";
import { calculateWeeklyStudyTime } from "@/lib/dashboard";
import { formatGpa } from "@/lib/gpa";
import { scoreTask } from "@/lib/scheduler";
import type { Course, PlannerData, ScoredTask, StudyTask } from "@/lib/types";

type TaskInsight = ScoredTask & { course?: Course; plannedMins: number };

function formatMinutes(minutes: number): string {
  const rounded = Math.max(0, Math.round(minutes));
  if (rounded < 60) return `${rounded} minutes`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function taskMention(task: StudyTask, course?: Course): string {
  return `“${task.title}”${course ? ` for ${course.name} (${course.code})` : ""}`;
}

function dueMention(task: StudyTask): string {
  return `${taskMention(task)} — due ${formatShortDate(task.dueAt)}`;
}

function sameLocalDay(left: Date | string, right: Date): boolean {
  return new Date(left).toDateString() === right.toDateString();
}

function courseMentionedIn(question: string, course: Course): boolean {
  const normalizedName = course.name.toLowerCase();
  if (question.includes(normalizedName) || question.includes(course.code.toLowerCase())) return true;
  return normalizedName.split(/\s+/).some((term) => term.length >= 4 && question.includes(term));
}

function studyInsights(data: PlannerData, now: Date): TaskInsight[] {
  return data.tasks
    .filter((task) => task.progress < 100)
    .map((task) => {
      const plannedMins = data.sessions
        .filter((session) => session.status === "PLANNED" && session.taskId === task.id)
        .reduce((total, session) => total + minutesBetween(session.startsAt, session.endsAt), 0);
      return { ...scoreTask(task, now), course: data.courses.find((course) => course.id === task.courseId), plannedMins };
    })
    .sort((left, right) => right.score - left.score);
}

function suggestedBlockMinutes(remainingMins: number): number {
  if (remainingMins <= 30) return Math.max(15, remainingMins);
  return Math.min(60, remainingMins);
}

export function deterministicAssistant(question: string, data: PlannerData, now = new Date()): string {
  const normalized = question.toLowerCase();
  const ranked = studyInsights(data, now);
  const top = ranked[0];
  const matchingCourse = data.courses.find((course) => courseMentionedIn(normalized, course));
  if (!top) {
    if (/(gpa|grade)/.test(normalized) && matchingCourse?.targetGrade !== undefined) return `Your target GPA for ${matchingCourse.name} (${matchingCourse.code}) is ${formatGpa(matchingCourse.targetGrade)}.`;
    return data.courses.length
      ? "You don’t have any active tasks yet. Add your next assignment, exam, or reading to get a personalized recommendation."
      : "Add a course and its next assignment or exam, then I can help you decide what to study and when.";
  }

  const overdue = ranked.filter((item) => new Date(item.task.dueAt) < now);
  const upcoming = [...ranked].filter((item) => new Date(item.task.dueAt) >= now).sort((left, right) => new Date(left.task.dueAt).getTime() - new Date(right.task.dueAt).getTime());
  const matchingTasks = matchingCourse ? ranked.filter((item) => item.task.courseId === matchingCourse.id) : [];
  const plannedNextWeek = data.sessions
    .filter((session) => session.status === "PLANNED" && new Date(session.startsAt) >= now && new Date(session.startsAt).getTime() < now.getTime() + 7 * 86_400_000)
    .reduce((total, session) => total + minutesBetween(session.startsAt, session.endsAt), 0);
  const weeklyStudy = calculateWeeklyStudyTime(data.sessions, now);

  if (/(behind|overdue|falling behind|catch up)/.test(normalized)) {
    if (overdue.length) {
      const first = overdue[0];
      return `${overdue.length === 1 ? "One task is overdue" : `${overdue.length} tasks are overdue`}: ${dueMention(first.task)}. Make a ${formatMinutes(suggestedBlockMinutes(first.remainingMins))} recovery block for it before adding new work.`;
    }
    const next = upcoming[0];
    return `No active work is overdue. You recorded ${formatMinutes(weeklyStudy.currentWeekMinutes)} this week and have ${formatMinutes(plannedNextWeek)} planned over the next seven days. ${next ? `Your nearest deadline is ${dueMention(next.task)}.` : "Add a deadline when you know it so I can flag risk earlier."}`;
  }

  if (/(due|deadline|upcoming)/.test(normalized)) {
    const deadlines = upcoming.slice(0, 3);
    if (!deadlines.length) return overdue.length ? `No future deadlines are recorded. First, catch up on ${dueMention(overdue[0].task)}.` : "No upcoming deadlines are recorded. Add due dates to receive deadline-based recommendations.";
    const overdueLead = overdue.length ? `${overdue.length === 1 ? `One task is overdue: ${dueMention(overdue[0].task)}` : `${overdue.length} tasks are overdue, including ${dueMention(overdue[0].task)}`}; ` : "";
    return `${overdueLead}Next up: ${deadlines.map((item) => dueMention(item.task)).join("; ")}.`;
  }

  if (/(gpa|grade)/.test(normalized)) {
    if (matchingCourse?.targetGrade !== undefined) return `Your target GPA for ${matchingCourse.name} (${matchingCourse.code}) is ${formatGpa(matchingCourse.targetGrade)}. Keep its next task visible in your plan so progress and study time stay connected.`;
    if (matchingCourse) return `No target GPA is recorded for ${matchingCourse.name} yet. Add one in Courses to make that goal visible alongside your workload.`;
  }

  if (/(exam|quiz|test|prepare|memorize|study for)/.test(normalized)) {
    if (!matchingCourse) return "I don’t see a matching course in your plan. For any exam, use short practice or active-recall blocks, review mistakes, and revisit weak areas on a later day. Add the course and exam deadline for a tailored plan.";
    const focus = matchingTasks.find((item) => item.task.type === "EXAM" || item.task.type === "QUIZ") ?? matchingTasks[0];
    if (!focus) return `There are no active tasks recorded for ${matchingCourse.name}. For exam prep, create the exam task and its date, then use practice problems or active recall and review mistakes between sessions.`;
    return `For ${matchingCourse.name}, start with ${taskMention(focus.task, matchingCourse)} for ${formatMinutes(suggestedBlockMinutes(focus.remainingMins))}. Use practice problems or active recall, review missed items, then revisit weak areas in a later block. ${focus.task.dueAt ? `It is due ${formatShortDate(focus.task.dueAt)}.` : ""}`;
  }

  if (/(how much|how long|hours|time should i study)/.test(normalized)) {
    const remaining = ranked.reduce((total, item) => total + item.remainingMins, 0);
    const recurringAvailability = data.availability.reduce((total, window) => total + window.endMins - window.startMins, 0);
    const availabilitySummary = recurringAvailability ? `Your recurring availability totals ${formatMinutes(recurringAvailability)} each week before conflicts.` : "No recurring availability is recorded yet.";
    return `Your active tasks have about ${formatMinutes(remaining)} of estimated work remaining, with ${formatMinutes(plannedNextWeek)} already planned over the next seven days. ${availabilitySummary} Start by protecting a ${formatMinutes(suggestedBlockMinutes(top.remainingMins))} block for ${taskMention(top.task, top.course)}.`;
  }

  if (/(tonight|this evening)/.test(normalized)) {
    const plannedTonight = data.sessions.find((session) => session.status === "PLANNED" && sameLocalDay(session.startsAt, now));
    if (plannedTonight) {
      const plannedCourse = data.courses.find((course) => course.id === plannedTonight.courseId);
      return `Tonight, begin with your planned session “${plannedTonight.activity}”${plannedCourse ? ` for ${plannedCourse.name} (${plannedCourse.code})` : ""}. It protects ${formatMinutes(minutesBetween(plannedTonight.startsAt, plannedTonight.endsAt))} of focused time; take a short reset before any second block.`;
    }
    return `Tonight, start with ${taskMention(top.task, top.course)} for ${formatMinutes(suggestedBlockMinutes(top.remainingMins))}. It is due ${formatShortDate(top.task.dueAt)}, is ${top.task.progress}% complete, and has about ${formatMinutes(top.remainingMins - top.plannedMins)} not yet covered by planned sessions.`;
  }

  if (/(prioritize|priority|what should i work on|attention)/.test(normalized)) {
    const priorities = ranked.slice(0, 3).map((item, index) => `${index + 1}. ${dueMention(item.task)} (${formatMinutes(item.remainingMins)} remaining)`).join(" ");
    return `Prioritize: ${priorities}`;
  }

  return `Start with ${taskMention(top.task, top.course)}. It is due ${formatShortDate(top.task.dueAt)}, is ${top.task.progress}% complete, and has about ${formatMinutes(top.remainingMins)} remaining. ${top.plannedMins ? `${formatMinutes(top.plannedMins)} is already planned for it.` : "Schedule a focused block to make progress today."}`;
}

export async function answerStudyQuestion(question: string, data: PlannerData): Promise<{ answer: string; source: "ai" | "planner"; notice?: string }> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      answer: deterministicAssistant(question, data),
      source: "planner",
      notice: "Based on your StudyPilot plan.",
    };
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const courses = data.courses.map((course) => ({ code: course.code, name: course.name, targetGpa: course.targetGrade })).slice(0, 25);
    const context = data.tasks.map((task) => ({ title: task.title, type: task.type, dueAt: task.dueAt, progress: task.progress, estimatedHoursRemaining: Math.ceil(task.estimatedMins * (1 - task.progress / 100) / 60), course: data.courses.find((course) => course.id === task.courseId)?.code })).slice(0, 25);
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        { role: "system", content: "You are StudyPilot's practical study coach. Use only the supplied, minimal academic context. Give concise, specific guidance in under 120 words; do not invent facts." },
        { role: "user", content: JSON.stringify({ question, courses, activeTasks: context }) },
      ],
    });
    return { answer: response.choices[0]?.message.content?.trim() || deterministicAssistant(question, data), source: "ai" };
  } catch {
    return {
      answer: deterministicAssistant(question, data),
      source: "planner",
      notice: "Based on your StudyPilot plan while the AI service is unavailable.",
    };
  }
}
