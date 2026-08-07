import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge, validators } from "tailwind-merge"

/**
 * Treat animate zoom-in/zoom-out scales as conflicting groups so
 * `data-open:zoom-in-[0.97]` replaces `data-open:zoom-in-95` (etc.).
 * Default twMerge does not know these tw-animate utilities.
 */
const twMerge = extendTailwindMerge({
  extend: {
    // Custom tw-animate groups are not in DefaultClassGroupIds
    classGroups: {
      "zoom-in": [{ "zoom-in": [validators.isAny] }],
      "zoom-out": [{ "zoom-out": [validators.isAny] }],
    } as Record<string, [{ [key: string]: (typeof validators.isAny)[] }]>,
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
