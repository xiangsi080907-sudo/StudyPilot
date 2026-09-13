import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create } = vi.hoisted(() => ({ findUnique: vi.fn(), create: vi.fn() }));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique, create } } }));

import { POST } from "@/app/api/auth/register/route";

describe("POST /api/auth/register", () => {
  beforeEach(() => { findUnique.mockReset(); create.mockReset(); });

  it("creates a password-hashed account for a new user", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "new-user", email: "new@example.edu" });
    const response = await POST(new Request("http://localhost/api/auth/register", { method: "POST", body: JSON.stringify({ name: "New Student", email: "new@example.edu", password: "a-safe-password" }) }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "new-user", email: "new@example.edu" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ email: "new@example.edu", passwordHash: expect.any(String) }) }));
    expect(create.mock.calls[0][0].data.passwordHash).not.toBe("a-safe-password");
  });
});
