export type TaskType = "ASSIGNMENT" | "QUIZ" | "EXAM" | "PROJECT" | "READING" | "OTHER";
export type SessionStatus = "PLANNED" | "COMPLETED" | "SKIPPED";

export interface Course {
  id: string;
  code: string;
  name: string;
  professor?: string;
  color: string;
  icon: "code" | "function" | "landmark" | "book";
  currentGrade?: number;
  targetGrade?: number;
  priority: number;
}

export interface StudyTask {
  id: string;
  courseId: string;
  title: string;
  type: TaskType;
  dueAt: string;
  estimatedMins: number;
  difficulty: number;
  progress: number;
  priority: number;
  notes?: string;
  completedAt?: string;
}

export interface AvailabilityWindow {
  /** JavaScript weekday: 0 = Sunday, 6 = Saturday */
  dayOfWeek: number;
  startMins: number;
  endMins: number;
}

export interface BlockedTime {
  startsAt: string;
  endsAt: string;
  reason?: string;
}

export interface StudySession {
  id: string;
  courseId: string;
  taskId?: string;
  startsAt: string;
  endsAt: string;
  activity: string;
  rationale: string;
  status: SessionStatus;
  actualMins?: number;
  planVersion?: string;
}

export interface PlannerData {
  courses: Course[];
  tasks: StudyTask[];
  availability: AvailabilityWindow[];
  blockedTimes: BlockedTime[];
  sessions: StudySession[];
}

export interface ScoredTask {
  task: StudyTask;
  score: number;
  remainingMins: number;
  daysUntilDue: number;
}

export interface PlanningResult {
  sessions: StudySession[];
  unscheduledTaskIds: string[];
  totalScheduledMins: number;
}
