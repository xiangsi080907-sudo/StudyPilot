export function resolveAuthRuntimeOptions(env: NodeJS.ProcessEnv = process.env) {
  return {
    // Supports Auth.js v5 and the v4-compatible secret name without inventing a secret.
    secret: env.AUTH_SECRET ?? env.NEXTAUTH_SECRET,
    // Vercel terminates HTTPS before forwarding the request to the serverless function.
    trustHost: true,
    // Keeps localhost development usable while enforcing __Secure- cookies in production.
    useSecureCookies: env.NODE_ENV === "production",
  };
}
