import { auth } from "@/auth";

export async function currentUserId(): Promise<string | null> {
  if (!process.env.AUTH_SECRET) return null;
  const session = await auth();
  return session?.user?.id ?? null;
}
