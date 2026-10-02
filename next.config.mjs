/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // ── Performance ────────────────────────────────────────────────────────────
  // Compress responses (already default in production, explicit for clarity)
  compress: true,

  // Reduce build output noise
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  experimental: {
    // Optimise CSS by removing unused styles at build time
    optimizeCss: false, // enable only in production builds; dev keeps it off to avoid craco dep

    // Enable server-side package tree-shaking
    serverComponentsExternalPackages: ["pino"],
  },

  // ── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Static assets: aggressive long-term caching
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
