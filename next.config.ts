import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker deployment: Enable standalone output for optimized container size
  output: "standalone",
  
  // Disable static page generation for pages using useSearchParams
  // This prevents build errors with client-side routing
  experimental: {
    // Allow client-side rendering for dynamic pages
  },
  
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Use Cloudinary for image optimization in production
    unoptimized: false,
  },
  
  // Exclude markdown files from webpack processing
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'ignore-loader',
    });
    return config;
  },
  
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
