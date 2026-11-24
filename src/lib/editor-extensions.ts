import StarterKit from "@tiptap/starter-kit";

// Single source of truth for the document schema. The editor and the file importer
// (HTML -> Tiptap JSON) must use the same list so imported content is always valid.
// StarterKit (v3) already bundles Underline, lists, headings, undo/redo.
export const editorExtensions = [StarterKit.configure({ heading: { levels: [1, 2, 3] } })];
