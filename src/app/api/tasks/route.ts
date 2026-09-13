import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/validation";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(await prisma.task.findMany({ where: { userId }, include: { course: { select: { code: true, color: true } } }, orderBy: { dueAt: "asc" } }));
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body: unknown = await request.json();
  const parsed = taskSchema.omit({ id: true, completedAt: true }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid task", issues: parsed.error.flatten() }, { status: 400 });
  const course = await prisma.course.findFirst({ where: { id: parsed.data.courseId, userId }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const task = await prisma.task.create({ data: { ...parsed.data, userId, dueAt: new Date(parsed.data.dueAt) } });
  return NextResponse.json(task, { status: 201 });
}
