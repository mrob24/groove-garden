"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Play, Pause, Heart, Search, LayoutGrid, Library,
  Music, ChevronRight, X, ListPlus, Plus, Trash2, ListMusic,
} from 'lucide-react'
import PlaybackBar, { Track } from '@/components/PlaybackBar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  username: string
  email: string
  plan_type: string
  artist_id?: string
}

interface Playlist {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  tracks: Track[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (t: number) => {
  if (!t || isNaN(t)) return '0:00'
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
}

const coverSrc = (track: Track) =>
  track.cover_url ||
  `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`

const playlistCover = (playlist: Playlist) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${playlist.id}&backgroundColor=162b1e&shape=ellipse,polygon,rectangle,triangle`

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaveBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[8, 12, 6, 10, 8].map((h, i) => (
        <div key={i} className="w-0.5 bg-[#3dba6f] rounded-sm" style={{
          height: playing ? `${h}px` : '3px',
          transition: playing ? 'none' : 'height 0.3s ease',
          animationName: playing ? 'wavePulse' : 'none',
          animationDuration: `${0.4 + i * 0.1}s`,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#0f1f14] border border-[#3dba6f]/8 rounded-2xl p-4 animate-pulse">
      <div className="aspect-square bg-[#142a19] rounded-xl mb-3" />
      <div className="h-3 bg-[#142a19] rounded-lg w-3/4 mb-2" />
      <div className="h-2.5 bg-[#142a19] rounded-lg w-1/2" />
    </div>
  )
}

// ─── Context Menu ─────────────────────────────────────────────────────────────

function ContextMenu({ x, y, track, playlists, onPlay, onAddToQueue, onLike, isLiked, onAddToPlaylist, onClose }: {
  x: number; y: number; track: Track; playlists: Playlist[]
  onPlay: () => void; onAddToQueue: () => void; onLike: () => void
  isLiked: boolean; onAddToPlaylist: (playlistId: string) => void; onClose: () => void
}) {
  const [showPlaylists, setShowPlaylists] = useState(false)

  useEffect(() => {
    const h = () => onClose()
    window.addEventListener('click', h)
    return () => window.removeEventListener('click', h)
  }, [onClose])

  return (
    <div className="fixed z-[100] bg-[#0f1f14] border border-[#3dba6f]/18 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
      style={{ left: x, top: y }} onClick={e => e.stopPropagation()}>
      {[
        { icon: <Play size={12} />, label: 'Play now', action: () => { onPlay(); onClose() } },
        { icon: <ListPlus size={12} />, label: 'Add to queue', action: () => { onAddToQueue(); onClose() } },
      ].map(({ icon, label, action }) => (
        <button key={label} onClick={action}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer">
          <span className="text-[#3dba6f]">{icon}</span> {label}
        </button>
      ))}

      {playlists.length > 0 && (
        <>
          <div className="my-1 mx-2 border-t border-[#3dba6f]/8" />
          <button onClick={() => setShowPlaylists(s => !s)}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer">
            <span className="text-[#3dba6f]"><ListMusic size={12} /></span>
            Add to playlist
            <ChevronRight size={10} className={`ml-auto text-[#4a7a5a] transition-transform ${showPlaylists ? 'rotate-90' : ''}`} />
          </button>
          {showPlaylists && playlists.map(pl => (
            <button key={pl.id} onClick={() => { onAddToPlaylist(pl.id); onClose() }}
              className="flex items-center gap-2 w-full pl-9 pr-3.5 py-1.5 text-xs text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer">
              <img src={playlistCover(pl)} alt="" className="w-4 h-4 rounded-md" />
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
        </>
      )}

      <div className="my-1 mx-2 border-t border-[#3dba6f]/8" />
      <button onClick={() => { onLike(); onClose() }}
        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer">
        <Heart size={12} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-[#3dba6f]' : 'text-[#4a7a5a]'} />
        {isLiked ? 'Unlike' : 'Like'}
      </button>
    </div>
  )
}

// ─── Track Card ───────────────────────────────────────────────────────────────

function TrackCard({ track, onPlay, onLike, onAddToQueue, onAddToPlaylist, isLiked, isActive, playlists }: {
  track: Track; onPlay: (t: Track) => void; onLike: (id: string) => void
  onAddToQueue: (t: Track) => void; onAddToPlaylist: (trackId: string, playlistId: string) => void
  isLiked: boolean; isActive: boolean; playlists: Playlist[]
}) {
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <div
        onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }) }}
        className={`bg-[#0f1f14] border rounded-2xl p-4 cursor-pointer transition-all duration-200 group
          ${isActive
            ? 'border-[#3dba6f]/30 bg-[#142a19]'
            : 'border-[#3dba6f]/8 hover:border-[#3dba6f]/20 hover:bg-[#122318]'}`}
      >
        {/* Cover */}
        <div className="aspect-square bg-[#0a150d] rounded-xl mb-3.5 overflow-hidden relative">
          <img src={coverSrc(track)} alt={track.title}
            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
          {/* Play button — revealed on hover */}
          <button onClick={() => onPlay(track)}
            className="absolute bottom-2.5 right-2.5 w-9 h-9 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg border-none cursor-pointer">
            <Play size={14} fill="currentColor" className="ml-0.5" />
          </button>
          {/* Now playing indicator */}
          {isActive && (
            <div className="absolute top-2.5 left-2.5 bg-[#0b1810]/75 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1.5">
              <WaveBars playing />
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium truncate leading-snug ${isActive ? 'text-[#3dba6f]' : 'text-[#e8f5ec]'}`}>
              {track.title}
            </p>
            <p className="text-xs text-[#8ab89a] truncate mt-0.5">{track.artist}</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onLike(track.id) }}
            className={`flex-shrink-0 mt-0.5 transition-colors border-none bg-transparent cursor-pointer p-0
              ${isLiked ? 'text-[#3dba6f]' : 'text-[#3a6045] hover:text-[#3dba6f]'}`}>
            <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <p className="text-[10px] text-[#4a7a5a] mt-2 font-mono">{fmt(track.duration)}</p>
      </div>

      {ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} track={track} playlists={playlists}
          onPlay={() => onPlay(track)} onAddToQueue={() => onAddToQueue(track)}
          onLike={() => onLike(track.id)} isLiked={isLiked}
          onAddToPlaylist={pid => onAddToPlaylist(track.id, pid)}
          onClose={() => setCtx(null)} />
      )}
    </>
  )
}

// ─── Track Row ────────────────────────────────────────────────────────────────

function TrackRow({ track, index, onPlay, onLike, onAddToQueue, onAddToPlaylist, isLiked, isActive, playlists }: {
  track: Track; index: number; onPlay: (t: Track) => void; onLike: (id: string) => void
  onAddToQueue: (t: Track) => void; onAddToPlaylist: (trackId: string, playlistId: string) => void
  isLiked: boolean; isActive: boolean; playlists: Playlist[]
}) {
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <div
        onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }) }}
        onClick={() => onPlay(track)}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group cursor-pointer
          ${isActive
            ? 'bg-[#3dba6f]/8 border border-[#3dba6f]/18'
            : 'hover:bg-[#142a19] border border-transparent'}`}
      >
        <span className="text-[10px] text-[#3a6045] w-5 text-right font-mono flex-shrink-0 tabular-nums">{index + 1}</span>
        <div className="w-9 h-9 bg-[#142a19] rounded-lg overflow-hidden flex-shrink-0">
          <img src={coverSrc(track)} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? 'text-[#3dba6f]' : 'text-[#e8f5ec]'}`}>{track.title}</p>
          <p className="text-xs text-[#8ab89a] truncate mt-0.5">{track.artist}</p>
        </div>
        {track.album && <p className="text-xs text-[#4a7a5a] hidden md:block truncate max-w-[140px]">{track.album}</p>}
        <span className="text-xs text-[#4a7a5a] font-mono flex-shrink-0">{fmt(track.duration)}</span>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onAddToQueue(track) }}
            className="w-7 h-7 flex items-center justify-center text-[#4a7a5a] hover:text-[#3dba6f] transition-colors border-none bg-transparent cursor-pointer rounded-lg hover:bg-[#3dba6f]/8">
            <ListPlus size={13} />
          </button>
          <button onClick={e => { e.stopPropagation(); onLike(track.id) }}
            className={`w-7 h-7 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer rounded-lg hover:bg-[#3dba6f]/8
              ${isLiked ? 'text-[#3dba6f]' : 'text-[#4a7a5a] hover:text-[#3dba6f]'}`}>
            <Heart size={13} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={e => { e.stopPropagation(); onPlay(track) }}
            className="w-7 h-7 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] border-none cursor-pointer hover:bg-[#4ecf80] transition-colors">
            <Play size={11} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      {ctx && (
        <ContextMenu x={ctx.x} y={ctx.y} track={track} playlists={playlists}
          onPlay={() => onPlay(track)} onAddToQueue={() => onAddToQueue(track)}
          onLike={() => onLike(track.id)} isLiked={isLiked}
          onAddToPlaylist={pid => onAddToPlaylist(track.id, pid)}
          onClose={() => setCtx(null)} />
      )}
    </>
  )
}

// ─── Playlist Card ────────────────────────────────────────────────────────────

function PlaylistCard({ playlist, onClick, onDelete }: {
  playlist: Playlist; onClick: () => void; onDelete: (id: string) => void
}) {
  return (
    <div onClick={onClick}
      className="bg-[#0f1f14] border border-[#3dba6f]/8 rounded-2xl p-4 cursor-pointer transition-all duration-200 group hover:border-[#3dba6f]/20 hover:bg-[#122318]">
      <div className="aspect-square rounded-xl mb-3.5 overflow-hidden relative bg-[#0a150d]">
        <img src={playlistCover(playlist)} alt={playlist.name}
          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
        <button
          onClick={e => { e.stopPropagation(); onDelete(playlist.id) }}
          className="absolute top-2 right-2 w-7 h-7 bg-[#0b1810]/70 rounded-full flex items-center justify-center text-red-400/80 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 border-none cursor-pointer">
          <Trash2 size={12} />
        </button>
      </div>
      <p className="text-sm font-medium truncate text-[#e8f5ec]">{playlist.name}</p>
      <p className="text-xs text-[#8ab89a] mt-0.5">
        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type View = 'home' | 'search' | 'garden' | 'profile'

const NAV_ITEMS: { key: View; icon: React.ReactNode; label: string }[] = [
  { key: 'home',   icon: <LayoutGrid size={15} />, label: 'Home' },
  { key: 'search', icon: <Search size={15} />,     label: 'Discover' },
  { key: 'garden', icon: <Library size={15} />,    label: 'Your Garden' },
]

export default function Player() {
  const router = useRouter()

  const [isPlaying,    setIsPlaying]    = useState(false)
  const [volume,       setVolume]       = useState(80)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [tracks,       setTracks]       = useState<Track[]>([])
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [isShuffle,    setIsShuffle]    = useState(false)
  const [isRepeat,     setIsRepeat]     = useState(false)
  const [likedTracks,  setLikedTracks]  = useState<Set<string>>(new Set())
  const [userId,       setUserId]       = useState<string | null>(null)
  const [userProfile,  setUserProfile]  = useState<UserProfile | null>(null)
  const [listenStart,  setListenStart]  = useState(0)
  const [view,         setView]         = useState<View>('home')
  const [searchQuery,  setSearchQuery]  = useState('')
  const [loading,      setLoading]      = useState(true)
  const [queue,        setQueue]        = useState<Track[]>([])
  const [showQueue,    setShowQueue]    = useState(false)
  const [showLyrics,   setShowLyrics]   = useState(false)

  const [playlists,        setPlaylists]        = useState<Playlist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [openPlaylist,     setOpenPlaylist]      = useState<Playlist | null>(null)
  const [showNewPlaylist,  setShowNewPlaylist]   = useState(false)
  const [newPlaylistName,  setNewPlaylistName]   = useState('')
  const [creatingPlaylist, setCreatingPlaylist]  = useState(false)
  const [gardenTab,        setGardenTab]         = useState<'liked' | 'playlists'>('liked')

  const audioRef = useRef<HTMLAudioElement>(null)

  const featuredTracks    = useMemo(() => { const f = tracks.filter(t => t.is_featured); return (f.length ? f : tracks).slice(0, 3) }, [tracks])
  const likedTracksList   = useMemo(() => tracks.filter(t => likedTracks.has(t.id)), [tracks, likedTracks])
  const searchResults     = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.album || '').toLowerCase().includes(q))
  }, [searchQuery, tracks])

  useEffect(() => {
    const user = localStorage.getItem('gg_user')
    if (!user) { router.push('/auth'); return }
    const parsed = JSON.parse(user)
    setUserId(parsed.id); setUserProfile(parsed)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const res  = await fetch('/api/tracks')
        const data = await res.json()
        const all: Track[] = data.tracks || []
        setTracks(all)
        if (all.length) setCurrentTrack(all[0])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    })()
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/likes?user_id=${userId}`)
      .then(r => r.json())
      .then(d => d.likedTrackIds && setLikedTracks(new Set(d.likedTrackIds)))
      .catch(console.error)
  }, [userId])

  const fetchPlaylists = useCallback(async () => {
    if (!userId) return
    setPlaylistsLoading(true)
    try {
      const res  = await fetch(`/api/playlists?user_id=${userId}`)
      const data = await res.json()
      setPlaylists(data.playlists || [])
      if (openPlaylist) {
        const refreshed = (data.playlists || []).find((p: Playlist) => p.id === openPlaylist.id)
        if (refreshed) setOpenPlaylist(refreshed)
      }
    } catch (err) { console.error(err) }
    finally { setPlaylistsLoading(false) }
  }, [userId, openPlaylist])

  useEffect(() => { if (view === 'garden') fetchPlaylists() }, [view, userId])

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onTime     = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnded    = () => {
      if (userId && currentTrack) {
        fetch('/api/listen', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, track_id: currentTrack.id,
            duration_listened: Math.floor(Date.now() / 1000) - listenStart,
            track_duration: currentTrack.duration, source: 'player' }) })
      }
      if (queue.length > 0) {
        const [next, ...rest] = queue; setQueue(rest); setCurrentTrack(next); setIsPlaying(true)
      } else if (isRepeat) { audio.currentTime = 0; audio.play() }
      else {
        const idx  = tracks.findIndex(t => t.id === currentTrack?.id)
        const next = isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length
        setCurrentTrack(tracks[next])
      }
    }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('durationchange', onDuration); audio.removeEventListener('ended', onEnded) }
  }, [currentTrack, tracks, queue, isRepeat, isShuffle, userId, listenStart])

  useEffect(() => {
    const onVis = () => { if (!audioRef.current) return; if (document.hidden) audioRef.current.pause(); else if (isPlaying) audioRef.current.play().catch(() => {}) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack?.url) return
    audio.src = currentTrack.url
    setListenStart(Math.floor(Date.now() / 1000))
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    if (isPlaying) audio.play().catch(() => setIsPlaying(false)); else audio.pause()
  }, [isPlaying])

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100 }, [volume])

  const handlePlayTrack  = useCallback((track: Track) => { setCurrentTrack(track); setIsPlaying(true) }, [])
  const addToQueue       = useCallback((track: Track) => { setQueue(q => [...q, track]); setShowQueue(true) }, [])
  const removeFromQueue  = useCallback((i: number) => setQueue(q => q.filter((_, j) => j !== i)), [])
  const playFromQueue    = useCallback((i: number) => { setCurrentTrack(queue[i]); setQueue(q => q.slice(i + 1)); setIsPlaying(true) }, [queue])

  const skipToNext = useCallback(() => {
    if (queue.length > 0) { const [next, ...rest] = queue; setQueue(rest); setCurrentTrack(next); setIsPlaying(true); return }
    if (!tracks.length) return
    const idx = tracks.findIndex(t => t.id === currentTrack?.id)
    setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length])
    setIsPlaying(true)
  }, [queue, tracks, currentTrack, isShuffle])

  const skipToPrevious = useCallback(() => {
    if (!tracks.length) return
    const idx = tracks.findIndex(t => t.id === currentTrack?.id)
    setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx - 1 + tracks.length) % tracks.length])
    setIsPlaying(true)
  }, [tracks, currentTrack, isShuffle])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }, [duration])

  const toggleLike = useCallback(async (trackId: string) => {
    if (!userId) return
    if (likedTracks.has(trackId)) {
      await fetch(`/api/likes?user_id=${userId}&track_id=${trackId}`, { method: 'DELETE' })
      setLikedTracks(prev => { const s = new Set(prev); s.delete(trackId); return s })
    } else {
      await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId, track_id: trackId }) })
      setLikedTracks(prev => new Set(prev).add(trackId))
    }
  }, [userId, likedTracks])

  const handleLogout  = useCallback(() => { localStorage.removeItem('gg_token'); localStorage.removeItem('gg_user'); router.push('/auth') }, [router])
  const toggleQueue   = useCallback(() => { setShowQueue(q => !q); setShowLyrics(false) }, [])
  const toggleLyrics  = useCallback(() => { setShowLyrics(l => !l); setShowQueue(false) }, [])

  const createPlaylist = async () => {
    if (!newPlaylistName.trim() || !userId) return
    setCreatingPlaylist(true)
    await fetch('/api/playlists', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', user_id: userId, name: newPlaylistName.trim() }) })
    setNewPlaylistName(''); setShowNewPlaylist(false); setCreatingPlaylist(false)
    fetchPlaylists()
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!userId) return
    await fetch(`/api/playlists?playlist_id=${playlistId}&user_id=${userId}`, { method: 'DELETE' })
    if (openPlaylist?.id === playlistId) setOpenPlaylist(null)
    fetchPlaylists()
  }

  const addToPlaylist = useCallback(async (trackId: string, playlistId: string) => {
    await fetch('/api/playlists', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_track', playlist_id: playlistId, track_id: trackId }) })
    fetchPlaylists()
  }, [fetchPlaylists])

  const removeFromPlaylist = async (trackId: string, playlistId: string) => {
    await fetch(`/api/playlists?playlist_id=${playlistId}&track_id=${trackId}`, { method: 'DELETE' })
    fetchPlaylists()
  }

  const playPlaylist = (playlist: Playlist) => {
    if (!playlist.tracks.length) return
    handlePlayTrack(playlist.tracks[0])
    setQueue(playlist.tracks.slice(1))
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-full bg-[#0b1810] text-[#e8f5ec] overflow-hidden flex flex-col"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <audio ref={audioRef} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        .gg-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        @keyframes wavePulse { from { height: 3px } to { height: 12px } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1c3526; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #254d35; }
      `}</style>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-56 bg-[#071008] border-r border-[#3dba6f]/8 flex flex-col flex-shrink-0">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-[#3dba6f]/8">
            <Link href="/" className="flex items-center gap-2.5 no-underline group">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f"/>
                <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="gg-serif text-base tracking-wide text-[#e8f5ec]/85">Groove Garden</span>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#3a6045] px-2 mb-2.5">Menu</p>
            {NAV_ITEMS.map(({ key, icon, label }) => (
              <button key={key} onClick={() => setView(key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border-none cursor-pointer
                  ${view === key
                    ? 'bg-[#3dba6f]/12 text-[#e8f5ec] border border-[#3dba6f]/18'
                    : 'bg-transparent text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#3dba6f]/6 border border-transparent'}`}>
                <span className={`flex-shrink-0 ${view === key ? 'text-[#3dba6f]' : 'text-[#4a7a5a]'}`}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="border-t border-[#3dba6f]/8 p-3">
            <button onClick={() => setView('profile')}
              className={`flex items-center gap-2.5 w-full px-2.5 py-2.5 rounded-xl transition-all text-left border-none cursor-pointer
                ${view === 'profile' ? 'bg-[#3dba6f]/10 border border-[#3dba6f]/15' : 'bg-transparent hover:bg-[#3dba6f]/6 border border-transparent'}`}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex-shrink-0 flex items-center justify-center">
                <span className="text-[#071008] text-xs font-bold">{userProfile?.username?.[0]?.toUpperCase() || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-[#e8f5ec]">{userProfile?.username || '…'}</p>
                <p className="text-[10px] text-[#4a7a5a] capitalize">{userProfile?.plan_type || 'Free'}</p>
              </div>
              <ChevronRight size={12} className="text-[#3a6045] flex-shrink-0" />
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Topbar */}
          <header className="sticky top-0 z-20 bg-[#0b1810]/90 backdrop-blur-xl border-b border-[#3dba6f]/8 px-8 py-3.5 flex items-center justify-between">
            <div className="relative w-72">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a7a5a]" />
              <input type="text" placeholder="Tracks, artists, albums…"
                value={view === 'search' ? searchQuery : ''}
                onFocus={() => setView('search')}
                onChange={e => { setView('search'); setSearchQuery(e.target.value) }}
                className="w-full bg-[#0f1f14] border border-[#3dba6f]/10 rounded-full pl-9 pr-4 py-2 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/28 transition-colors" />
            </div>
            <div className="flex items-center gap-2">
              {!userProfile?.artist_id && (
                <Link href="/become-artist"
                  className="px-4 py-1.5 rounded-full border border-[#3dba6f]/18 text-xs text-[#8ab89a] hover:text-[#e8f5ec] hover:border-[#3dba6f]/35 transition-all no-underline">
                  Become an artist
                </Link>
              )}
              <button className="px-4 py-1.5 rounded-full bg-[#3dba6f] text-[#071008] text-xs font-semibold hover:bg-[#4ecf80] transition-colors">
                Upgrade
              </button>
            </div>
          </header>

          <div className="px-8 py-6">

            {/* ══ HOME ══ */}
            {view === 'home' && (
              <>
                {/* Hero */}
                <section className="relative rounded-2xl overflow-hidden border border-[#3dba6f]/10 mb-8 bg-[#0f1f14]">
                  {/* Subtle grid texture */}
                  <div className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage: 'linear-gradient(rgba(61,186,111,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,186,111,0.06) 1px, transparent 1px)',
                      backgroundSize: '40px 40px'
                    }} />
                  {/* Radial glow from bottom-right */}
                  <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#3dba6f]/6 blur-3xl pointer-events-none" />

                  <div className="relative p-8 flex gap-8 items-start">
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#3dba6f] block mb-4">Editor's Pick</span>
                      <h1 className="gg-serif text-4xl font-medium leading-tight mb-6 text-[#e8f5ec]">
                        Fresh Blooms<br />for the <em>Weekend</em>
                      </h1>

                      {/* Featured track list */}
                      <div className="space-y-1.5 mb-7 max-w-sm">
                        {featuredTracks.map((track, i) => (
                          <button key={track.id} onClick={() => handlePlayTrack(track)}
                            className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl border transition-all text-left cursor-pointer
                              ${currentTrack?.id === track.id
                                ? 'bg-[#3dba6f]/10 border-[#3dba6f]/25'
                                : 'bg-[#0b1810]/60 border-[#3dba6f]/8 hover:bg-[#0b1810]/80 hover:border-[#3dba6f]/15'}`}>
                            <span className="text-[10px] text-[#3a6045] w-3 font-mono flex-shrink-0">{i + 1}</span>
                            <img src={coverSrc(track)} alt="" className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-[#3dba6f]' : 'text-[#e8f5ec]'}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-[#8ab89a] truncate">{track.artist}</p>
                            </div>
                            {currentTrack?.id === track.id && isPlaying
                              ? <Pause size={12} className="text-[#3dba6f] flex-shrink-0" />
                              : <Play size={12} className="text-[#4a7a5a] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => { const f = featuredTracks[0]; if (f) handlePlayTrack(f) }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold hover:bg-[#4ecf80] transition-colors border-none cursor-pointer">
                          <Play size={12} fill="currentColor" /> Play mix
                        </button>
                        <button className="px-5 py-2.5 bg-transparent border border-[#3dba6f]/20 rounded-full text-xs text-[#8ab89a] hover:border-[#3dba6f]/35 hover:text-[#e8f5ec] transition-all cursor-pointer">
                          Save to Garden
                        </button>
                      </div>
                    </div>

                    {/* Staggered cover art */}
                    <div className="hidden lg:flex flex-col gap-2 items-end justify-center self-stretch">
                      {featuredTracks.map((track, i) => (
                        <img key={track.id} src={coverSrc(track)} alt=""
                          className="rounded-xl object-cover border border-[#3dba6f]/10 flex-shrink-0"
                          style={{ width: `${96 - i * 14}px`, height: `${96 - i * 14}px`, marginRight: `${i * 10}px`, opacity: 1 - i * 0.15 }} />
                      ))}
                    </div>
                  </div>
                </section>

                {/* Track grid */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">Recent Growth</h2>
                    <button className="text-xs text-[#4a7a5a] hover:text-[#3dba6f] transition-colors bg-transparent border-none cursor-pointer">
                      See all →
                    </button>
                  </div>
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-16">
                      <Music size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                      <p className="text-sm text-[#4a7a5a]">No tracks yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tracks.map(track => (
                        <TrackCard key={track.id} track={track} onPlay={handlePlayTrack} onLike={toggleLike}
                          onAddToQueue={addToQueue} onAddToPlaylist={addToPlaylist}
                          isLiked={likedTracks.has(track.id)} isActive={currentTrack?.id === track.id} playlists={playlists} />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ══ SEARCH ══ */}
            {view === 'search' && (
              <div>
                <h2 className="gg-serif text-2xl font-medium mb-6 text-[#e8f5ec]">Discover</h2>
                <div className="relative mb-6">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a7a5a]" />
                  <input autoFocus type="text" placeholder="Tracks, artists, albums…" value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/28 transition-colors" />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a7a5a] hover:text-[#e8f5ec] bg-transparent border-none cursor-pointer transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {searchQuery ? (
                  searchResults.length === 0 ? (
                    <div className="text-center py-20">
                      <Music size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                      <p className="text-sm text-[#4a7a5a]">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a7a5a] mb-3">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.map((track, i) => (
                          <TrackRow key={track.id} track={track} index={i} onPlay={handlePlayTrack} onLike={toggleLike}
                            onAddToQueue={addToQueue} onAddToPlaylist={addToPlaylist}
                            isLiked={likedTracks.has(track.id)} isActive={currentTrack?.id === track.id} playlists={playlists} />
                        ))}
                      </div>
                    </>
                  )
                ) : (
                  <div className="text-center py-20">
                    <Search size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                    <p className="text-sm text-[#4a7a5a]">Type to search your library</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ GARDEN ══ */}
            {view === 'garden' && (
              <div>
                <div className="flex items-end justify-between mb-6">
                  <div>
                    {openPlaylist ? (
                      <button onClick={() => setOpenPlaylist(null)}
                        className="flex items-center gap-1.5 text-xs text-[#4a7a5a] hover:text-[#8ab89a] transition-colors bg-transparent border-none cursor-pointer mb-2 p-0 uppercase tracking-widest">
                        <ChevronRight size={11} className="rotate-180" /> Back
                      </button>
                    ) : null}
                    <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">
                      {openPlaylist ? openPlaylist.name : 'Your Garden'}
                    </h2>
                    <p className="text-xs text-[#4a7a5a] mt-1">
                      {openPlaylist
                        ? `${openPlaylist.tracks.length} tracks`
                        : `${likedTracks.size} liked · ${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {!openPlaylist && (
                    <button onClick={() => setShowNewPlaylist(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3dba6f]/10 border border-[#3dba6f]/18 rounded-xl text-xs font-medium text-[#3dba6f] hover:bg-[#3dba6f]/18 transition-colors cursor-pointer border-solid">
                      <Plus size={13} /> New Playlist
                    </button>
                  )}
                </div>

                {/* New playlist input */}
                {showNewPlaylist && !openPlaylist && (
                  <div className="flex items-center gap-3 mb-5 p-4 bg-[#0f1f14] border border-[#3dba6f]/12 rounded-2xl">
                    <input autoFocus type="text" placeholder="Playlist name…" value={newPlaylistName}
                      onChange={e => setNewPlaylistName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                      className="flex-1 bg-[#0a150d] border border-[#3dba6f]/15 rounded-xl px-4 py-2.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/30 transition-colors" />
                    <button onClick={createPlaylist} disabled={!newPlaylistName.trim() || creatingPlaylist}
                      className="px-4 py-2.5 bg-[#3dba6f] text-[#071008] rounded-xl text-xs font-semibold hover:bg-[#4ecf80] transition-colors disabled:opacity-50 cursor-pointer border-none">
                      {creatingPlaylist ? '…' : 'Create'}
                    </button>
                    <button onClick={() => { setShowNewPlaylist(false); setNewPlaylistName('') }}
                      className="text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors bg-transparent border-none cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Open playlist */}
                {openPlaylist ? (
                  <div>
                    {openPlaylist.tracks.length > 0 && (
                      <div className="flex gap-3 mb-5">
                        <button onClick={() => playPlaylist(openPlaylist)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold hover:bg-[#4ecf80] transition-colors cursor-pointer border-none">
                          <Play size={12} fill="currentColor" /> Play all
                        </button>
                      </div>
                    )}
                    {openPlaylist.tracks.length === 0 ? (
                      <div className="text-center py-20">
                        <Music size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                        <p className="text-sm text-[#4a7a5a]">No tracks yet — right-click any track to add it here</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {openPlaylist.tracks.map((track, i) => (
                          <div key={track.id}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group cursor-pointer
                              ${currentTrack?.id === track.id ? 'bg-[#3dba6f]/8 border border-[#3dba6f]/18' : 'hover:bg-[#142a19] border border-transparent'}`}>
                            <span className="text-[10px] text-[#3a6045] w-5 text-right font-mono flex-shrink-0 tabular-nums">{i + 1}</span>
                            <div className="w-9 h-9 bg-[#142a19] rounded-lg overflow-hidden flex-shrink-0">
                              <img src={coverSrc(track)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0" onClick={() => handlePlayTrack(track)}>
                              <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-[#3dba6f]' : 'text-[#e8f5ec]'}`}>{track.title}</p>
                              <p className="text-xs text-[#8ab89a] truncate">{track.artist}</p>
                            </div>
                            <span className="text-xs text-[#4a7a5a] font-mono">{fmt(track.duration)}</span>
                            <button onClick={() => removeFromPlaylist(track.id, openPlaylist.id)}
                              className="text-[#3a6045] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer">
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Tabs */}
                    <div className="flex gap-0.5 bg-[#0f1f14] border border-[#3dba6f]/8 rounded-xl p-1 w-fit mb-5">
                      {(['liked', 'playlists'] as const).map(tab => (
                        <button key={tab} onClick={() => setGardenTab(tab)}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all border-none cursor-pointer
                            ${gardenTab === tab ? 'bg-[#142a19] text-[#3dba6f]' : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                          {tab === 'liked' ? `Liked (${likedTracks.size})` : `Playlists (${playlists.length})`}
                        </button>
                      ))}
                    </div>

                    {gardenTab === 'liked' && (
                      likedTracksList.length === 0 ? (
                        <div className="text-center py-20">
                          <Heart size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                          <p className="text-sm text-[#4a7a5a]">Like some tracks to grow your garden</p>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {likedTracksList.map((track, i) => (
                            <TrackRow key={track.id} track={track} index={i} onPlay={handlePlayTrack} onLike={toggleLike}
                              onAddToQueue={addToQueue} onAddToPlaylist={addToPlaylist}
                              isLiked isActive={currentTrack?.id === track.id} playlists={playlists} />
                          ))}
                        </div>
                      )
                    )}

                    {gardenTab === 'playlists' && (
                      playlistsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                      ) : playlists.length === 0 ? (
                        <div className="text-center py-20">
                          <ListMusic size={32} className="mx-auto mb-3 text-[#3a6045] opacity-40" />
                          <p className="text-sm text-[#4a7a5a] mb-3">No playlists yet</p>
                          <button onClick={() => setShowNewPlaylist(true)}
                            className="text-xs text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer">
                            Create your first playlist →
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {playlists.map(pl => (
                            <PlaylistCard key={pl.id} playlist={pl}
                              onClick={() => setOpenPlaylist(pl)} onDelete={deletePlaylist} />
                          ))}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══ PROFILE ══ */}
            {view === 'profile' && (
              <div className="max-w-sm">
                <h2 className="gg-serif text-2xl font-medium mb-6 text-[#e8f5ec]">Your Profile</h2>
                <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#3dba6f]/8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex-shrink-0 flex items-center justify-center">
                      <span className="text-[#071008] text-xl font-bold">{userProfile?.username?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#e8f5ec]">{userProfile?.username}</p>
                      <p className="text-xs text-[#8ab89a] mt-0.5">{userProfile?.email}</p>
                      <span className="text-[10px] px-2.5 py-0.5 bg-[#3dba6f]/10 text-[#3dba6f] rounded-full border border-[#3dba6f]/18 mt-1.5 inline-block font-medium">
                        {userProfile?.plan_type}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Liked tracks', value: likedTracks.size },
                      { label: 'Playlists',    value: playlists.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#0a150d] border border-[#3dba6f]/8 rounded-xl p-4 text-center">
                        <p className="gg-serif text-2xl font-medium text-[#3dba6f]">{value}</p>
                        <p className="text-xs text-[#8ab89a] mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {userProfile?.artist_id && (
                    <Link href="/artist"
                      className="flex items-center justify-between w-full p-4 bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl hover:border-[#3dba6f]/22 transition-all no-underline group">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#3dba6f]/10 border border-[#3dba6f]/15 rounded-xl flex items-center justify-center">
                          <Music size={15} className="text-[#3dba6f]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e8f5ec]">Artist Studio</p>
                          <p className="text-xs text-[#4a7a5a]">Manage your music</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#3a6045] group-hover:text-[#3dba6f] transition-colors" />
                    </Link>
                  )}
                  <button onClick={handleLogout}
                    className="flex items-center justify-between w-full p-4 bg-[#0f1f14] border border-red-400/10 rounded-2xl hover:border-red-400/20 transition-all cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-red-400/8 border border-red-400/12 rounded-xl flex items-center justify-center">
                        <X size={14} className="text-red-400/80" />
                      </div>
                      <p className="text-sm font-medium text-red-400/80">Log out</p>
                    </div>
                    <ChevronRight size={14} className="text-red-400/30" />
                  </button>
                </div>
              </div>
            )}

          </div>
          <div className="h-6" />
        </main>
      </div>

      <PlaybackBar
        currentTrack={currentTrack} isPlaying={isPlaying} isShuffle={isShuffle} isRepeat={isRepeat}
        volume={volume} currentTime={currentTime} duration={duration} likedTracks={likedTracks}
        queue={queue} showQueue={showQueue} showLyrics={showLyrics}
        onTogglePlay={() => setIsPlaying(p => !p)} onSkipNext={skipToNext} onSkipPrevious={skipToPrevious}
        onToggleShuffle={() => setIsShuffle(s => !s)} onToggleRepeat={() => setIsRepeat(r => !r)}
        onSeek={handleSeek} onVolumeChange={setVolume} onToggleLike={toggleLike}
        onToggleQueue={toggleQueue} onToggleLyrics={toggleLyrics}
        onRemoveFromQueue={removeFromQueue} onPlayFromQueue={playFromQueue}
      />
    </div>
  )
}