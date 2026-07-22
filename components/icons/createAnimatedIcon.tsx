'use client';

import { useAnimation } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  type ReactNode,
} from 'react';

import { cn } from '@/lib/utils';
import type { AnimatedIconHandle, AnimatedIconProps } from '@/components/icons/types';

type AnimationControls = ReturnType<typeof useAnimation>;

type IconRenderContext = {
  size: number;
  controls: AnimationControls;
};

type MultiControlRenderContext = {
  size: number;
  controls: Record<string, AnimationControls>;
};

type CreateAnimatedIconConfig = {
  displayName: string;
  defaultSize?: number;
  render: (ctx: IconRenderContext) => ReactNode;
  onActivate?: (controls: AnimationControls) => void;
  onDeactivate?: (controls: AnimationControls) => void;
};

type CreateMultiControlAnimatedIconConfig = {
  displayName: string;
  defaultSize?: number;
  controlKeys: readonly string[];
  render: (ctx: MultiControlRenderContext) => ReactNode;
  onActivate?: (controls: Record<string, AnimationControls>) => void;
  onDeactivate?: (controls: Record<string, AnimationControls>) => void;
};

export function createAnimatedIcon({
  displayName,
  defaultSize = 28,
  render,
  onActivate,
  onDeactivate,
}: CreateAnimatedIconConfig) {
  const Icon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
      { animationDisabled = false, onMouseEnter, onMouseLeave, className, size = defaultSize, ...props },
      ref,
    ) => {
      const controls = useAnimation();

      useImperativeHandle(ref, () => ({
        startAnimation: () => onActivate?.(controls),
        stopAnimation: () => onDeactivate?.(controls),
      }));

      const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseEnter?.(e);
          if (animationDisabled) return;
          onActivate?.(controls);
        },
        [animationDisabled, controls, onActivate, onMouseEnter],
      );

      const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseLeave?.(e);
          if (animationDisabled) return;
          onDeactivate?.(controls);
        },
        [animationDisabled, controls, onDeactivate, onMouseLeave],
      );

      return (
        <div
          className={cn(className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          {render({ size, controls })}
        </div>
      );
    },
  );

  Icon.displayName = displayName;
  return Icon;
}

export function createMultiControlAnimatedIcon({
  displayName,
  defaultSize = 28,
  controlKeys,
  render,
  onActivate,
  onDeactivate,
}: CreateMultiControlAnimatedIconConfig) {
  const Icon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    (
      { animationDisabled = false, onMouseEnter, onMouseLeave, className, size = defaultSize, ...props },
      ref,
    ) => {
      const primaryControls = useAnimation();
      const secondaryControls = useAnimation();
      const controlsMap = {
        [controlKeys[0]]: primaryControls,
        ...(controlKeys[1] ? { [controlKeys[1]]: secondaryControls } : {}),
      } as Record<string, AnimationControls>;

      useImperativeHandle(ref, () => ({
        startAnimation: () => onActivate?.(controlsMap),
        stopAnimation: () => onDeactivate?.(controlsMap),
      }));

      const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseEnter?.(e);
          if (animationDisabled) return;
          onActivate?.(controlsMap);
        },
        [animationDisabled, controlsMap, onActivate, onMouseEnter],
      );

      const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          onMouseLeave?.(e);
          if (animationDisabled) return;
          onDeactivate?.(controlsMap);
        },
        [animationDisabled, controlsMap, onDeactivate, onMouseLeave],
      );

      return (
        <div
          className={cn(className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          {render({ size, controls: controlsMap })}
        </div>
      );
    },
  );

  Icon.displayName = displayName;
  return Icon;
}
