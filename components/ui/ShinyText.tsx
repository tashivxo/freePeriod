import type { CSSProperties } from 'react';

interface ShinyTextProps {
  text: string;
  className?: string;
  /** Animation duration in seconds */
  speed?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Shine highlight color */
  shineColor?: string;
  /** Base text color */
  color?: string;
  /** Width of the shine sweep in degrees */
  spread?: number;
  /** Pause shine on hover */
  pauseOnHover?: boolean;
  /** Disable the animation */
  disabled?: boolean;
}

export function ShinyText({
  text,
  className = '',
  speed = 3,
  delay = 0,
  shineColor = 'rgba(255, 255, 255, 0.85)',
  color = 'currentColor',
  spread = 45,
  pauseOnHover = false,
  disabled = false,
}: ShinyTextProps) {
  const animationStyle: CSSProperties = {
    '--shine-color': shineColor,
    '--text-color': color,
    '--spread': `${spread}deg`,
    animationDuration: disabled ? 'unset' : `${speed}s`,
    animationDelay: `${delay}s`,
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    animationPlayState: 'running',
    background: `linear-gradient(
      calc(var(--spread) * 0.5),
      var(--text-color) 20%,
      var(--shine-color) 50%,
      var(--text-color) 80%
    )`,
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  } as CSSProperties;

  return (
    <>
      <style>{`
        @keyframes shiny-text-sweep {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }
        .shiny-text-anim {
          animation-name: shiny-text-sweep;
        }
        .shiny-text-anim:hover {
          ${pauseOnHover ? 'animation-play-state: paused;' : ''}
        }
      `}</style>
      <span
        className={`shiny-text-anim ${disabled ? '' : ''} ${className}`}
        style={animationStyle}
      >
        {text}
      </span>
    </>
  );
}
