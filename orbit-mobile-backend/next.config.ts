import type { NextConfig } from "next";

// Cache Components is disabled: this frontend-only demo keeps its state in
// the browser (localStorage), so pages are client-driven by design.
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
