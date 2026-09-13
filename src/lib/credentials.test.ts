import bcrypt from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { authorizeCredentials } from "@/lib/credentials";

describe("credentials authentication", () => {
  it("authorizes a user only when the password hash matches", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 4);
    const findUserByEmail = vi.fn().mockResolvedValue({ id: "user-1", name: "Avery Student", email: "avery@example.edu", image: null, passwordHash });
    await expect(authorizeCredentials({ email: "avery@example.edu", password: "correct-password" }, findUserByEmail)).resolves.toMatchObject({ id: "user-1", email: "avery@example.edu" });
    await expect(authorizeCredentials({ email: "avery@example.edu", password: "wrong-password" }, findUserByEmail)).resolves.toBeNull();
  });
});
