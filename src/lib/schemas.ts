import { z } from "zod";

export const signInSchema = z.object({
  userId: z.string().min(1, "Pick a user to sign in as."),
});
