"use client"

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, 
  Volume2, Search, LayoutGrid, Library, Heart, ListMusic,
  Maximize2, Mic2, Radio
} from 'lucide-react'

// Reuse your MouseGlow for consistency across the app
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
    const c = container

    let width = cvs.width = c.offsetWidth
    let height = cvs.height = c.offsetHeight
    let mouseX = -999, mouseY = -999, targetX = -999, targetY = -999
    let isInside = false, globalAlpha = 0

    function resize() {
      width = cvs.width = c.offsetWidth
      height = cvs.height = c.offsetHeight
    }

    const onMouseMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect()
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
    }

    window.addEventListener('resize', resize)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseenter', () => isInside = true)
    container.addEventListener('mouseleave', () => isInside = false)

    function draw() {
      context.clearRect(0, 0, width, height)
      if (isInside) globalAlpha = Math.min(1, globalAlpha + 0.05)
      else globalAlpha = Math.max(0, globalAlpha - 0.04)

      if (globalAlpha > 0) {
        mouseX += (targetX - mouseX) * 0.08
        mouseY += (targetY - mouseY) * 0.08

        const grad = context.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250)
        grad.addColorStop(0, `rgba(74,222,128,${0.07 * globalAlpha})`)
        grad.addColorStop(1, 'rgba(74,222,128,0)')
        context.fillStyle = grad
        context.fillRect(0, 0, width, height)
      }
      requestAnimationFrame(draw)
    }
    draw()
    return () => {
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousemove', onMouseMove)
    }
  }, [containerRef])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
}

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="relative h-screen w-full bg-[#0a1a0f] text-[#f0f7f0] overflow-hidden flex font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .nav-wordmark { font-family: 'Cormorant Garamond', serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(74, 222, 128, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(74, 222, 128, 0.2); }
      `}</style>

      <MouseGlow containerRef={containerRef} />

      {/* ── SIDEBAR ── */}
      <aside className="w-64 border-r border-[#4ade80]/10 bg-[#0a1a0f]/50 backdrop-blur-md flex flex-col z-10">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 no-underline group mb-10">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform">
              <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
              <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="nav-wordmark font-semibold text-lg tracking-widest text-[#f0f7f0] uppercase">Groove Garden</span>
          </Link>

          <nav className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b8a6e] font-bold">Main Nursery</p>
              <NavItem icon={<LayoutGrid size={18} />} label="Home" active />
              <NavItem icon={<Search size={18} />} label="Search" />
              <NavItem icon={<Library size={18} />} label="Your Garden" />
            </div>

            <div className="space-y-3 pt-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b8a6e] font-bold">Your Plots</p>
              <NavItem icon={<Heart size={18} />} label="Liked Growth" />
              <NavItem icon={<Radio size={18} />} label="Radio Stations" />
              <NavItem icon={<ListMusic size={18} />} label="Recently Planted" />
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6">
          <div className="bg-[#122016] border border-[#4ade80]/10 rounded-2xl p-4">
            <p className="text-[11px] text-[#a3b8a5] mb-2 italic">Supporting 12 indie artists this month</p>
            <div className="h-1.5 w-full bg-[#0a1a0f] rounded-full overflow-hidden">
              <div className="h-full bg-[#4ade80] w-[70%]" />
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-y-auto relative z-10">
        {/* Header */}
        <header className="sticky top-0 px-8 py-6 flex justify-between items-center bg-[#0a1a0f]/60 backdrop-blur-xl z-20">
          <div className="flex gap-4">
            <button className="w-8 h-8 rounded-full bg-[#122016] border border-[#4ade80]/10 flex items-center justify-center text-[#a3b8a5] hover:text-[#f0f7f0]">{"<"}</button>
            <button className="w-8 h-8 rounded-full bg-[#122016] border border-[#4ade80]/10 flex items-center justify-center text-[#a3b8a5] hover:text-[#f0f7f0]">{">"}</button>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-5 py-2 rounded-full border border-[#4ade80]/20 text-[11px] uppercase tracking-widest hover:bg-[#4ade80]/5 transition-colors">Upgrade Plot</button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#4ade80] border-2 border-[#0a1a0f] shadow-lg" />
          </div>
        </header>

        {/* Hero Section */}
        <div className="px-10 py-6">
          <section className="relative rounded-3xl overflow-hidden p-10 bg-gradient-to-br from-[#163a20] to-[#0a1a0f] border border-[#4ade80]/10 mb-10">
            <div className="relative z-10 max-w-lg">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#4ade80] font-bold mb-4 block">Editor's Choice</span>
              <h1 className="text-5xl font-extrabold mb-4 leading-tight">Fresh Blooms <br/>for the Weekend</h1>
              <p className="text-[#a3b8a5] text-sm mb-8 leading-relaxed">Hand-picked independent tracks that are currently trending in the Garden. Purely human-curated discovery.</p>
              <div className="flex gap-4">
                <button className="px-8 py-3 bg-[#4ade80] text-[#0a1a0f] rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">Play Mix</button>
                <button className="px-8 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">Save to Plot</button>
              </div>
            </div>
            {/* Abstract Garden Decor */}
            <div className="absolute right-[-5%] top-[-10%] w-[400px] h-[400px] bg-[#4ade80]/10 blur-[100px] rounded-full" />
          </section>

          {/* Grid Section */}
          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold tracking-tight">Recent Growth</h2>
              <button className="text-xs text-[#6b8a6e] hover:text-[#4ade80] transition-colors uppercase tracking-widest">See all</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <TrackCard key={i} index={i} />
              ))}
            </div>
          </section>
        </div>
        
        {/* Spacer for player bar */}
        <div className="h-32 min-h-[128px]" />
      </main>

      {/* ── PLAYBACK BAR ── */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#0d2010]/80 backdrop-blur-2xl border-t border-[#4ade80]/10 px-6 flex items-center justify-between z-50">
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-[30%]">
          <div className="w-14 h-14 bg-[#1a3a20] rounded-lg border border-[#4ade80]/10 flex-shrink-0 relative group overflow-hidden">
            <img 
                src={`https://api.dicebear.com/7.x/shapes/svg?seed=${123}&backgroundColor=1a3a20`} 
                alt="cover" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform" 
            />
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={16} />
            </button>
          </div>
          <div>
            <h4 className="text-sm font-semibold hover:underline cursor-pointer">Organic Synths</h4>
            <p className="text-[11px] text-[#a3b8a5] hover:text-[#4ade80] cursor-pointer transition-colors">The Gardener</p>
          </div>
          <button className="ml-2 text-[#6b8a6e] hover:text-[#4ade80] transition-colors">
            <Heart size={18} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 w-[40%]">
          <div className="flex items-center gap-6">
            <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors"><Shuffle size={18} /></button>
            <button className="text-[#f0f7f0] hover:scale-110 transition-transform"><SkipBack size={22} fill="currentColor" /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-[#f0f7f0] text-[#0a1a0f] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(74,222,128,0.3)]"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
            </button>
            <button className="text-[#f0f7f0] hover:scale-110 transition-transform"><SkipForward size={22} fill="currentColor" /></button>
            <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors"><Repeat size={18} /></button>
          </div>
          <div className="flex items-center gap-3 w-full max-w-md">
            <span className="text-[10px] text-[#6b8a6e] font-mono">1:24</span>
            <div className="flex-1 h-1 bg-[#1a3a20] rounded-full relative group cursor-pointer">
              <div className="absolute top-0 left-0 h-full bg-[#4ade80] w-[35%] rounded-full group-hover:bg-[#22c55e]">
                <div className="absolute right-[-4px] top-[-3px] w-2.5 h-2.5 bg-[#f0f7f0] rounded-full opacity-0 group-hover:opacity-100 shadow-md" />
              </div>
            </div>
            <span className="text-[10px] text-[#6b8a6e] font-mono">3:45</span>
          </div>
        </div>

        {/* Volume/Extras */}
        <div className="flex items-center justify-end gap-4 w-[30%]">
          <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors"><Mic2 size={16} /></button>
          <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors"><ListMusic size={16} /></button>
          <div className="flex items-center gap-2 w-24">
            <Volume2 size={16} className="text-[#6b8a6e]" />
            <div className="flex-1 h-1 bg-[#1a3a20] rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-[#a3b8a5] w-[80%] rounded-full" />
            </div>
          </div>
        </div>

      </footer>
    </div>
  )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center gap-4 w-full px-2 py-1.5 rounded-lg transition-all group ${active ? 'text-[#4ade80]' : 'text-[#a3b8a5] hover:text-[#f0f7f0]'}`}>
      <span className={`${active ? 'text-[#4ade80]' : 'text-[#6b8a6e] group-hover:text-[#4ade80]'} transition-colors`}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function TrackCard({ index }: { index: number }) {
  return (
    <div className="bg-[#122016]/40 border border-[#4ade80]/5 p-4 rounded-2xl hover:bg-[#122016]/80 transition-all group cursor-pointer hover:-translate-y-1">
      <div className="aspect-square bg-[#0a1a0f] rounded-xl mb-4 overflow-hidden relative shadow-inner">
         <img 
            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${index * 42}&backgroundColor=1a3a20`} 
            alt="Art" 
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
         />
         <button className="absolute bottom-3 right-3 w-10 h-10 bg-[#4ade80] rounded-full flex items-center justify-center text-[#0a1a0f] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
           <Play size={18} fill="currentColor" className="ml-1" />
         </button>
      </div>
      <h3 className="font-bold text-sm mb-1 truncate">Wildflower Ep. {index}</h3>
      <p className="text-xs text-[#6b8a6e] truncate font-medium">Independent Artist</p>
    </div>
  )
}