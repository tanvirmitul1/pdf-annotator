"use client"

import React, { useEffect, useRef } from "react"
import * as d3 from "d3"

interface BubbleNode extends d3.SimulationNodeDatum {
  radius: number
  color: string
  letter: string
}

const PALETTE = [
  "#e76f51",
  "#f4a261",
  "#e9c46a",
  "#2a9d8f",
  "#264653",
  "#8ab17d",
  "#b5179e",
  "#7209b7",
  "#4361ee",
]

export default function HeroBubbles() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return

    const container = containerRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = container.clientWidth
    let height = container.clientHeight

    const dpr = window.devicePixelRatio || 1
    const setupCanvasScale = () => {
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setupCanvasScale()

    // Cluster center: horizontally centered, vertically centered
    const clusterCenterY = () => height * 0.6

    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    const numNodes = 400
    const nodes: BubbleNode[] = Array.from({ length: numNodes }, (_, i) => {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * Math.min(width, height) * 0.32
      return {
        x: width / 2 + Math.cos(angle) * dist,
        y: clusterCenterY() + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: Math.random() * 10 + 10, // 10–20px
        color: PALETTE[i % PALETTE.length],
        letter: LETTERS[i % LETTERS.length],
      }
    })

    const pointer = { x: -9999, y: -9999, active: false }

    const simulation = d3
      .forceSimulation<BubbleNode>(nodes)
      .alphaDecay(0)
      .alphaTarget(1)
      .velocityDecay(0.005)
      .force(
        "collide",
        d3
          .forceCollide<BubbleNode>()
          .radius((d) => d.radius + 1)
          .iterations(2)
          .strength(0.7)
      )

    simulation.stop()

    let raf = 0

    const animate = () => {
      const cx = width / 2
      const cy = clusterCenterY()

      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue

        const dx = cx - node.x
        const dy = cy - node.y

        // 1. Pull toward cluster center
        const pullStrength = 0.0004
        node.vx! += dx * pullStrength
        node.vy! += dy * pullStrength

        // 2. Viscous drag
        node.vx! *= 0.94
        node.vy! *= 0.94

        // 3. Mouse repulsion
        if (pointer.active) {
          const mdx = node.x - pointer.x
          const mdy = node.y - pointer.y
          const mouseDist = Math.sqrt(mdx * mdx + mdy * mdy)
          const repelRadius = 300

          if (mouseDist > 0 && mouseDist < repelRadius) {
            const t = mouseDist / repelRadius
            const force = (1 - t) * (1 - t) * (1 - t) * 35
            node.vx! += (mdx / mouseDist) * force
            node.vy! += (mdy / mouseDist) * force
          }
        }
      }

      simulation.tick()

      ctx.clearRect(0, 0, width, height)

      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      for (const node of nodes) {
        if (node.x === undefined || node.y === undefined) continue
        const fontSize = node.radius * 1.6
        ctx.font = `700 ${fontSize}px "Inter", "SF Pro Display", system-ui, sans-serif`
        ctx.fillStyle = node.color
        ctx.fillText(node.letter, node.x, node.y)
      }

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)

    const updatePointer = (pcx: number, pcy: number) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = pcx - rect.left
      pointer.y = pcy - rect.top
      pointer.active = true
    }

    const onMouseMove = (e: MouseEvent) => updatePointer(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointer(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    const onPointerLeave = () => {
      pointer.active = false
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    window.addEventListener("mouseleave", onPointerLeave)
    window.addEventListener("touchend", onPointerLeave)

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = entry.contentRect.width
        height = entry.contentRect.height
        setupCanvasScale()
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(raf)
      simulation.stop()
      resizeObserver.disconnect()
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("mouseleave", onPointerLeave)
      window.removeEventListener("touchend", onPointerLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 h-full w-full overflow-hidden"
    >
      <canvas ref={canvasRef} className="block h-full w-full opacity-80" />
    </div>
  )
}
