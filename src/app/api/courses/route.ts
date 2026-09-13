import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { courseSchema } from "@/lib/validation";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  return NextResponse.json(await prisma.course.findMany({ where: { userId }, orderBy: [{ priority: "desc" }, { code: "asc" }] }));
}

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body: unknown = await request.json();
  const parsed = courseSchema.omit({ id: true }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid course", issues: parsed.error.flatten() }, { status: 400 });
  const course = await prisma.course.create({ data: { ...parsed.data, userId } });
  return NextResponse.json(course, { status: 201 });
}
