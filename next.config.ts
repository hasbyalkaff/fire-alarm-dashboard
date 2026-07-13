import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Never buffer or cache the SSE stream (Nginx also sets proxy_buffering off).
        source: "/api/sse",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-transform" },
          { key: "X-Accel-Buffering", value: "no" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
