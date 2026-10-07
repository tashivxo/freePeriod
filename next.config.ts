import type { NextConfig } from 'next';

// Next 16.2.1 defaults `next build` to Turbopack. Its next/font/google file
// fetch does not retry, so Preview can fail with:
//   Can't resolve '@vercel/turbopack-next/internal/font/google/font'
// Webpack's font loader retries. Keep `npm run build` on --webpack until a
// Next upgrade that hardens Turbopack fonts. `next dev --turbopack` is unchanged.

const nextConfig: NextConfig = {
  // Keep pdfjs/tesseract out of the route bundle. Bundling pdfjs-dist makes
  // its createRequire("@napi-rs/canvas") fail, then `new DOMMatrix()` throws
  // at module evaluation and /api/parse-document never starts.
  serverExternalPackages: ['tesseract.js', 'pdf-parse', 'pdfjs-dist', 'pdf-lib'],
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
