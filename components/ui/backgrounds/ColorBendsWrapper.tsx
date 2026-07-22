"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
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
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion)

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
      <ColorBends className="" style={{}} />
    </div>
  )
}
