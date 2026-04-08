'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlurText } from '../BlurText';

// Mock Framer Motion so animations don't break jsdom
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p {...props}>{children}</p>
    ),
  },
  useReducedMotion: () => false,
}));

describe('BlurText', () => {
  it('renders the provided text', () => {
    render(<BlurText text="Hello world" />);
    expect(screen.getByText(/hello/i) || screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders each word individually', () => {
    render(<BlurText text="Hello world" />);
    const allSpans = document.querySelectorAll('span');
    const texts = Array.from(allSpans).map((s) => s.textContent?.trim());
    // "Hello" and "world" should both appear somewhere in the rendered output
    expect(texts.some((t) => t?.includes('Hello'))).toBe(true);
    expect(texts.some((t) => t?.includes('world'))).toBe(true);
  });

  it('accepts a className prop', () => {
    render(
      <BlurText text="Test heading" className="text-3xl font-bold" />,
    );
    const container = document.querySelector('.text-3xl');
    expect(container).toBeInTheDocument();
  });

  it('renders as an aria-accessible element containing all text', () => {
    render(<BlurText text="Dashboard" />);
    // The full text should be findable in the DOM for screen readers
    expect(document.body.textContent).toContain('Dashboard');
  });

  it('accepts and applies an element tag via "as" prop', () => {
    render(<BlurText text="Settings" as="h1" />);
    const heading = document.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toContain('Settings');
  });

  it('applies custom delay', () => {
    // Shouldn't throw when a numeric delay is provided
    expect(() => render(<BlurText text="Test" delay={0.05} />)).not.toThrow();
  });

  it('respects prefers-reduced-motion by still rendering text', () => {
    // When reduced motion is on the component should still mount and show text
    jest.mock('framer-motion', () => ({
      motion: {
        span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
          <span {...props}>{children}</span>
        ),
      },
      useReducedMotion: () => true, // override to simulate reduced-motion preference
    }));
    render(<BlurText text="Accessible" />);
    expect(document.body.textContent).toContain('Accessible');
  });
});
