import { z } from "zod";

const taskType = z.enum(["ASSIGNMENT", "QUIZ", "EXAM", "PROJECT", "READING", "OTHER"]);
const sessionStatus = z.enum(["PLANNED", "COMPLETED", "SKIPPED"]);

export const courseSchema = z.object({
  id: z.string().min(1), code: z.string().min(2).max(20), name: z.string().min(2).max(100), professor: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), icon: z.enum(["code", "function", "landmark", "book"]),
  currentGrade: z.number().min(0).max(100).optional(), targetGrade: z.number().min(0).max(100).optional(), priority: z.number().int().min(1).max(5),
});

export const taskSchema = z.object({
  id: z.string().min(1), courseId: z.string().min(1), title: z.string().min(2).max(160), type: taskType,
  dueAt: z.string().datetime(), estimatedMins: z.number().int().min(15).max(6000), difficulty: z.number().int().min(1).max(5),
  progress: z.number().int().min(0).max(100), priority: z.number().int().min(1).max(5), notes: z.string().max(5000).optional(), completedAt: z.string().datetime().optional(),
});

export const plannerDataSchema = z.object({
  courses: z.array(courseSchema).max(100), tasks: z.array(taskSchema).max(250),
  availability: z.array(z.object({ dayOfWeek: z.number().int().min(0).max(6), startMins: z.number().int().min(0).max(1439), endMins: z.number().int().min(1).max(1440) }).refine((window) => window.endMins > window.startMins)).max(28),
  blockedTimes: z.array(z.object({ startsAt: z.string().datetime(), endsAt: z.string().datetime(), reason: z.string().max(100).optional() })).max(100),
  sessions: z.array(z.object({ id: z.string().min(1), courseId: z.string().min(1), taskId: z.string().optional(), startsAt: z.string().datetime(), endsAt: z.string().datetime(), activity: z.string().min(1).max(240), rationale: z.string().max(400), status: sessionStatus, actualMins: z.number().int().min(0).max(1000).optional(), planVersion: z.string().max(100).optional() })).max(500),
});

export const assistantRequestSchema = z.object({ question: z.string().trim().min(3).max(500) });
export const demoAssistantRequestSchema = assistantRequestSchema.extend({ demo: z.literal(true), data: plannerDataSchema });

export const aiSessionSchema = z.object({
  id: z.string().min(1), taskId: z.string().min(1), startsAt: z.string().datetime(), endsAt: z.string().datetime(), activity: z.string().min(3).max(240), rationale: z.string().min(3).max(400),
});

export const aiPlanResponseSchema = z.object({ sessions: z.array(aiSessionSchema).max(80) });
