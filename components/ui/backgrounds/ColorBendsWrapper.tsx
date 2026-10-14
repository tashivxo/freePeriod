"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { COLOR_BENDS_INTENSITY, COLOR_BENDS_PALETTE } from "@/lib/utils/brand-colors"
import { useColorBendsAtmosphere } from "@/providers/color-bends-atmosphere"
import { useTheme } from "@/providers/theme"
import { useZenMode } from "@/providers/zen-mode"

const ColorBends = dynamic(
  () => import("./ColorBends"),
  { ssr: false }
)

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function ColorBendsBackground() {
  const { zenMode } = useZenMode()
  const { resolvedTheme } = useTheme()
  const { resolvedAtmosphere } = useColorBendsAtmosphere()
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion)
  const intensity =
    resolvedTheme === "dark" ? COLOR_BENDS_INTENSITY.dark : COLOR_BENDS_INTENSITY.light

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  if (zenMode || prefersReduced) return null

  return (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        zIndex: 0, 
        pointerEvents: "none",
        width: "100vw",
        height: "100vh"
      }}
    >
      <ColorBends
        className=""
        style={{}}
        colors={resolvedAtmosphere === "brand" ? [...COLOR_BENDS_PALETTE] : []}
        intensity={intensity}
      />
    </div>
  )
}
