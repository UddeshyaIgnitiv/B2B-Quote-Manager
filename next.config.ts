import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // This makes Vercel builds succeed even if ESLint has errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
