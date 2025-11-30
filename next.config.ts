import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output only for Docker deployments
  // Vercel automatically handles optimization
  output: process.env.DOCKER_BUILD === 'true' ? "standalone" : undefined,
  
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  
  // Disable static page generation for pages using useSearchParams
  // This prevents build errors with client-side routing
  experimental: {
    // Allow client-side rendering for dynamic pages
  },
  
  // Don't fail build on ESLint warnings (only errors)
  eslint: {
    ignoreDuringBuilds: false, // Keep ESLint enabled but allow warnings
  },
  
  // Don't fail build on TypeScript errors (only warnings)
  typescript: {
    ignoreBuildErrors: false, // Keep TypeScript checking enabled
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
  // Note: This only applies when NOT using Turbopack (--turbo flag)
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'ignore-loader',
    });
    return config;
  },
  
  // Turbopack configuration (when using --turbo flag)
  // Turbopack automatically handles file watching and hot reload
  // No additional configuration needed for hot reload
  
  // Environment variables to expose to the client
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
};

export default nextConfig;
