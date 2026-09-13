import { describe, expect, it } from "vitest";
import { resolveAuthRuntimeOptions } from "@/lib/auth-runtime";

describe("Auth.js runtime configuration", () => {
  it("uses a stable configured secret and secure, trusted cookies in production", () => {
    expect(resolveAuthRuntimeOptions({ NODE_ENV: "production", AUTH_SECRET: "stable-secret" })).toEqual({ secret: "stable-secret", trustHost: true, useSecureCookies: true });
    expect(resolveAuthRuntimeOptions({ NODE_ENV: "production", NEXTAUTH_SECRET: "legacy-stable-secret" }).secret).toBe("legacy-stable-secret");
  });

  it("does not force secure cookies for local development", () => {
    expect(resolveAuthRuntimeOptions({ NODE_ENV: "development" }).useSecureCookies).toBe(false);
  });
});
