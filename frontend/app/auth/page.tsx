"use client"

import { useState, ChangeEvent, KeyboardEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Blobs from '../../components/Blobs'

function MouseGlow({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cvs = canvas as HTMLCanvasElement
    const context = ctx as CanvasRenderingContext2D

    // we know container is non-null beyond this point
    const c = container

    let width = cvs.width = c.offsetWidth
    let height = cvs.height = c.offsetHeight

    let mouseX = -999
    let mouseY = -999
    let targetX = -999
    let targetY = -999
    let isInside = false
    let globalAlpha = 0 // for fade in/out

    type Point = { x: number; y: number }
    const trail: Point[] = []
    const MAX_TRAIL = 25

    let animId: number

    function resize() {
      width = cvs.width = c.offsetWidth
      height = cvs.height = c.offsetHeight
    }

    function onMouseMove(e: MouseEvent) {
      const rect = c.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
    }

    function onMouseEnter() { isInside = true }
    function onMouseLeave() { isInside = false }

    window.addEventListener('resize', resize)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseenter', onMouseEnter)
    container.addEventListener('mouseleave', onMouseLeave)

    function draw() {
      context.clearRect(0, 0, width, height)

      // Fade in/out smoothly
      if (isInside) globalAlpha = Math.min(1, globalAlpha + 0.05)
      else globalAlpha = Math.max(0, globalAlpha - 0.04)

      if (globalAlpha > 0) {
        // Smooth follow
        mouseX += (targetX - mouseX) * 0.08
        mouseY += (targetY - mouseY) * 0.08

        // Trail
        trail.push({ x: mouseX, y: mouseY })
        if (trail.length > MAX_TRAIL) trail.shift()

        // Draw trail — subtle thin fading line
        for (let i = 1; i < trail.length; i++) {
          const t = i / trail.length
          const alpha = t * 0.12 * globalAlpha
          context.beginPath()
          context.moveTo(trail[i - 1].x, trail[i - 1].y)
          context.lineTo(trail[i].x, trail[i].y)
          context.strokeStyle = `rgba(74,222,128,${alpha})`
          context.lineWidth = t * 1.5
          context.lineCap = 'round'
          context.stroke()
        }

        // Outer soft glow
        const outerGrad = context.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 160)
        outerGrad.addColorStop(0, `rgba(74,222,128,${0.06 * globalAlpha})`)
        outerGrad.addColorStop(1, 'rgba(74,222,128,0)')
        context.beginPath()
        context.arc(mouseX, mouseY, 160, 0, Math.PI * 2)
        context.fillStyle = outerGrad
        context.fill()

        // Inner glow
        const innerGrad = context.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 40)
        innerGrad.addColorStop(0, `rgba(74,222,128,${0.18 * globalAlpha})`)
        innerGrad.addColorStop(1, 'rgba(74,222,128,0)')
        context.beginPath()
        context.arc(mouseX, mouseY, 40, 0, Math.PI * 2)
        context.fillStyle = innerGrad
        context.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseenter', onMouseEnter)
      container.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animId)
    }
  }, [containerRef])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}


