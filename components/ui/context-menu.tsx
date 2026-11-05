"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Shared look for floating action menus (right-click and "..." button), matching the
 * listbox in animated-dropdown: elevated surface, hairline border, highest shadow tier.
 * Motion is a short fade plus 0.97 scale from the pointer origin, off for reduced motion.
 */
export const menuContentClass =
  "z-[10000] min-w-[11rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background-elevated)] py-1 text-[var(--color-text-primary)] shadow-xl duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.97] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-[0.97] motion-reduce:animate-none"

export const menuItemClass =
  "relative flex min-h-11 cursor-pointer select-none items-center gap-2 px-3 py-2.5 font-body text-sm outline-none transition-colors duration-100 sm:min-h-0 data-[highlighted]:bg-[var(--color-primary-light)]/20 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-coral/40 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"

export const menuItemDestructiveClass =
  "text-red-700 dark:text-red-400 data-[highlighted]:bg-destructive/10"

export const menuSeparatorClass = "my-1 h-px bg-[var(--color-border)]"

function ContextMenu(props: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

function ContextMenuTrigger(
  props: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>
) {
  return <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
}

function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          menuContentClass,
          "origin-[var(--radix-context-menu-content-transform-origin)]",
          className
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuItem({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-variant={variant}
      className={cn(
        menuItemClass,
        variant === "destructive" && menuItemDestructiveClass,
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn(menuSeparatorClass, className)}
      {...props}
    />
  )
}

export {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
}
