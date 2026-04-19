"use client"

import dynamic from "next/dynamic"

const ColorBends = dynamic(
  () => import("./ColorBends"),
  { ssr: false }
)

export function ColorBendsBackground() {
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
