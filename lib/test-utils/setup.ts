import '@testing-library/jest-dom';

// jsdom does not implement window.matchMedia — mock it for all tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom does not implement IntersectionObserver — mock it for all tests
global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// jsdom does not implement ResizeObserver — mock it for all tests (needed by Radix UI)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// jsdom does not implement Pointer Events API — mock for Radix UI components
window.Element.prototype.hasPointerCapture = () => false;
window.Element.prototype.setPointerCapture = () => {};
window.Element.prototype.releasePointerCapture = () => {};

// jsdom does not implement scrollIntoView — mock for Radix UI Select (scrolls to selected item on open)
window.HTMLElement.prototype.scrollIntoView = () => {};
