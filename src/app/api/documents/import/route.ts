import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { convertFile, ImportError, type ImportErrorCode } from "@/lib/import/convert";
import { MAX_IMPORT_BYTES } from "@/lib/import/limits";
import { importFileSchema } from "@/lib/schemas";

const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

const STATUS: Record<ImportErrorCode, number> = { unsupported: 415, too_large: 413, empty: 400, corrupt: 400 };
const tooLarge = () => error(`The file is too large. The limit is ${MAX_IMPORT_BYTES / 1024 / 1024} MB.`, 413);

// Creates a NEW document owned by the current user from an uploaded .txt / .md / .docx file.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return error("You're signed out. Sign in again.", 401);

  // Cheap early reject so we don't buffer a huge upload (multipart adds a little overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_IMPORT_BYTES + 64 * 1024) return tooLarge();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error("Upload the file as multipart form data.", 400);
  }

  const parsed = importFileSchema.safeParse({ file: form.get("file") });
  if (!parsed.success) return error(parsed.error.issues[0].message, 400);
  const { file } = parsed.data;
  if (file.size > MAX_IMPORT_BYTES) return tooLarge();

  try {
    const { title, content } = await convertFile(file.name, new Uint8Array(await file.arrayBuffer()));
    const doc = await db.document.create({
      data: { title, ownerId: user.id, content: content as Prisma.InputJsonValue },
      select: { id: true },
    });
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (e) {
    if (e instanceof ImportError) return error(e.message, STATUS[e.code]);
    console.error("Import failed", e);
    return error("Something went wrong while importing the file.", 500);
  }
}
