"use client"

import { useEffect, useRef } from 'react'

// Petal shapes as SVG paths - organic, varied
const PETAL_SHAPES = [
  // Elongated teardrop
  "M0,-18 C5,-12 8,0 0,18 C-8,0 -5,-12 0,-18Z",
  // Wide oval petal
  "M0,-14 C9,-10 12,0 0,14 C-12,0 -9,-10 0,-14Z",
  // Asymmetric petal
  "M0,-20 C6,-10 10,4 2,16 C-4,8 -7,-6 0,-20Z",
  // Round petal
  "M0,-12 C8,-8 10,4 0,14 C-10,4 -8,-8 0,-12Z",
]

const COLORS = [
  'rgba(74,222,128,0.5)',
  'rgba(34,197,94,0.2)',
  'rgba(74,222,128,0.8)',
  'rgba(240,247,240,0.6)',
  'rgba(163,184,165,0.2)',
]

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function Petals({ count = 18 }) {
  const canvasRef = useRef(null)
  const petalsRef = useRef([])
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init petals
    petalsRef.current = Array.from({ length: count }, (_, i) => ({
      x: randomBetween(0, window.innerWidth),
      y: randomBetween(-200, window.innerHeight),
      size: randomBetween(7, 18),
      rotation: randomBetween(0, Math.PI * 2),
      rotSpeed: randomBetween(-0.008, 0.008),
      speedY: randomBetween(0.3, 0.9),
      speedX: randomBetween(-0.15, 0.15),
      drift: randomBetween(0, Math.PI * 2), // sine drift phase
      driftSpeed: randomBetween(0.005, 0.015),
      driftAmp: randomBetween(0.2, 0.6),
      shapeIndex: Math.floor(Math.random() * PETAL_SHAPES.length),
      colorIndex: Math.floor(Math.random() * COLORS.length),
      opacity: randomBetween(0.4, 1),
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      petalsRef.current.forEach(p => {
        // Update
        p.drift += p.driftSpeed
        p.x += p.speedX + Math.sin(p.drift) * p.driftAmp
        p.y += p.speedY
        p.rotation += p.rotSpeed

        // Reset when off screen
        if (p.y > canvas.height + 30) {
          p.y = -30
          p.x = randomBetween(0, canvas.width)
        }

        // Draw
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.globalAlpha = p.opacity

        const path = new Path2D(PETAL_SHAPES[p.shapeIndex])
        ctx.scale(p.size / 14, p.size / 14)

        // Subtle glow
        ctx.shadowColor = 'rgba(74,222,128,0.3)'
        ctx.shadowBlur = 8

        ctx.fillStyle = COLORS[p.colorIndex]
        ctx.fill(path)

        // Subtle stroke
        ctx.strokeStyle = 'rgba(74,222,128,0.03)'
        ctx.lineWidth = 0.8
        ctx.stroke(path)

        ctx.restore()
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-1"
      style={{ opacity: 0.85 }}
    />
  )
}