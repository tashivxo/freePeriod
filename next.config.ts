import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['tesseract.js'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
