"use client";

import { useEffect, useState } from "react";
import { formatShortDate, formatTime, minutesBetween } from "@/lib/date";
import { calculateWeeklyStudyTime, formatDashboardGreeting, formatStudyHours, formatStudyTimeComparison } from "@/lib/dashboard";
import type { PlannerData, StudySession } from "@/lib/types";
import { Icon } from "@/components/ui/icon";

function courseFor(data: PlannerData, id: string) { return data.courses.find((course) => course.id === id); }
function isToday(iso: string) { return new Date(iso).toDateString() === new Date().toDateString(); }
function hours(mins: number) { return formatStudyHours(mins); }

function LocalGreeting({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    setGreeting(formatDashboardGreeting(userName, new Date()));
  }, [userName]);

  return <h1>{greeting === "Welcome" ? `${greeting}, ${userName}` : greeting} <span>✦</span></h1>;
}

export function DashboardView({ data, userName, onComplete, onNavigate, onAsk }: { data: PlannerData; userName: string; onComplete: (session: StudySession) => void; onNavigate: (view: "calendar" | "tasks" | "assistant") => void; onAsk: (question: string) => void }) {
  const todaySessions = data.sessions.filter((session) => session.status === "PLANNED" && isToday(session.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const activeTasks = data.tasks.filter((task) => task.progress < 100).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const weeklyStart = new Date(); weeklyStart.setHours(0, 0, 0, 0); weeklyStart.setDate(weeklyStart.getDate() - weeklyStart.getDay() + 1);
  const weeklyEnd = new Date(weeklyStart); weeklyEnd.setDate(weeklyEnd.getDate() + 7);
  const weekSessions = data.sessions.filter((session) => new Date(session.startsAt) >= weeklyStart && new Date(session.startsAt) < weeklyEnd);
  const plannedWeekMins = weekSessions.reduce((sum, session) => sum + minutesBetween(session.startsAt, session.endsAt), 0);
  const { currentWeekMinutes, previousWeekMinutes } = calculateWeeklyStudyTime(data.sessions, new Date());
  const completed = data.sessions.filter((session) => session.status === "COMPLETED").length;
  const overallProgress = Math.round(data.tasks.reduce((sum, task) => sum + task.progress, 0) / Math.max(1, data.tasks.length));
  const dailyHours = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weeklyStart); date.setDate(date.getDate() + index);
    return data.sessions.filter((session) => new Date(session.startsAt).toDateString() === date.toDateString()).reduce((sum, session) => sum + minutesBetween(session.startsAt, session.endsAt) / 60, 0);
  });
  const todayLabel = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return <div className="view dashboard-view">
    <div className="eyebrow">{todayLabel}</div>
    <div className="view-heading"><div><LocalGreeting userName={userName} /><p>Here’s a clear look at what matters most today.</p></div><button className="icon-button notification" aria-label="View notifications"><Icon name="bell" size={19} /><i /></button></div>
    <section className="focus-banner">
      <div className="focus-orb"><Icon name="target" size={25} /></div>
      <div><span className="overline">TODAY’S FOCUS</span><h2>{todaySessions.length ? todaySessions[0].activity : "Protect your next deep-work block"}</h2><p>{todaySessions.length ? `${hours(minutesBetween(todaySessions[0].startsAt, todaySessions[0].endsAt))} · ${courseFor(data, todaySessions[0].courseId)?.code} · Your highest-impact session today` : "Generate a plan to turn your availability into a focused schedule."}</p></div>
      <button className="ghost-light" onClick={() => onNavigate("calendar")}>View calendar <Icon name="arrow" size={16} /></button>
    </section>
    <section className="stats-grid" aria-label="Weekly statistics">
      <div className="metric-card accent-violet"><span className="metric-icon"><Icon name="clock" size={19} /></span><div><span>Study time this week</span><strong>{hours(currentWeekMinutes)}</strong><small>{formatStudyTimeComparison(currentWeekMinutes, previousWeekMinutes)}</small></div></div>
      <div className="metric-card accent-green"><span className="metric-icon"><Icon name="check" size={19} /></span><div><span>Completed sessions</span><strong>{completed}<em> / 12</em></strong><small>Keep the momentum going</small></div></div>
      <div className="metric-card accent-orange"><span className="metric-icon"><Icon name="target" size={19} /></span><div><span>Overall progress</span><strong>{overallProgress}%</strong><small>{activeTasks.length} active tasks</small></div></div>
    </section>
    <div className="dashboard-grid">
      <section className="panel today-panel"><div className="panel-heading"><div><h2>Today’s plan</h2><p>{todaySessions.length ? `${todaySessions.length} focused sessions` : "Your calendar is open"}</p></div><button className="text-button" onClick={() => onNavigate("calendar")}>View all <Icon name="arrow" size={15} /></button></div>
        <div className="session-list">{todaySessions.length ? todaySessions.map((session) => { const course = courseFor(data, session.courseId); return <article className="session-row" key={session.id}><time>{formatTime(session.startsAt)}</time><div className="session-color" style={{ backgroundColor: course?.color }} /><div className="session-copy"><strong>{session.activity}</strong><span>{course?.code} · {hours(minutesBetween(session.startsAt, session.endsAt))}</span></div><button className="complete-button" aria-label={`Complete ${session.activity}`} onClick={() => onComplete(session)}><Icon name="check" size={15} /></button></article>; }) : <EmptyCopy message="No study blocks yet. Start with a plan that fits your week." />}</div>
      </section>
      <section className="panel workload-panel"><div className="panel-heading"><div><h2>Weekly workload</h2><p>Planned study time</p></div><span className="chart-total">{hours(plannedWeekMins)}</span></div><div className="bar-chart">{dailyHours.map((value, index) => <div className="bar-day" key={index}><div className="bar-track"><div className={`bar-fill ${index === (new Date().getDay() + 6) % 7 ? "today" : ""}`} style={{ height: `${Math.max(value ? 16 : 0, Math.min(100, value / 4 * 100))}%` }}><span>{value ? value.toFixed(value % 1 ? 1 : 0) : ""}</span></div></div><small>{["M", "T", "W", "T", "F", "S", "S"][index]}</small></div>)}</div><div className="chart-legend"><span><i className="legend-dot violet" /> Planned</span><span>Target: 12h</span></div></section>
      <section className="panel deadlines-panel"><div className="panel-heading"><div><h2>Upcoming deadlines</h2><p>Stay a step ahead</p></div><button className="text-button" onClick={() => onNavigate("tasks")}>All tasks <Icon name="arrow" size={15} /></button></div><div className="deadline-list">{activeTasks.slice(0, 3).map((task) => { const course = courseFor(data, task.courseId); const days = Math.max(0, Math.ceil((new Date(task.dueAt).getTime() - Date.now()) / 86_400_000)); return <article className="deadline-row" key={task.id}><div className="course-symbol" style={{ color: course?.color, backgroundColor: `${course?.color}16` }}><Icon name={course?.icon ?? "book"} size={17} /></div><div><strong>{task.title}</strong><span>{course?.code} · Due {formatShortDate(task.dueAt)}</span></div><span className={`due-pill ${days <= 2 ? "urgent" : ""}`}>{days === 0 ? "Today" : `${days}d`}</span></article>; })}</div></section>
      <section className="panel progress-panel"><div className="panel-heading"><div><h2>Course progress</h2><p>Based on current coursework</p></div></div><div className="course-progress-list">{data.courses.map((course) => { const tasks = data.tasks.filter((task) => task.courseId === course.id); const progress = Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / Math.max(1, tasks.length)); return <div className="course-progress" key={course.id}><div className="course-progress-top"><span className="course-dot" style={{ backgroundColor: course.color }} /><strong>{course.code}</strong><span>{progress}%</span></div><div className="progress-track"><i style={{ width: `${progress}%`, backgroundColor: course.color }} /></div></div>; })}</div></section>
    </div>
    <section className="assistant-strip"><div className="assistant-logo"><Icon name="sparkle" size={19} /></div><div><span className="overline">STUDYPILOT AI</span><h3>Need a quick second brain?</h3><p>I can help you decide what to study and find the pressure points in your week.</p></div><div className="assistant-prompts"><button onClick={() => onAsk("What should I study tonight?")}>What should I study tonight?</button><button onClick={() => onAsk("Am I behind on anything?")}>Am I behind on anything?</button></div><button className="outline-button" onClick={() => onNavigate("assistant")}>Ask AI <Icon name="arrow" size={15} /></button></section>
  </div>;
}

function EmptyCopy({ message }: { message: string }) { return <div className="empty-copy"><Icon name="calendar" size={22} /><p>{message}</p></div>; }
