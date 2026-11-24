"use client";

// Last resort: only used if the root layout itself fails. It replaces the layout, so it needs
// its own <html>/<body> and inline styles (global CSS isn't loaded here).
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f9fafb", color: "#111827", textAlign: "center", paddingTop: "6rem" }}>
        <h1>Something went wrong</h1>
        <p>Please try again in a moment.</p>
        <button type="button" onClick={() => retry()}>
          Try again
        </button>
      </body>
    </html>
  );
}
