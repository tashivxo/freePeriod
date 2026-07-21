import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

export type AnimatedIconComponent = ForwardRefExoticComponent<
  { size?: number } & HTMLAttributes<HTMLDivElement> & RefAttributes<unknown>
>;
