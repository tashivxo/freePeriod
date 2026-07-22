import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export type AnimatedIconProps = {
  size?: number;
  animationDisabled?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export type AnimatedIconComponent = ForwardRefExoticComponent<
  AnimatedIconProps & RefAttributes<AnimatedIconHandle>
>;
