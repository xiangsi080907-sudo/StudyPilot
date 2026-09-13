import bcrypt from "bcryptjs";
import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export interface CredentialUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
}

export async function authorizeCredentials(
  credentials: unknown,
  findUserByEmail: (email: string) => Promise<CredentialUser | null>,
) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const user = await findUserByEmail(parsed.data.email);
  if (!user?.passwordHash) return null;
  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  return valid ? { id: user.id, name: user.name, email: user.email, image: user.image } : null;
}
