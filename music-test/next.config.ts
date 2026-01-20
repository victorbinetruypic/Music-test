import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Removed 'output: export' to support /api/callback serverless function
  // Vercel will still optimize static pages automatically
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
