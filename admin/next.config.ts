import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This makes all your routes start with /admin
  // basePath: "/admin",
  
  // This makes all your static assets load from /admin
  assetPrefix: "/admin",
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true, // Consider removing this and fixing errors
  },
  
  // Optional: Clean URLs without trailing slashes
  trailingSlash: false,
  
  // Optional: If you need to handle API routes differently
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;