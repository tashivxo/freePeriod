import '@testing-library/jest-dom';
import { MotionGlobalConfig } from 'motion/react';

// AnimatePresence exit is 0.15s; under load waitFor's default 1000ms is not
// always enough for a long Country list to unmount, even after the menu has
// already closed (aria-expanded false, opacity 0). Skip motion animations in
// Jest so listbox unmount is deterministic. The dropdown test that covers the
// exit animation turns this off locally.
MotionGlobalConfig.skipAnimations = true;

// Browser-only polyfills - skip in node test environments (e.g. middleware)
if (typeof window !== 'undefined') {
  // jsdom does not implement window.matchMedia - mock it for all tests
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

  // jsdom does not implement IntersectionObserver - mock it for all tests
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;

  // jsdom does not implement ResizeObserver - mock it for all tests (needed by Radix UI)
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;

  // jsdom does not implement Pointer Events API - mock for Radix UI components
  window.Element.prototype.hasPointerCapture = () => false;
  window.Element.prototype.setPointerCapture = () => {};
  window.Element.prototype.releasePointerCapture = () => {};

  // jsdom does not implement scrollIntoView - mock for Radix UI Select (scrolls to selected item on open)
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
