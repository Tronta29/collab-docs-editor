import type { NextConfig } from "next";

// Cache Components is intentionally off: every page here depends on the signed-in
// user's cookie, so there is nothing useful to prerender or cache.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
