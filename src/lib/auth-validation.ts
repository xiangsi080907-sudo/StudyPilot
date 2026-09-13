import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(10).max(128),
});
