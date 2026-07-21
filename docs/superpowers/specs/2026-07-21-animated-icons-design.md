# Animated Icons Design

## Goal

Replace static `lucide-react` icons with hover-animated counterparts from [lucide-animated](https://lucide-animated.com) at key UI touchpoints. Icons install to `components/icons/` via the shadcn registry (`@lucide-animated` in `components.json`).

## Icon inventory

| Static (lucide-react) | Animated component | Install slug |
|-----------------------|------------------|--------------|
| Home | HomeIcon | home |
| PenLine (nav) | FilePenLineIcon | file-pen-line |
| Clock | ClockIcon | clock |
| Settings | SettingsIcon | settings |
| Upload | UploadIcon | upload |
| Sun | SunIcon | sun |
| Moon | MoonIcon | moon |
| PenLine (features/CTA) | PenToolIcon | pen-tool |
| Sparkles | SparklesIcon | sparkles |
| Download | DownloadIcon | download |
| Zap | ZapIcon | zap |
| BookOpen | BookTextIcon | book-text |

## Consumer map

| File | Icons replaced |
|------|----------------|
| `components/layout/Navbar.tsx` | Home, FilePenLine, Clock, Settings |
| `components/ui/ThemeToggle.tsx` | Sun, Moon |
| `app/page.tsx` | PenTool, Sparkles, Download, BookText; floating theme toggle |
| `features/billing/components/PricingClient.tsx` | BookText, Sparkles, Zap; floating theme toggle |
| `components/forms/DocumentUploadZone.tsx` | Upload |
| `features/lesson/components/LessonView.tsx` | BookText, Clock, Download |
| `app/(app)/dashboard/page.tsx` | BookText |
| `features/history/components/HistoryClient.tsx` | BookText |
| `components/ui/UpgradePrompt.tsx` | Zap (header + bullets) |

## Sizing map

| Context | `size` prop |
|---------|-------------|
| Nav, lesson metadata | 16 |
| Dashboard/history row metadata | 12 |
| Upload zone | 24 |
| Feature lead card | 28 |
| Feature supporting / pricing plan | 20 |
| Theme toggle | 18 |
| UpgradePrompt header | 28 |
| UpgradePrompt list bullets | 11 |

Pass `className="text-current"` (or contextual color classes) on the icon wrapper so `stroke="currentColor"` inherits from the parent.

## Reduced motion

Animated icons disable auto-hover when a `ref` is attached (`useImperativeHandle` sets controlled mode). `hooks/useMotionSafeIconRef.ts` returns a ref when `prefers-reduced-motion: reduce` is on (static icon, no hover animation), otherwise `undefined` (default hover animation).

## ThemeToggle API

```ts
variant?: 'icon' | 'floating-label'  // default 'icon'
className?: string
buttonRef?: React.Ref<HTMLButtonElement>
wrapperClassName?: string
```

- **Settings:** `<ThemeToggle />` — icon-only button
- **Homepage / Pricing:** `<ThemeToggle variant="floating-label" wrapperClassName="fixed bottom-6 right-6 z-50" />` — includes "Try light/dark mode" label

## Shared types

`components/icons/types.ts`:

```ts
export type AnimatedIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  ref?: React.Ref<unknown>;
}>;
```

## Out of scope

- `GenerationModePicker` Zap/Sparkles config (not rendered in JSX)
- Generic UI chrome: `X`, `Check`, `ArrowLeft`, `Plus`, `Trash2`, `Search`, etc.
- Any lucide icon not listed in the inventory above

## Success criteria

- All 12 icons installed under `components/icons/`
- Zero remaining target lucide imports in scoped files
- `npm test`, `npm run lint`, `npm run build` pass
- Theme toggles consolidated to `ThemeToggle`
- Hover animations work on desktop; static under reduced motion
