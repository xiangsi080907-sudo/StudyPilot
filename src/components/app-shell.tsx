"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AnalyticsView, AssistantView, SettingsView } from "@/components/insights-views";
import { CalendarView } from "@/components/calendar-view";
import { DashboardView } from "@/components/dashboard-view";
import { CoursesView, TasksView } from "@/components/management-views";
import { Sidebar, type View } from "@/components/sidebar";
import { Icon } from "@/components/ui/icon";
import type { Course, PlannerData, StudySession, StudyTask } from "@/lib/types";
import { leaveWorkspace, type WorkspaceMode } from "@/lib/workspace-exit";

const viewTitle: Record<View, string> = { dashboard: "Dashboard", courses: "Courses", tasks: "Tasks", calendar: "Calendar", analytics: "Analytics", assistant: "AI Assistant", settings: "Settings" };

export function AppShell({ initialData, mode, userName, loadError }: { initialData: PlannerData; mode: WorkspaceMode; userName: string; loadError?: string }) {
  const [data, setData] = useState(initialData);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [isPlanning, setIsPlanning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(null), 3200); };
  const changeView = (view: View) => setActiveView(view);
  const ask = (question: string) => { setAssistantPrompt(question); setActiveView("assistant"); };
  const exitWorkspace = () => { void leaveWorkspace(mode, (options) => signOut(options), (url) => window.location.assign(url)); };
  const completeSession = (session: StudySession) => { setData((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === session.id ? { ...item, status: "COMPLETED", actualMins: Math.round((new Date(item.endsAt).getTime() - new Date(item.startsAt).getTime()) / 60_000) } : item) })); notify("Session marked complete — great work."); };
  const completeTask = (id: string) => { setData((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === id ? { ...task, progress: 100, completedAt: new Date().toISOString() } : task) })); notify("Task marked complete."); };
  const upsertCourse = (course: Course) => { setData((current) => ({ ...current, courses: current.courses.some((item) => item.id === course.id) ? current.courses.map((item) => item.id === course.id ? course : item) : [...current.courses, course] })); notify(`${course.code} saved.`); };
  const deleteCourse = (id: string) => { setData((current) => ({ ...current, courses: current.courses.filter((course) => course.id !== id), tasks: current.tasks.filter((task) => task.courseId !== id), sessions: current.sessions.filter((session) => session.courseId !== id) })); notify("Course and its planner items removed."); };
  const upsertTask = (task: StudyTask) => { setData((current) => ({ ...current, tasks: current.tasks.some((item) => item.id === task.id) ? current.tasks.map((item) => item.id === task.id ? task : item) : [...current.tasks, task] })); notify(`${task.title} saved.`); };
  const deleteTask = (id: string) => { setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id), sessions: current.sessions.map((session) => session.taskId === id ? { ...session, taskId: undefined } : session) })); notify("Task removed from your queue."); };
  const deleteSession = (id: string) => { setData((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== id) })); notify("Study session deleted."); };
  const moveSession = (id: string, targetDay: Date) => { setData((current) => ({ ...current, sessions: current.sessions.map((session) => { if (session.id !== id) return session; const start = new Date(session.startsAt); const end = new Date(session.endsAt); const duration = end.getTime() - start.getTime(); const moved = new Date(targetDay); moved.setHours(start.getHours(), start.getMinutes(), 0, 0); return { ...session, startsAt: moved.toISOString(), endsAt: new Date(moved.getTime() + duration).toISOString() }; }) })); notify("Session moved. Check availability before finalizing your week."); };
  const generatePlan = async () => { if (isPlanning) return; setIsPlanning(true); try { const baseSessions = data.sessions.filter((session) => !session.planVersion); const response = await fetch("/api/study-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, sessions: baseSessions }) }); const body = await response.json() as { result?: { sessions: StudySession[]; unscheduledTaskIds: string[] }; source?: string; error?: string }; if (!response.ok || !body.result) throw new Error(body.error || "Could not create a plan"); setData((current) => ({ ...current, sessions: [...current.sessions.filter((session) => !session.planVersion), ...body.result!.sessions] })); const unscheduled = body.result.unscheduledTaskIds.length; notify(unscheduled ? `Plan generated. ${unscheduled} task${unscheduled === 1 ? "" : "s"} still need more availability.` : `Fresh ${body.source === "ai" ? "AI-enriched " : ""}study plan generated.`); setActiveView("calendar"); } catch (error) { notify(error instanceof Error ? error.message : "Could not create a plan. Please try again."); } finally { setIsPlanning(false); } };

  let content: React.ReactNode;
  if (activeView === "dashboard") content = <DashboardView data={data} onComplete={completeSession} onNavigate={changeView} onAsk={ask} />;
  else if (activeView === "courses") content = <CoursesView data={data} onUpsert={upsertCourse} onDelete={deleteCourse} />;
  else if (activeView === "tasks") content = <TasksView data={data} onUpsert={upsertTask} onComplete={completeTask} onDelete={deleteTask} />;
  else if (activeView === "calendar") content = <CalendarView data={data} onMove={moveSession} onComplete={completeSession} onDelete={deleteSession} />;
  else if (activeView === "analytics") content = <AnalyticsView data={data} />;
  else if (activeView === "assistant") content = <AssistantView key={assistantPrompt} data={data} initialQuestion={assistantPrompt} onQuestionUsed={() => setAssistantPrompt("")} />;
  else content = <SettingsView data={data} onAvailabilityChange={(availability) => { setData((current) => ({ ...current, availability })); notify("Availability saved."); }} />;

  return <div className="app-frame"><Sidebar activeView={activeView} onChange={changeView} mode={mode} userName={userName} onExit={exitWorkspace} /><main className="app-main"><header className="mobile-header"><button className="brand" onClick={() => changeView("dashboard")}><span className="brand-mark"><Icon name="lightning" size={18} /></span><span>StudyPilot</span></button><span>{viewTitle[activeView]}</span></header>{mode === "demo" && <div className="demo-banner"><span><Icon name="sparkle" size={15} /><strong>You’re exploring the interactive demo.</strong> Changes stay in this browser and won’t be saved.</span><button onClick={exitWorkspace}>Exit demo</button></div>}{loadError && <div className="load-error" role="alert">{loadError}</div>}<div className="top-actions"><button className="mobile-nav-button" onClick={() => changeView("dashboard")} aria-label="Dashboard"><Icon name="grid" size={19} /></button><button className="generate-button" onClick={generatePlan} disabled={isPlanning}>{isPlanning ? <span className="spinner" /> : <Icon name="sparkle" size={17} />}{isPlanning ? "Building your plan…" : "Generate study plan"}</button></div>{content}</main>{toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}</div>;
}
