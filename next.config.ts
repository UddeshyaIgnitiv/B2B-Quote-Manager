import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.shopify.com"],
  },
  eslint: {
    // This makes Vercel builds succeed even if ESLint has errors
    ignoreDuringBuilds: true,
  },
  // ... other config options
  
};

export default nextConfig;