export default function Auth() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const leftPanelRef = useRef<HTMLDivElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login' ? { email: form.email, password: form.password } : form
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Algo salió mal'); return }
      localStorage.setItem('gg_token', data.token)
      router.push('/')
    } catch {
      setError('No se pudo conectar al servidor. ¿Está corriendo el backend?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen grid grid-cols-2 text-[#f0f7f0]">

      {/* ── LEFT ── */}
      <div
        ref={leftPanelRef}
        className="relative flex items-center px-12 py-12 overflow-hidden bg-[#0a1a0f]"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px),
                             repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px)`,
          }}
        />
        {/* mouse glow overlay */}
        <MouseGlow containerRef={leftPanelRef} />
        <Blobs />

        <div className="relative z-10 max-w-[500px]">
          <div className="flex items-center gap-3 mb-12">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
              <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 22 C10 22, 8 21, 7 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M18 22 C18 22, 20 21, 21 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-extrabold text-xs tracking-widest leading-tight whitespace-pre">{'GROOVE\nGARDEN'}</span>
          </div>

          <h1 className="font-extrabold text-[clamp(32px,4vw,52px)] leading-[1.1] mb-5">
            Music deserves<br />a place to <em className="text-[#4ade80] not-italic">grow</em>
          </h1>
          <p className="text-base text-[#a3b8a5] leading-7 max-w-[440px] mb-12">
            Join a streaming platform where small artists can grow for real. Each stream has a real weight.
          </p>

          <div className="flex flex-col gap-6">
            {[
              { title: '70% directly to the artist', desc: 'No intermediaries, just you and your music.' },
              { title: 'Your streams, your impact', desc: 'Smart distribution based on what you listen to.' },
              { title: 'Community before algorithms', desc: 'Human-based discoveries' },
            ].map(f => (
              <div key={f.title} className="flex gap-5 items-start">
                <div className="w-12 h-12 min-w-[48px] bg-[#1a3a20] rounded-xl border border-[#4ade80]/10" />
                <div>
                  <p className="font-semibold text-base mb-1">{f.title}</p>
                  <p className="text-sm text-[#a3b8a5]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="relative flex flex-col items-center justify-center px-12 py-12 bg-[#0d2010] border-l border-[#4ade80]/10">
        <button
          onClick={() => router.push('/')}
          className="absolute top-10 right-12 bg-transparent border-none text-sm text-[#a3b8a5] hover:text-[#f0f7f0] transition-colors cursor-pointer"
        >
          ← Go back
        </button>

        <div className="w-full max-w-[400px]">
          <div className="flex bg-[#122016] border border-[#4ade80]/10 rounded-full p-1 mb-8">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2.5 px-5 rounded-full text-sm font-medium transition-all cursor-pointer border-none
                  ${mode === m ? 'bg-[#0a1a0f] text-[#f0f7f0] font-semibold' : 'bg-transparent text-[#6b8a6e]'}`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-extrabold text-2xl mb-1">
              Welcome <em className="text-[#4ade80] not-italic">{mode === 'login' ? 'back' : 'aboard'}</em>
            </h2>
            <p className="text-xs text-[#a3b8a5]">{mode === 'login' ? 'What are we feeling today?' : 'Join the garden 🌱'}</p>
          </div>

          <button
            onClick={() => alert('Google OAuth próximamente!')}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#122016] border border-[#4ade80]/10 rounded-xl text-sm font-medium hover:bg-[#162a1a] transition-colors cursor-pointer mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Log in with Google
          </button>

          <div className="flex items-center gap-3 mb-5 text-xs text-[#6b8a6e]">
            <div className="flex-1 h-px bg-[#4ade80]/10" />
            <span>use your email</span>
            <div className="flex-1 h-px bg-[#4ade80]/10" />
          </div>

          {mode === 'signup' && (
            <div className="mb-4">
              <label className="block text-xs text-[#a3b8a5] mb-1.5">Name:</label>
              <input
                type="text" name="name" placeholder="Your name" value={form.name} onChange={handleChange}
                className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs text-[#a3b8a5] mb-1.5">E-mail:</label>
            <input
              type="email" name="email" placeholder="email@mail.com" value={form.email} onChange={handleChange}
              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-[#a3b8a5] mb-1.5">Password:</label>
            <input
              type="password" name="password" placeholder="password" value={form.password} onChange={handleChange}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSubmit()}
              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 mb-3 px-3.5 py-2.5 bg-red-400/10 border border-red-400/20 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 mt-2 bg-[#166534] border-none rounded-xl text-[#f0f7f0] font-semibold hover:bg-[#22c55e] hover:text-[#0a1a0f] hover:-translate-y-px transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-h-[50px]"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : mode === 'login' ? 'Log in' : 'Create account'
            }
          </button>
        </div>
      </div>

    </div>
  )
}