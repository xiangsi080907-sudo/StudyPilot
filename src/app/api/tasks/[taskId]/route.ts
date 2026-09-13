import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validation";

const taskUpdateSchema = taskSchema.omit({ id: true }).partial().extend({ completedAt: z.string().datetime().nullable().optional() });

async function ownedTask(taskId: string, userId: string) {
  return prisma.task.findFirst({ where: { id: taskId, userId }, select: { id: true } });
}

export async function PATCH(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { taskId } = await context.params;
  if (!await ownedTask(taskId, userId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const parsed = taskUpdateSchema.safeParse(await request.json());
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Invalid task update" }, { status: 400 });
  if (parsed.data.courseId) {
    const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, userId }, select: { id: true } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const { dueAt, completedAt, ...rest } = parsed.data;
  return NextResponse.json(await prisma.task.update({ where: { id: taskId }, data: { ...rest, dueAt: dueAt ? new Date(dueAt) : undefined, completedAt: completedAt === null ? null : completedAt ? new Date(completedAt) : undefined } }));
}

export async function DELETE(_request: Request, context: { params: Promise<{ taskId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { taskId } = await context.params;
  if (!await ownedTask(taskId, userId)) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  await prisma.task.delete({ where: { id: taskId } });
  return new NextResponse(null, { status: 204 });
}
