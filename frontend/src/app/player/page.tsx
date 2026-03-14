"use client"

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Play, Pause, Search, LayoutGrid, Library, Heart, X, Music, ChevronRight } from 'lucide-react'
import PlaybackBar from '@/components/PlaybackBar'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string
  cover_url?: string
}

interface UserProfile {
  id: string
  username: string
  email: string
  plan_type: string
  artist_id?: string
}

const formatTime = (time: number) => {
  if (!time || isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function FloatingElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute animate-bounce opacity-10"
          style={{ left: `${10 + i * 12}%`, top: `${10 + (i % 3) * 30}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i * 0.3}s` }}>
          <div className="w-2 h-2 bg-[#4ade80] rounded-full blur-sm" />
        </div>
      ))}
    </div>
  )
}

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
    function resize() { width = cvs.width = c.offsetWidth; height = cvs.height = c.offsetHeight }
    const onMouseMove = (e: MouseEvent) => { const rect = c.getBoundingClientRect(); targetX = e.clientX - rect.left; targetY = e.clientY - rect.top }
    window.addEventListener('resize', resize)
    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseenter', () => isInside = true)
    container.addEventListener('mouseleave', () => isInside = false)
    function draw() {
      context.clearRect(0, 0, width, height)
      if (isInside) globalAlpha = Math.min(1, globalAlpha + 0.05)
      else globalAlpha = Math.max(0, globalAlpha - 0.04)
      if (globalAlpha > 0) {
        mouseX += (targetX - mouseX) * 0.08; mouseY += (targetY - mouseY) * 0.08
        const grad = context.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 250)
        grad.addColorStop(0, `rgba(74,222,128,${0.07 * globalAlpha})`); grad.addColorStop(1, 'rgba(74,222,128,0)')
        context.fillStyle = grad; context.fillRect(0, 0, width, height)
      }
      requestAnimationFrame(draw)
    }
    draw()
    return () => { window.removeEventListener('resize', resize); container.removeEventListener('mousemove', onMouseMove) }
  }, [containerRef])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
}

function TrackCard({ track, onPlay, onLike, isLiked }: { track: Track, onPlay: (track: Track) => void, onLike: (trackId: string) => void, isLiked: boolean }) {
  return (
    <div className="bg-[#122016]/40 border border-[#4ade80]/5 p-4 rounded-2xl hover:bg-[#122016]/80 transition-all group cursor-pointer hover:-translate-y-1">
      <div className="aspect-square bg-[#0a1a0f] rounded-xl mb-4 overflow-hidden relative shadow-inner">
        <img src={track.cover_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`} alt="Art" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
        <button onClick={() => onPlay(track)} className="absolute bottom-3 right-3 w-10 h-10 bg-[#4ade80] rounded-full flex items-center justify-center text-[#0a1a0f] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
          <Play size={18} fill="currentColor" className="ml-1" />
        </button>
      </div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-sm truncate flex-1">{track.title}</h3>
        <button onClick={() => onLike(track.id)} className={`ml-2 ${isLiked ? 'text-[#4ade80]' : 'text-[#6b8a6e] hover:text-[#4ade80]'} transition-colors`}>
          <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>
      <p className="text-xs text-[#6b8a6e] truncate font-medium">{track.artist}</p>
      <p className="text-xs text-[#4ade80]/60 mt-1">{formatTime(track.duration)}</p>
    </div>
  )
}

function TrackRow({ track, index, onPlay, onLike, isLiked, isActive }: { track: Track, index: number, onPlay: (track: Track) => void, onLike: (trackId: string) => void, isLiked: boolean, isActive: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer ${isActive ? 'bg-[#4ade80]/10 border border-[#4ade80]/20' : 'hover:bg-[#122016]/60'}`}>
      <span className="text-xs text-[#6b8a6e] w-5 text-right">{index + 1}</span>
      <div className="w-10 h-10 bg-[#1a3a20] rounded-lg overflow-hidden flex-shrink-0">
        <img src={track.cover_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#4ade80]' : ''}`}>{track.title}</p>
        <p className="text-xs text-[#6b8a6e] truncate">{track.artist}</p>
      </div>
      <span className="text-xs text-[#6b8a6e] font-mono">{formatTime(track.duration)}</span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onLike(track.id)} className={`${isLiked ? 'text-[#4ade80]' : 'text-[#6b8a6e] hover:text-[#4ade80]'} transition-colors`}>
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => onPlay(track)} className="w-7 h-7 bg-[#4ade80] rounded-full flex items-center justify-center text-[#0a1a0f]">
          <Play size={12} fill="currentColor" className="ml-0.5" />
        </button>
      </div>
    </div>
  )
}

