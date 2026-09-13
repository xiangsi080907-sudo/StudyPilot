import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validation";

async function ownedCourse(courseId: string, userId: string) {
  return prisma.course.findFirst({ where: { id: courseId, userId }, select: { id: true } });
}

export async function PATCH(request: Request, context: { params: Promise<{ courseId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { courseId } = await context.params;
  if (!await ownedCourse(courseId, userId)) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const parsed = courseSchema.omit({ id: true }).partial().safeParse(await request.json());
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "Invalid course update" }, { status: 400 });
  return NextResponse.json(await prisma.course.update({ where: { id: courseId }, data: parsed.data }));
}

export async function DELETE(_request: Request, context: { params: Promise<{ courseId: string }> }) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { courseId } = await context.params;
  if (!await ownedCourse(courseId, userId)) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  await prisma.course.delete({ where: { id: courseId } });
  return new NextResponse(null, { status: 204 });
}
