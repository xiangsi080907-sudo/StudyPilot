"use client";

import { Icon, type IconName } from "@/components/ui/icon";

export type View = "dashboard" | "courses" | "tasks" | "calendar" | "analytics" | "assistant" | "settings";

const navItems: Array<{ id: View; label: string; icon: IconName }> = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "courses", label: "Courses", icon: "book" },
  { id: "tasks", label: "Tasks", icon: "check" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "analytics", label: "Analytics", icon: "chart" },
  { id: "assistant", label: "AI Assistant", icon: "sparkle" },
];

export function Sidebar({ activeView, onChange }: { activeView: View; onChange: (view: View) => void }) {
  return <aside className="sidebar">
    <button className="brand" onClick={() => onChange("dashboard")} aria-label="StudyPilot home"><span className="brand-mark"><Icon name="lightning" size={19} /></span><span>StudyPilot</span></button>
    <div className="workspace-label">WORKSPACE</div>
    <nav aria-label="Primary navigation">
      {navItems.map((item) => <button className={`nav-item ${activeView === item.id ? "active" : ""}`} key={item.id} onClick={() => onChange(item.id)}><Icon name={item.icon} size={18} /><span>{item.label}</span>{item.id === "assistant" && <span className="new-badge">New</span>}</button>)}
    </nav>
    <div className="sidebar-bottom">
      <button className={`nav-item ${activeView === "settings" ? "active" : ""}`} onClick={() => onChange("settings")}><Icon name="settings" size={18} /><span>Settings</span></button>
      <div className="profile"><div className="avatar">MC</div><div><strong>Maya Chen</strong><span>Computer Science</span></div><Icon name="chevron" size={15} className="profile-chevron" /></div>
    </div>
  </aside>;
}