export default function Player() {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [listenStart, setListenStart] = useState<number>(0)

  // Sidebar view: 'home' | 'search' | 'garden' | 'profile'
  const [view, setView] = useState<'home' | 'search' | 'garden' | 'profile'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Auth check
  useEffect(() => {
    const user = localStorage.getItem('gg_user')
    if (!user) { router.push('/auth'); return }
    const parsed = JSON.parse(user)
    setUserId(parsed.id)
    setUserProfile(parsed)
  }, [])

  // Fetch tracks
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch('/api/tracks')
        const data = await res.json()
        const allTracks = data.tracks || []
        setTracks(allTracks)
        setFeaturedTracks(allTracks.filter((t: any) => t.is_featured))
        if (allTracks.length > 0) setCurrentTrack(allTracks[0])
      } catch (err) { console.error('Error fetching tracks:', err) }
    }
    fetchTracks()
  }, [])

  // Fetch liked tracks
  useEffect(() => {
    if (!userId) return
    fetch(`/api/likes?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.likedTrackIds) setLikedTracks(new Set(d.likedTrackIds)) })
      .catch(console.error)
  }, [userId])

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const q = searchQuery.toLowerCase()
    setSearchResults(tracks.filter(t =>
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.album || '').toLowerCase().includes(q)
    ))
  }, [searchQuery, tracks])

  // Audio events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => {
      if (userId && currentTrack) {
        const listenedSeconds = Math.floor(Date.now() / 1000) - listenStart
        fetch('/api/listen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, track_id: currentTrack.id, duration_listened: listenedSeconds, track_duration: currentTrack.duration, source: 'player' }) })
      }
      if (isRepeat) { audio.currentTime = 0; audio.play() }
      else {
        const idx = tracks.findIndex(t => t.id === currentTrack?.id)
        const next = isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length
        setCurrentTrack(tracks[next])
      }
    }
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    return () => { audio.removeEventListener('timeupdate', handleTimeUpdate); audio.removeEventListener('durationchange', handleDurationChange); audio.removeEventListener('ended', handleEnded) }
  }, [currentTrack, tracks, isRepeat, isShuffle, userId, listenStart])

  useEffect(() => {
    if (audioRef.current && currentTrack?.url) {
      audioRef.current.src = currentTrack.url
      setListenStart(Math.floor(Date.now() / 1000))
      if (isPlaying) audioRef.current.play()
    }
  }, [currentTrack])

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false))
    else audioRef.current.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const togglePlay = () => setIsPlaying(p => !p)
  const skipToNext = () => { const idx = tracks.findIndex(t => t.id === currentTrack?.id); setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length]); setIsPlaying(true) }
  const skipToPrevious = () => { const idx = tracks.findIndex(t => t.id === currentTrack?.id); setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx - 1 + tracks.length) % tracks.length]); setIsPlaying(true) }
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => { if (!audioRef.current || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration }
  const handlePlayTrack = (track: Track) => { setCurrentTrack(track); setIsPlaying(true) }
  const toggleLike = async (trackId: string) => {
    if (!userId) return
    if (likedTracks.has(trackId)) {
      await fetch(`/api/likes?user_id=${userId}&track_id=${trackId}`, { method: 'DELETE' })
      setLikedTracks(prev => { const s = new Set(prev); s.delete(trackId); return s })
    } else {
      await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, track_id: trackId }) })
      setLikedTracks(prev => new Set(prev).add(trackId))
    }
  }
  const handleLogout = () => { localStorage.removeItem('gg_token'); localStorage.removeItem('gg_user'); router.push('/auth') }

  const likedTracksList = tracks.filter(t => likedTracks.has(t.id))
  const featuredToShow = featuredTracks.length > 0 ? featuredTracks : tracks.slice(0, 3)

  return (
    <div ref={containerRef} className="relative h-screen w-full bg-[#0a1a0f] text-[#f0f7f0] overflow-hidden flex font-sans">
      <audio ref={audioRef} />
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .nav-wordmark { font-family: 'Cormorant Garamond', serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(74,222,128,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(74,222,128,0.2); }
        @keyframes pulse-glow { 0%,100% { box-shadow: 0 0 20px rgba(74,222,128,0.1); } 50% { box-shadow: 0 0 40px rgba(74,222,128,0.3); } }
        .hero-gradient { background: linear-gradient(135deg, rgba(22,58,32,0.8) 0%, rgba(10,26,15,0.9) 50%, rgba(22,58,32,0.8) 100%); animation: pulse-glow 4s ease-in-out infinite; }
      `}} />

      <MouseGlow containerRef={containerRef} />
      <FloatingElements />

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-[#4ade80]/10 bg-[#0a1a0f]/50 backdrop-blur-md flex flex-col z-10 flex-shrink-0">
        <div className="p-8 pb-4">
          <Link href="/" className="flex items-center gap-3 no-underline group mb-10">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform">
              <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
              <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="nav-wordmark font-semibold text-lg tracking-widest text-[#f0f7f0] uppercase">Groove Garden</span>
          </Link>
          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b8a6e] font-bold mb-3">Main Nursery</p>
            {[
              { key: 'home', icon: <LayoutGrid size={18} />, label: 'Home' },
              { key: 'search', icon: <Search size={18} />, label: 'Search' },
              { key: 'garden', icon: <Library size={18} />, label: 'Your Garden' },
            ].map(item => (
              <button key={item.key} onClick={() => setView(item.key as any)}
                className={`flex items-center gap-4 w-full px-2 py-2 rounded-lg transition-all group border-none cursor-pointer
                  ${view === item.key ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-transparent text-[#a3b8a5] hover:text-[#f0f7f0]'}`}>
                <span className={`${view === item.key ? 'text-[#4ade80]' : 'text-[#6b8a6e] group-hover:text-[#4ade80]'} transition-colors`}>{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}

          </nav>
        </div>

        {/* Profile section at bottom */}
        <div className="mt-auto p-6 border-t border-[#4ade80]/10">
          <button onClick={() => setView('profile')}
            className={`flex items-center gap-3 w-full px-2 py-2 rounded-xl transition-all cursor-pointer border-none mb-4
              ${view === 'profile' ? 'bg-[#4ade80]/10' : 'bg-transparent hover:bg-[#122016]'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#4ade80] flex-shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold truncate">{userProfile?.username || '...'}</p>
              <p className="text-[10px] text-[#6b8a6e] capitalize">{userProfile?.plan_type || 'FREE'}</p>
            </div>
            <ChevronRight size={14} className="text-[#6b8a6e] ml-auto" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto relative z-10">
        <header className="sticky top-0 px-8 py-5 flex justify-between items-center bg-[#0a1a0f]/60 backdrop-blur-xl z-20 border-b border-[#4ade80]/5">
          <div className="flex gap-3">
            <button className="w-8 h-8 rounded-full bg-[#122016] border border-[#4ade80]/10 flex items-center justify-center text-[#a3b8a5] hover:text-[#f0f7f0]">{"<"}</button>
            <button className="w-8 h-8 rounded-full bg-[#122016] border border-[#4ade80]/10 flex items-center justify-center text-[#a3b8a5] hover:text-[#f0f7f0]">{">"}</button>
          </div>
          <div className="flex gap-3">
            {!userProfile?.artist_id && (
              <Link href="/become-artist" className="px-5 py-2 rounded-full border border-[#4ade80]/20 text-[11px] uppercase tracking-widest hover:bg-[#4ade80]/5 transition-colors no-underline">
                Become Artist
              </Link>
            )}
            <button className="px-5 py-2 rounded-full border border-[#4ade80]/20 text-[11px] uppercase tracking-widest hover:bg-[#4ade80]/5 transition-colors">Upgrade Plot</button>
          </div>
        </header>

        <div className="px-10 py-6">

          {/* ── HOME VIEW ── */}
          {view === 'home' && (
            <>
              {/* Editor's Choice Hero */}
              <section className="relative rounded-3xl overflow-hidden p-10 hero-gradient border border-[#4ade80]/10 mb-10">
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#4ade80] font-bold mb-4 block">Editor's Choice</span>
                  <h1 className="text-5xl font-extrabold mb-6 leading-tight">Fresh Blooms <br/>for the Weekend</h1>
                  {featuredToShow.length > 0 && (
                    <div className="flex flex-col gap-2 mb-8 max-w-lg">
                      {featuredToShow.slice(0, 3).map((track, i) => (
                        <button key={track.id} onClick={() => handlePlayTrack(track)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer text-left
                            ${currentTrack?.id === track.id ? 'bg-[#4ade80]/15 border-[#4ade80]/30' : 'bg-black/20 border-white/5 hover:bg-black/30'}`}>
                          <span className="text-xs text-[#6b8a6e] w-4">{i + 1}</span>
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={track.cover_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${currentTrack?.id === track.id ? 'text-[#4ade80]' : ''}`}>{track.title}</p>
                            <p className="text-xs text-[#a3b8a5] truncate">{track.artist}</p>
                          </div>
                          {currentTrack?.id === track.id && isPlaying
                            ? <Pause size={14} className="text-[#4ade80]" />
                            : <Play size={14} className="text-[#a3b8a5]" />}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4">
                    <button onClick={() => { if (featuredToShow.length > 0) { setCurrentTrack(featuredToShow[0]); setIsPlaying(true) } }}
                      className="px-8 py-3 bg-[#4ade80] text-[#0a1a0f] rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">Play Mix</button>
                    <button className="px-8 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">Save to Plot</button>
                  </div>
                </div>
                <div className="absolute right-[-5%] top-[-10%] w-[400px] h-[400px] bg-[#4ade80]/10 blur-[100px] rounded-full animate-pulse" />
                <svg className="absolute top-0 right-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
                  <path d="M10,50 Q30,20 50,50 T90,50" stroke="#4ade80" strokeWidth="2" fill="none" />
                </svg>
              </section>

              {/* All tracks */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-xl font-bold tracking-tight">Recent Growth</h2>
                  <button className="text-xs text-[#6b8a6e] hover:text-[#4ade80] transition-colors uppercase tracking-widest">See all</button>
                </div>
                {tracks.length === 0 ? (
                  <p className="text-[#6b8a6e] text-sm">No hay tracks aún 🌱</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {tracks.map(track => (
                      <TrackCard key={track.id} track={track} onPlay={handlePlayTrack} onLike={toggleLike} isLiked={likedTracks.has(track.id)} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── SEARCH VIEW ── */}
          {view === 'search' && (
            <div>
              <h2 className="text-2xl font-extrabold mb-6">Search</h2>
              <div className="relative mb-8">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b8a6e]" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Tracks, artists, albums..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-2xl pl-10 pr-4 py-4 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b8a6e] hover:text-[#f0f7f0] border-none bg-transparent cursor-pointer">
                    <X size={16} />
                  </button>
                )}
              </div>
              {searchQuery && (
                searchResults.length === 0 ? (
                  <div className="text-center py-16 text-[#6b8a6e]">
                    <Music size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No results for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#6b8a6e] mb-4">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                    <div className="space-y-1">
                      {searchResults.map((track, i) => (
                        <TrackRow key={track.id} track={track} index={i} onPlay={handlePlayTrack} onLike={toggleLike} isLiked={likedTracks.has(track.id)} isActive={currentTrack?.id === track.id} />
                      ))}
                    </div>
                  </div>
                )
              )}
              {!searchQuery && (
                <div className="text-center py-16 text-[#6b8a6e]">
                  <Search size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">Type something to search</p>
                </div>
              )}
            </div>
          )}

          {/* ── GARDEN VIEW (library) ── */}
          {view === 'garden' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold mb-1">Your Garden 🌱</h2>
                <p className="text-sm text-[#a3b8a5]">{likedTracks.size} tracks saved</p>
              </div>
              {likedTracksList.length === 0 ? (
                <div className="text-center py-16 text-[#6b8a6e]">
                  <Heart size={40} className="mx-auto mb-4 opacity-30" />
                  <p className="text-sm">No tracks saved yet. Like some tracks to grow your garden!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {likedTracksList.map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i} onPlay={handlePlayTrack} onLike={toggleLike} isLiked={true} isActive={currentTrack?.id === track.id} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PROFILE VIEW ── */}
          {view === 'profile' && (
            <div className="max-w-md">
              <h2 className="text-2xl font-extrabold mb-8">Your Profile</h2>
              <div className="bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-7 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#4ade80]" />
                  <div>
                    <p className="font-bold text-lg">{userProfile?.username}</p>
                    <p className="text-sm text-[#6b8a6e]">{userProfile?.email}</p>
                    <span className="text-xs px-2 py-0.5 bg-[#4ade80]/10 text-[#4ade80] rounded-full border border-[#4ade80]/20">{userProfile?.plan_type}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-[#122016] rounded-xl p-3">
                    <p className="text-xl font-bold text-[#4ade80]">{likedTracks.size}</p>
                    <p className="text-xs text-[#6b8a6e]">Liked tracks</p>
                  </div>
                  <div className="bg-[#122016] rounded-xl p-3">
                    <p className="text-xl font-bold text-[#4ade80]">{tracks.length}</p>
                    <p className="text-xs text-[#6b8a6e]">Available tracks</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {userProfile?.artist_id && (
                  <Link href="/artist" className="flex items-center justify-between w-full p-4 bg-[#0d2010] border border-[#4ade80]/20 rounded-2xl hover:border-[#4ade80]/40 transition-all no-underline group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#4ade80]/10 rounded-xl flex items-center justify-center">
                        <Music size={18} className="text-[#4ade80]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Artist Studio</p>
                        <p className="text-xs text-[#6b8a6e]">Manage your music</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#6b8a6e] group-hover:text-[#4ade80] transition-colors" />
                  </Link>
                )}
                <button onClick={handleLogout}
                  className="flex items-center justify-between w-full p-4 bg-[#0d2010] border border-red-400/10 rounded-2xl hover:border-red-400/30 transition-all cursor-pointer text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-400/10 rounded-xl flex items-center justify-center">
                      <X size={18} className="text-red-400" />
                    </div>
                    <p className="font-semibold text-sm text-red-400">Log out</p>
                  </div>
                  <ChevronRight size={16} className="text-red-400/50" />
                </button>
              </div>
            </div>
          )}

        </div>
        <div className="h-32 min-h-[128px]" />
      </main>

      <PlaybackBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        likedTracks={likedTracks}
        onTogglePlay={togglePlay}
        onSkipNext={skipToNext}
        onSkipPrevious={skipToPrevious}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleLike={toggleLike}
      />
    </div>
  )
}