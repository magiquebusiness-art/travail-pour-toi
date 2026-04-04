import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Images configuration for Cloudflare
  images: {
    unoptimized: true,
  },
  // Disable experimental features that don't work in Workers
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Disable MCP server (not compatible with Cloudflare Workers)
  serverExternalPackages: [],
};

export default nextConfig;
