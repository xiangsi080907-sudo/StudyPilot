import { PrismaClient, SessionStatus, TaskType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const day = (offset: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

async function main() {
  const email = "demo@studypilot.app";
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      name: "Maya Chen",
      email,
      passwordHash: await bcrypt.hash("DemoPass123!", 12),
      courses: {
        create: [
          { name: "Data Structures", code: "CSE 123", professor: "Dr. Patel", color: "#7567F8", icon: "code", currentGrade: 89, targetGrade: 92, priority: 5 },
          { name: "Linear Algebra", code: "MATH 208", professor: "Prof. Rivera", color: "#22A06B", icon: "function", currentGrade: 93, targetGrade: 95, priority: 4 },
          { name: "Modern World History", code: "HIST 101", professor: "Dr. Okafor", color: "#F49B3E", icon: "landmark", currentGrade: 86, targetGrade: 90, priority: 3 },
        ],
      },
      availability: {
        create: [
          { dayOfWeek: 1, startMins: 960, endMins: 1200 },
          { dayOfWeek: 2, startMins: 1080, endMins: 1320 },
          { dayOfWeek: 3, startMins: 960, endMins: 1200 },
          { dayOfWeek: 4, startMins: 1080, endMins: 1320 },
          { dayOfWeek: 5, startMins: 900, endMins: 1140 },
          { dayOfWeek: 6, startMins: 600, endMins: 840 },
        ],
      },
    },
    include: { courses: true },
  });

  const [cse, math, history] = user.courses;
  const tasks = await Promise.all([
    prisma.task.create({ data: { userId: user.id, courseId: cse.id, title: "Mini-Git project", type: TaskType.PROJECT, dueAt: day(3, 23, 59), estimatedMins: 720, difficulty: 5, progress: 30, priority: 5, notes: "Implement add, commit, log, and branch commands." } }),
    prisma.task.create({ data: { userId: user.id, courseId: math.id, title: "Midterm exam", type: TaskType.EXAM, dueAt: day(5, 10), estimatedMins: 480, difficulty: 5, progress: 15, priority: 5, notes: "Focus on eigenvectors, diagonalization, and proofs." } }),
    prisma.task.create({ data: { userId: user.id, courseId: history.id, title: "Primary source reflection", type: TaskType.ASSIGNMENT, dueAt: day(2, 17), estimatedMins: 150, difficulty: 2, progress: 60, priority: 3 } }),
    prisma.task.create({ data: { userId: user.id, courseId: cse.id, title: "Linked lists reading", type: TaskType.READING, dueAt: day(7, 12), estimatedMins: 90, difficulty: 2, progress: 0, priority: 2 } }),
  ]);

  await prisma.studySession.createMany({
    data: [
      { userId: user.id, courseId: cse.id, taskId: tasks[0].id, startsAt: day(0, 16), endsAt: day(0, 17, 30), activity: "Build repository add command", rationale: "Project due soon", status: SessionStatus.PLANNED, planVersion: "seed" },
      { userId: user.id, courseId: math.id, taskId: tasks[1].id, startsAt: day(0, 18), endsAt: day(0, 19, 30), activity: "Practice diagonalization", rationale: "Exam preparation", status: SessionStatus.PLANNED, planVersion: "seed" },
      { userId: user.id, courseId: history.id, taskId: tasks[2].id, startsAt: day(-1, 16), endsAt: day(-1, 17), activity: "Outline reflection", status: SessionStatus.COMPLETED, actualMins: 58, planVersion: "seed" },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: user.id, kind: "DEADLINE", title: "Reflection due tomorrow", body: "Your HIST 101 primary source reflection is 60% complete." },
      { userId: user.id, kind: "EXAM", title: "Math midterm in 5 days", body: "You have 8 hours of focused preparation remaining." },
    ],
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
