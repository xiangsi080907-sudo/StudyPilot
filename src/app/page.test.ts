import { describe, expect, it, vi } from "vitest";

const { auth, loadPlannerData, appShell, landingPage } = vi.hoisted(() => ({
  auth: vi.fn(),
  loadPlannerData: vi.fn(),
  appShell: vi.fn(),
  landingPage: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/planner-repository", () => ({ loadPlannerData }));
vi.mock("@/components/app-shell", () => ({ AppShell: appShell }));
vi.mock("@/components/landing-page", () => ({ LandingPage: landingPage }));

import HomePage from "@/app/page";

describe("HomePage authentication gate", () => {
  it("renders the dashboard shell for an authenticated user", async () => {
    const plannerData = { courses: [], tasks: [], availability: [], blockedTimes: [], sessions: [] };
    auth.mockResolvedValue({ user: { id: "user-123", name: "Avery Student" } });
    loadPlannerData.mockResolvedValue(plannerData);
    const page = await HomePage();
    expect(page.type).toBe(appShell);
    expect(page.props).toMatchObject({ initialData: plannerData, mode: "authenticated", userName: "Avery Student" });
  });

  it("renders the landing page when Auth.js has no session", async () => {
    auth.mockResolvedValue(null);
    const page = await HomePage();
    expect(page.type).toBe(landingPage);
  });
});
