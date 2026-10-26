import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* No `output: "standalone"` — on Netlify the @netlify/plugin-nextjs
     runtime packages routes itself; locally `npm start` uses `next start`. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* File tracing only follows static imports — the /api/media route reads
     uploads/ at runtime via fs, so include it explicitly. This keeps the
     shipped demo images servable (read-only) inside Netlify functions. */
  outputFileTracingIncludes: {
    // Key is matched (as a glob) against the app entry "/app/api/media/[...key]"
    // — brackets must be escaped so they match literally.
    "/app/api/media/\\[...key\\]": ["./uploads/**/*"],
  },
};

export default nextConfig;
