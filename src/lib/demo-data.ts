import { addDays } from "@/lib/date";
import type { PlannerData } from "@/lib/types";

function onDay(dayOffset: number, hour: number, minute = 0): string {
  const date = addDays(new Date(), dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function createDemoData(): PlannerData {
  return {
    courses: [
      { id: "cse", code: "CSE 123", name: "Data Structures", professor: "Dr. Patel", color: "#7567F8", icon: "code", currentGrade: 89, targetGrade: 92, priority: 5 },
      { id: "math", code: "MATH 208", name: "Linear Algebra", professor: "Prof. Rivera", color: "#20A36B", icon: "function", currentGrade: 93, targetGrade: 95, priority: 4 },
      { id: "hist", code: "HIST 101", name: "Modern World History", professor: "Dr. Okafor", color: "#F39A3F", icon: "landmark", currentGrade: 86, targetGrade: 90, priority: 3 },
    ],
    tasks: [
      { id: "mini-git", courseId: "cse", title: "Mini-Git project", type: "PROJECT", dueAt: onDay(3, 23, 59), estimatedMins: 720, difficulty: 5, progress: 30, priority: 5, notes: "Implement add, commit, log, and branch commands." },
      { id: "math-midterm", courseId: "math", title: "Midterm exam", type: "EXAM", dueAt: onDay(5, 10), estimatedMins: 480, difficulty: 5, progress: 15, priority: 5, notes: "Eigenvectors, diagonalization, and proofs." },
      { id: "history-reflection", courseId: "hist", title: "Primary source reflection", type: "ASSIGNMENT", dueAt: onDay(2, 17), estimatedMins: 150, difficulty: 2, progress: 60, priority: 3, notes: "Connect the source to the week's seminar." },
      { id: "linked-lists", courseId: "cse", title: "Linked lists reading", type: "READING", dueAt: onDay(7, 12), estimatedMins: 90, difficulty: 2, progress: 0, priority: 2 },
    ],
    availability: [
      { dayOfWeek: 1, startMins: 960, endMins: 1200 },
      { dayOfWeek: 2, startMins: 1080, endMins: 1320 },
      { dayOfWeek: 3, startMins: 960, endMins: 1200 },
      { dayOfWeek: 4, startMins: 1080, endMins: 1320 },
      { dayOfWeek: 5, startMins: 900, endMins: 1140 },
      { dayOfWeek: 6, startMins: 600, endMins: 840 },
    ],
    blockedTimes: [{ startsAt: onDay(1, 18), endsAt: onDay(1, 19), reason: "Club meeting" }],
    sessions: [
      { id: "today-cse", courseId: "cse", taskId: "mini-git", startsAt: onDay(0, 16), endsAt: onDay(0, 17, 30), activity: "Build repository add command", rationale: "High-priority project due soon", status: "PLANNED" },
      { id: "today-math", courseId: "math", taskId: "math-midterm", startsAt: onDay(0, 18), endsAt: onDay(0, 19, 30), activity: "Practice diagonalization", rationale: "Exam preparation", status: "PLANNED" },
      { id: "tomorrow-history", courseId: "hist", taskId: "history-reflection", startsAt: onDay(1, 16), endsAt: onDay(1, 17), activity: "Revise evidence paragraph", rationale: "Finish the reflection ahead of its deadline", status: "PLANNED" },
      { id: "done-history", courseId: "hist", taskId: "history-reflection", startsAt: onDay(-1, 16), endsAt: onDay(-1, 17), activity: "Outline reflection", rationale: "Completed study block", status: "COMPLETED", actualMins: 58 },
      { id: "done-cse", courseId: "cse", taskId: "mini-git", startsAt: onDay(-2, 17), endsAt: onDay(-2, 18, 30), activity: "Map project architecture", rationale: "Completed study block", status: "COMPLETED", actualMins: 84 },
    ],
  };
}

export function createEmptyPlannerData(): PlannerData {
  return { courses: [], tasks: [], availability: [], blockedTimes: [], sessions: [] };
}
