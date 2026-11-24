import { z } from "zod";

export const signInSchema = z.object({
  userId: z.string().min(1, "Pick a user to sign in as."),
});

export const DEFAULT_TITLE = "Untitled document";

const title = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(200, "Title must be 200 characters or fewer.");

// Creating with a blank title is allowed and falls back to the default.
export const createDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .max(200, "Title must be 200 characters or fewer.")
    .transform((t) => t || DEFAULT_TITLE),
});

export const renameDocumentSchema = z.object({
  id: z.string().min(1),
  title,
});

export const deleteDocumentSchema = z.object({
  id: z.string().min(1),
});
