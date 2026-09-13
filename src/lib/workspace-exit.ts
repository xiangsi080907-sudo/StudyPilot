export type WorkspaceMode = "authenticated" | "demo";

/** Keeps demo exit local while delegating real session destruction to Auth.js. */
export function leaveWorkspace(
  mode: WorkspaceMode,
  authSignOut: (options: { callbackUrl: string }) => Promise<unknown>,
  navigate: (url: string) => void,
) {
  if (mode === "demo") { navigate("/"); return Promise.resolve(); }
  return authSignOut({ callbackUrl: "/" });
}
