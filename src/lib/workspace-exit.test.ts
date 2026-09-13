import { describe, expect, it, vi } from "vitest";
import { leaveWorkspace } from "@/lib/workspace-exit";

describe("workspace exit", () => {
  it("delegates authenticated logout to Auth.js and returns to the landing page", async () => {
    const authSignOut = vi.fn().mockResolvedValue(undefined);
    const navigate = vi.fn();
    await leaveWorkspace("authenticated", authSignOut, navigate);
    expect(authSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("exits demo mode without creating or destroying an authentication session", async () => {
    const authSignOut = vi.fn();
    const navigate = vi.fn();
    await leaveWorkspace("demo", authSignOut, navigate);
    expect(navigate).toHaveBeenCalledWith("/");
    expect(authSignOut).not.toHaveBeenCalled();
  });
});
