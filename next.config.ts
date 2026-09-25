import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep pdfjs/tesseract out of the route bundle. Bundling pdfjs-dist makes
  // its createRequire("@napi-rs/canvas") fail, then `new DOMMatrix()` throws
  // at module evaluation and /api/parse-document never starts.
  serverExternalPackages: ['tesseract.js', 'pdf-parse', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/parse-document': [
      './node_modules/pdfjs-dist/legacy/build/pdf.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'motion'],
  },
};

export default nextConfig;
