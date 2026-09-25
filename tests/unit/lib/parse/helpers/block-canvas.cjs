/**
 * Simulate the Vercel/Next bundle: pdfjs cannot require @napi-rs/canvas,
 * so it never polyfills DOMMatrix and `new DOMMatrix()` throws at import time.
 */
const Module = require('module');

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === '@napi-rs/canvas') {
    throw new Error('canvas blocked to simulate Vercel bundle');
  }
  return originalLoad(request, parent, isMain);
};
