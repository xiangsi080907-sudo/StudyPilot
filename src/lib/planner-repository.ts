import { prisma } from "@/lib/prisma";
import type { PlannerData } from "@/lib/types";

/** Maps a user's relational records into the planner's transport shape. */
export async function loadPlannerData(userId: string): Promise<PlannerData> {
  const [courses, tasks, availability, blockedTimes, sessions] = await Promise.all([
    prisma.course.findMany({ where: { userId }, orderBy: { code: "asc" } }),
    prisma.task.findMany({ where: { userId }, orderBy: { dueAt: "asc" } }),
    prisma.availability.findMany({ where: { userId } }),
    prisma.blockedTime.findMany({ where: { userId }, orderBy: { startsAt: "asc" } }),
    prisma.studySession.findMany({ where: { userId }, orderBy: { startsAt: "asc" } }),
  ]);
  return {
    courses: courses.map((course) => ({ id: course.id, code: course.code, name: course.name, professor: course.professor ?? undefined, color: course.color, icon: course.icon as "code" | "function" | "landmark" | "book", currentGrade: course.currentGrade ?? undefined, targetGrade: course.targetGrade ?? undefined, priority: course.priority })),
    tasks: tasks.map((task) => ({ id: task.id, courseId: task.courseId, title: task.title, type: task.type, dueAt: task.dueAt.toISOString(), estimatedMins: task.estimatedMins, difficulty: task.difficulty, progress: task.progress, priority: task.priority, notes: task.notes ?? undefined, completedAt: task.completedAt?.toISOString() })),
    availability: availability.map(({ dayOfWeek, startMins, endMins }) => ({ dayOfWeek, startMins, endMins })),
    blockedTimes: blockedTimes.map((item) => ({ startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), reason: item.reason ?? undefined })),
    sessions: sessions.map((session) => ({ id: session.id, courseId: session.courseId, taskId: session.taskId ?? undefined, startsAt: session.startsAt.toISOString(), endsAt: session.endsAt.toISOString(), activity: session.activity, rationale: session.rationale ?? "", status: session.status, actualMins: session.actualMins ?? undefined, planVersion: session.planVersion ?? undefined })),
  };
}
