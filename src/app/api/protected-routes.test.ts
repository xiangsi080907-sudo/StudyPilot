import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/current-user", () => ({ currentUserId: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/prisma", () => ({ prisma: { course: {}, task: {} } }));

import { GET as getCourses } from "@/app/api/courses/route";
import { GET as getTasks } from "@/app/api/tasks/route";

describe("protected planner routes", () => {
  it("rejects unauthenticated course and task requests", async () => {
    await expect(getCourses()).resolves.toMatchObject({ status: 401 });
    await expect(getTasks()).resolves.toMatchObject({ status: 401 });
  });
});
