import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors in documentation and backup folders during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Don't run ESLint during builds (handled separately)
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'hooks'],
  },
  // Exclude documentation and backup folders from compilation
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;
