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

export const shareRoleSchema = z.enum(["VIEWER", "EDITOR"], { error: "Choose Viewer or Editor." });

export const shareDocumentSchema = z.object({
  documentId: z.string().min(1),
  role: shareRoleSchema,
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address.")
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.")),
});

export const updateShareRoleSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
  role: shareRoleSchema,
});

export const unshareDocumentSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
});

export const importFileSchema = z.object({
  file: z.instanceof(File, { message: "Choose a file to import." }),
});

export const exportFormatSchema = z.enum(["md"]);

export const MAX_CONTENT_BYTES = 1_000_000;

// Structural check only: a Tiptap doc node whose children are typed nodes. The editor's
// own schema is the source of truth for what's valid inside.
const tiptapDocSchema = z.looseObject({
  type: z.literal("doc"),
  content: z.array(z.looseObject({ type: z.string() })).optional(),
});

export const updateContentSchema = z.object({ content: tiptapDocSchema });
