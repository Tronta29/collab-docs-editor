// Kept separate from convert.ts so client components can import these without bundling mammoth/marked.
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"] as const;
