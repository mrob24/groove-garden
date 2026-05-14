"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Play, Pause, Heart, Search, LayoutGrid, Library,
  Music, ChevronRight, X, ListPlus, Plus, Trash2, ListMusic,
  Volume2, VolumeX, Shuffle, Repeat, Repeat1, SkipBack, SkipForward,
  ChevronDown, ChevronUp, Clock, User, Calendar, TrendingUp,
  Headphones, Award, Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Types (sin cambios) ─────────────────────────────────────────────

interface UserProfile {
  id: string
  username: string
  email: string
  plan_type: string
  artist_id?: string
  created_at?: string
}

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string
  cover_url?: string
  is_featured?: boolean
  play_count?: number
}

interface Playlist {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  tracks: Track[]
}

interface Stats {
  totalPlayTime: number
  topGenre: string
  listeningStreak: number
  totalArtists: number
}

// ─── Helpers ──────────────────────────────────────────────────────────

const fmt = (t: number) => {
  if (!t || isNaN(t)) return "0:00"
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`
}

const coverSrc = (track: Track) =>
  track.cover_url ||
  `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`

const playlistCover = (playlist: Playlist) =>
  `https://api.dicebear.com/7.x/shapes/svg?seed=${playlist.id}&backgroundColor=162b1e&shape=ellipse,polygon,rectangle,triangle`

const formatDate = (dateString?: string) => {
  if (!dateString) return "Member"
  const date = new Date(dateString)
  return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
}

const fetchLyrics = async (track: Track): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return `${track.title} by ${track.artist}

[Verse 1]
Walking through the garden late at night
Feeling every beat under moonlight
The rhythm flows like water through the trees
A melody that brings me to my knees

[Chorus]
Oh, groove garden, take me higher
Set my soul on gentle fire
Every note a blooming flower
Music is my superpower

[Verse 2]
Shadows dance and sync with every sound
Lost and found on hallowed ground
The bassline whispers secrets in the dark
Igniting every single spark

[Chorus]
Oh, groove garden, take me higher
Set my soul on gentle fire
Every note a blooming flower
Music is my superpower

[Bridge]
And when the world gets cold and gray
I press play and drift away
The garden grows inside my heart
A work of living, breathing art

[Outro]
Groove garden... forever green
The sweetest place I've ever been.`
}

// ─── Componente optimizado: WaveBars ───────────────────────────────────

function WaveBars({ playing }: { playing: boolean }) {
  if (!playing) return null
  
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[6, 10, 8, 12, 6].map((h, i) => (
        <div
          key={i}
          className="w-[2px] bg-[#3dba6f] rounded-sm"
          style={{
            height: `${h}px`,
            animation: `wavePulse 0.8s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Componente optimizado: Skeleton ───────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#0f1f14] rounded-xl animate-pulse">
      <div className="aspect-square bg-[#142a19] rounded-xl mb-2" />
      <div className="h-3 bg-[#142a19] rounded w-3/4 mb-1" />
      <div className="h-2 bg-[#142a19] rounded w-1/2" />
    </div>
  )
}

// ─── Componente optimizado: ContextMenu ───────────────────────────────────

function ContextMenu({
  x, y, track, playlists, onPlay, onAddToQueue, onLike, isLiked, onAddToPlaylist, onClose
}: any) {
  const [showPlaylists, setShowPlaylists] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 320)

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[#0f1f14] border border-[#3dba6f]/20 rounded-xl shadow-xl py-1 min-w-[180px] backdrop-blur-sm"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <button
        onClick={() => { onPlay(); onClose() }}
        className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors"
      >
        <Play size={12} className="text-[#3dba6f]" /> Play now
      </button>
      
      <button
        onClick={() => { onAddToQueue(); onClose() }}
        className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors"
      >
        <ListPlus size={12} className="text-[#3dba6f]" /> Add to queue
      </button>

      {playlists.length > 0 && (
        <>
          <div className="my-1 border-t border-[#3dba6f]/10" />
          <button
            onClick={() => setShowPlaylists(!showPlaylists)}
            className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors"
          >
            <ListMusic size={12} className="text-[#3dba6f]" /> Add to playlist
            <ChevronRight size={10} className={`ml-auto transition-transform ${showPlaylists ? 'rotate-90' : ''}`} />
          </button>
          
          {showPlaylists && playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => { onAddToPlaylist(pl.id); onClose() }}
              className="flex items-center gap-2 w-full pl-9 pr-3 py-1.5 text-xs text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#162b1e] transition-colors"
            >
              <img src={playlistCover(pl)} alt="" className="w-4 h-4 rounded" />
              {pl.name}
            </button>
          ))}
        </>
      )}

      <div className="my-1 border-t border-[#3dba6f]/10" />
      <button
        onClick={() => { onLike(); onClose() }}
        className="flex items-center gap-3 w-full px-3 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors"
      >
        <Heart size={12} className={isLiked ? "text-[#3dba6f] fill-[#3dba6f]" : "text-[#4a7a5a]"} />
        {isLiked ? "Unlike" : "Like"}
      </button>
    </div>
  )
}

// ─── Componente optimizado: TrackCard ───────────────────────────────────

function TrackCard({ track, onPlay, onLike, onAddToQueue, onAddToPlaylist, isLiked, isActive, playlists }: any) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onClick={() => onPlay(track)}
        className={`group relative bg-[#0f1f14] rounded-xl p-3 cursor-pointer transition-all duration-200
          ${isActive ? 'ring-1 ring-[#3dba6f]/30 bg-[#142a19]' : 'hover:bg-[#122318] hover:scale-[1.02]'}`}
      >
        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
          <img
            src={coverSrc(track)}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(track) }}
            className="absolute bottom-2 right-2 w-7 h-7 bg-[#3dba6f] rounded-full flex items-center justify-center opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg"
          >
            <Play size={10} fill="currentColor" className="ml-0.5 text-[#071008]" />
          </button>
          {isActive && (
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
              <WaveBars playing />
            </div>
          )}
        </div>
        
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium truncate ${isActive ? 'text-[#3dba6f]' : 'text-[#e8f5ec]'}`}>
              {track.title}
            </p>
            <p className="text-[10px] text-[#8ab89a] truncate mt-0.5">{track.artist}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onLike(track.id) }}
            className="flex-shrink-0 transition-transform hover:scale-110"
          >
            <Heart size={10} className={isLiked ? "text-[#3dba6f] fill-[#3dba6f]" : "text-[#4a7a5a]"}/>
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          track={track}
          playlists={playlists}
          onPlay={() => onPlay(track)}
          onAddToQueue={() => onAddToQueue(track)}
          onLike={() => onLike(track.id)}
          isLiked={isLiked}
          onAddToPlaylist={(pid: string) => onAddToPlaylist(track.id, pid)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

// ─── Componente optimizado: PlaylistCard ───────────────────────────────────

function PlaylistCard({ playlist, onClick, onDelete }: { 
  playlist: Playlist
  onClick: () => void
  onDelete: (id: string) => void 
}) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0f1f14] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:bg-[#122318]"
    >
      <div className="relative aspect-square">
        <img
          src={playlistCover(playlist)}
          alt={playlist.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(playlist.id) }}
          className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
        >
          <Trash2 size={10} className="text-white" />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate text-[#e8f5ec]">{playlist.name}</p>
        <p className="text-xs text-[#8ab89a] mt-0.5">{playlist.tracks.length} tracks</p>
      </div>
    </div>
  )
}

// ─── PlaybackBar optimizado y más limpio ───────────────────────────────────

function PlaybackBar({
  currentTrack, isPlaying, isShuffle, isRepeat, volume, currentTime, duration,
  likedTracks, queue, showQueue, showLyrics, lyrics,
  onTogglePlay, onSkipNext, onSkipPrevious, onToggleShuffle, onToggleRepeat,
  onSeek, onVolumeChange, onToggleLike, onToggleQueue, onToggleLyrics,
  onRemoveFromQueue, onPlayFromQueue
}: any) {
  const [isExpanded, setIsExpanded] = useState(true)
  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b1810]/95 backdrop-blur-xl border-t border-[#3dba6f]/15">
      {/* Progress Bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-[#3dba6f]/20 cursor-pointer group"
        onClick={onSeek}
      >
        <div className="relative h-full bg-[#3dba6f]" style={{ width: `${progress}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Main Controls */}
            <div className="flex items-center justify-between px-4 py-2 h-16">
              {/* Track Info */}
              <div className="flex items-center gap-3 w-1/3 min-w-[180px]">
                {currentTrack && (
                  <img
                    src={coverSrc(currentTrack)}
                    alt=""
                    className="w-10 h-10 rounded-md shadow-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-[#e8f5ec]">
                    {currentTrack?.title || "Select a track"}
                  </p>
                  <p className="text-xs text-[#8ab89a] truncate">
                    {currentTrack?.artist || "—"}
                  </p>
                </div>
                <button
                  onClick={() => onToggleLike(currentTrack?.id)}
                  className="flex-shrink-0"
                >
                  <Heart
                    size={14}
                    className={likedTracks.has(currentTrack?.id) ? "text-[#3dba6f] fill-[#3dba6f]" : "text-[#4a7a5a]"}
                  />
                </button>
              </div>

              {/* Playback Controls */}
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-4">
                  <button onClick={onToggleShuffle} className={`transition-colors ${isShuffle ? 'text-[#3dba6f]' : 'text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                    <Shuffle size={14} />
                  </button>
                  <button onClick={onSkipPrevious} className="text-[#e8f5ec] hover:text-white transition-colors">
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={onTogglePlay}
                    className="w-8 h-8 rounded-full bg-[#3dba6f] flex items-center justify-center hover:bg-[#4ecf80] transition-transform active:scale-95 shadow-lg"
                  >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button onClick={onSkipNext} className="text-[#e8f5ec] hover:text-white transition-colors">
                    <SkipForward size={18} />
                  </button>
                  <button onClick={onToggleRepeat} className={`transition-colors ${isRepeat ? 'text-[#3dba6f]' : 'text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                    {isRepeat ? <Repeat1 size={14} /> : <Repeat size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4a7a5a]">
                  <span>{fmt(currentTime)}</span>
                  <div className="w-48 h-1 bg-[#3dba6f]/20 rounded-full cursor-pointer" onClick={onSeek}>
                    <div className="h-full bg-[#3dba6f] rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center justify-end gap-3 w-1/3 min-w-[160px]">
                <div className="relative group">
                  <button className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors">
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <div className="absolute bottom-10 right-0 hidden group-hover:block bg-[#0f1f14] border border-[#3dba6f]/20 rounded-lg p-2 shadow-xl w-24">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                      className="w-full accent-[#3dba6f]"
                    />
                  </div>
                </div>
                <button
                  onClick={onToggleQueue}
                  className={`transition-colors ${showQueue ? 'text-[#3dba6f]' : 'text-[#4a7a5a] hover:text-[#8ab89a]'}`}
                >
                  <ListMusic size={14} />
                </button>
                <button
                  onClick={onToggleLyrics}
                  className={`transition-colors ${showLyrics ? 'text-[#3dba6f]' : 'text-[#4a7a5a] hover:text-[#8ab89a]'}`}
                >
                  <Music size={14} />
                </button>
                <button onClick={() => setIsExpanded(false)} className="text-[#4a7a5a] hover:text-[#8ab89a]">
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            {/* Queue Panel */}
            <AnimatePresence>
              {showQueue && queue.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#3dba6f]/10 bg-[#0b1810]/50"
                >
                  <div className="p-3 max-h-64 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-[#e8f5ec] mb-2">Queue ({queue.length})</h3>
                    <div className="space-y-1">
                      {queue.map((track: Track, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142a19] group">
                          <img src={coverSrc(track)} alt="" className="w-8 h-8 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{track.title}</p>
                            <p className="text-[10px] text-[#8ab89a] truncate">{track.artist}</p>
                          </div>
                          <button onClick={() => onPlayFromQueue(idx)} className="text-[#4a7a5a] hover:text-[#3dba6f]">
                            <Play size={10} />
                          </button>
                          <button onClick={() => onRemoveFromQueue(idx)} className="text-[#4a7a5a] hover:text-red-400">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lyrics Panel */}
            <AnimatePresence>
              {showLyrics && lyrics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#3dba6f]/10 bg-[#0b1810]/50"
                >
                  <div className="p-4 max-h-80 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-[#e8f5ec] mb-2">Lyrics</h3>
                    <pre className="text-xs text-[#c0e0ca] whitespace-pre-wrap font-sans leading-relaxed">
                      {lyrics}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="compact"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="h-10 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <button onClick={onTogglePlay} className="w-6 h-6 rounded-full bg-[#3dba6f] flex items-center justify-center">
                {isPlaying ? <Pause size={10} /> : <Play size={10} className="ml-0.5" />}
              </button>
              <div className="text-xs">
                <span className="text-[#e8f5ec]">{currentTrack?.title || "No track"}</span>
                <span className="text-[#8ab89a] ml-1">{currentTrack?.artist ? `— ${currentTrack.artist}` : ""}</span>
              </div>
            </div>
            <button onClick={() => setIsExpanded(true)} className="text-[#4a7a5a] hover:text-[#8ab89a]">
              <ChevronUp size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────

type View = "home" | "search" | "garden" | "profile"

export default function Player() {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(80)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isShuffle, setIsShuffle] = useState(false)
  const [isRepeat, setIsRepeat] = useState(false)
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [listenStart, setListenStart] = useState(0)
  const [view, setView] = useState<View>("home")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [queue, setQueue] = useState<Track[]>([])
  const [showQueue, setShowQueue] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [lyrics, setLyrics] = useState<string>("")
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null)
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [gardenTab, setGardenTab] = useState<"liked" | "playlists">("liked")
  const [stats, setStats] = useState<Stats>({
    totalPlayTime: 0,
    topGenre: 'None',
    listeningStreak: 0,
    totalArtists: 0
  })

  const audioRef = useRef<HTMLAudioElement>(null)

  // Derived data
  const featuredTracks = useMemo(() => {
    const f = tracks.filter((t) => t.is_featured)
    return (f.length ? f : tracks).slice(0, 4)
  }, [tracks])
  
  const likedTracksList = useMemo(() => tracks.filter((t) => likedTracks.has(t.id)), [tracks, likedTracks])
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album || "").toLowerCase().includes(q)
    )
  }, [searchQuery, tracks])

  // ─── Effects (sin cambios) ─────────────────────────────────────────

  useEffect(() => {
    const user = localStorage.getItem("gg_user")
    if (!user) {
      router.push("/auth")
      return
    }
    const parsed = JSON.parse(user)
    setUserId(parsed.id)
    setUserProfile(parsed)
  }, [router])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/tracks")
        const data = await res.json()
        const all: Track[] = data.tracks || []
        setTracks(all)
        if (all.length) setCurrentTrack(all[0])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/likes?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => d.likedTrackIds && setLikedTracks(new Set(d.likedTrackIds)))
      .catch(console.error)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    fetch(`/api/user/stats?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setStats({
            totalPlayTime: d.totalPlayTime || 0,
            topGenre: d.topGenre || 'Various',
            listeningStreak: d.listeningStreak || 0,
            totalArtists: d.totalArtists || 0
          })
        }
      })
      .catch(console.error)
  }, [userId])

  const fetchPlaylists = useCallback(async () => {
    if (!userId) return
    setPlaylistsLoading(true)
    try {
      const res = await fetch(`/api/playlists?user_id=${userId}`)
      const data = await res.json()
      setPlaylists(data.playlists || [])
      if (openPlaylist) {
        const refreshed = (data.playlists || []).find((p: Playlist) => p.id === openPlaylist.id)
        if (refreshed) setOpenPlaylist(refreshed)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setPlaylistsLoading(false)
    }
  }, [userId, openPlaylist])

  useEffect(() => {
    if (view === "garden") fetchPlaylists()
  }, [view, userId, fetchPlaylists])

  useEffect(() => {
    if (!currentTrack) {
      setLyrics("")
      return
    }
    let cancelled = false
    fetchLyrics(currentTrack).then(text => {
      if (!cancelled) setLyrics(text)
    }).catch(() => {
      if (!cancelled) setLyrics("Lyrics not available for this track.")
    })
    return () => { cancelled = true }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    
    const onEnded = () => {
      if (userId && currentTrack) {
        const listenedSeconds = Math.floor(Date.now() / 1000) - listenStart
        const completionRate = Math.min(listenedSeconds / currentTrack.duration, 1)
      
        fetch("/api/listen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            track_id: currentTrack.id,
            duration_listened: listenedSeconds,
            track_duration: currentTrack.duration,
            completion_rate: completionRate,
            source: "player",
          }),
        }).catch(err => console.error('Listen error:', err))
      }

      if (queue.length > 0) {
        const [next, ...rest] = queue
        setQueue(rest)
        setCurrentTrack(next)
        setIsPlaying(true)
      } else if (isRepeat) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.play()
        }
      } else {
        const idx = tracks.findIndex((t) => t.id === currentTrack?.id)
        const next = isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length
        if (tracks[next]) {
          setCurrentTrack(tracks[next])
        }
      }
    }

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("durationchange", onDuration)
    audio.addEventListener("ended", onEnded)

    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("durationchange", onDuration)
      audio.removeEventListener("ended", onEnded)
    }
  }, [currentTrack, tracks, queue, isRepeat, isShuffle, userId, listenStart])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack?.url) return
    audio.src = currentTrack.url
    setListenStart(Math.floor(Date.now() / 1000))
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.code) {
        case "Space":
          e.preventDefault()
          setIsPlaying((p) => !p)
          break
        case "ArrowLeft":
          if (audioRef.current) audioRef.current.currentTime -= 5
          break
        case "ArrowRight":
          if (audioRef.current) audioRef.current.currentTime += 5
          break
        case "ArrowUp":
          setVolume((v) => Math.min(v + 5, 100))
          break
        case "ArrowDown":
          setVolume((v) => Math.max(v - 5, 0))
          break
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────

  const handlePlayTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }, [])

  const addToQueue = useCallback((track: Track) => {
    setQueue((q) => [...q, track])
  }, [])

  const removeFromQueue = useCallback((i: number) => {
    setQueue((q) => q.filter((_, j) => j !== i))
  }, [])

  const playFromQueue = useCallback((i: number) => {
    setCurrentTrack(queue[i])
    setQueue((q) => q.slice(i + 1))
    setIsPlaying(true)
  }, [queue])

  const skipToNext = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue
      setQueue(rest)
      setCurrentTrack(next)
      setIsPlaying(true)
      return
    }
    if (!tracks.length) return
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id)
    setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length])
    setIsPlaying(true)
  }, [queue, tracks, currentTrack, isShuffle])

  const skipToPrevious = useCallback(() => {
    if (!tracks.length) return
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id)
    setCurrentTrack(tracks[isShuffle ? Math.floor(Math.random() * tracks.length) : (idx - 1 + tracks.length) % tracks.length])
    setIsPlaying(true)
  }, [tracks, currentTrack, isShuffle])

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration) return
      const rect = e.currentTarget.getBoundingClientRect()
      audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration
    },
    [duration]
  )

  const toggleLike = useCallback(
    async (trackId: string) => {
      if (!userId) return
      if (likedTracks.has(trackId)) {
        await fetch(`/api/likes?user_id=${userId}&track_id=${trackId}`, { method: "DELETE" })
        setLikedTracks((prev) => {
          const s = new Set(prev)
          s.delete(trackId)
          return s
        })
      } else {
        await fetch("/api/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, track_id: trackId }),
        })
        setLikedTracks((prev) => new Set(prev).add(trackId))
      }
    },
    [userId, likedTracks]
  )

  const handleLogout = useCallback(() => {
    localStorage.removeItem("gg_token")
    localStorage.removeItem("gg_user")
    router.push("/auth")
  }, [router])

  const createPlaylist = async () => {
    if (!newPlaylistName.trim() || !userId) {
      alert('Playlist name required')
      return
    }
  
    setCreatingPlaylist(true)
  
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId, 
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || null
        }),
      })
    
      const data = await response.json()
    
      if (!response.ok) {
        throw new Error(data.error || 'Error creating playlist')
      }
    
      setNewPlaylistName("")
      setNewPlaylistDescription("")
      setShowNewPlaylist(false)
      await fetchPlaylists()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error:', errorMessage)
      alert(errorMessage)
    } finally {
      setCreatingPlaylist(false)
    }
  }

  const deletePlaylist = async (playlistId: string) => {
    if (!userId) return
    await fetch(`/api/playlists?playlist_id=${playlistId}&user_id=${userId}`, { method: "DELETE" })
    if (openPlaylist?.id === playlistId) setOpenPlaylist(null)
    fetchPlaylists()
  }

  const addToPlaylist = useCallback(
    async (trackId: string, playlistId: string) => {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_track", playlist_id: playlistId, track_id: trackId }),
      })
      fetchPlaylists()
    },
    [fetchPlaylists]
  )

  const removeFromPlaylist = async (trackId: string, playlistId: string) => {
    await fetch(`/api/playlists?playlist_id=${playlistId}&track_id=${trackId}`, { method: "DELETE" })
    fetchPlaylists()
  }

  const playPlaylist = (playlist: Playlist) => {
    if (!playlist.tracks.length) return
    handlePlayTrack(playlist.tracks[0])
    setQueue(playlist.tracks.slice(1))
  }

  // ─── Render optimizado y limpio ─────────────────────────────────────────

  return (
    <div className="h-screen w-full bg-[#0b1810] text-[#e8f5ec] overflow-hidden flex flex-col">
      <audio ref={audioRef} />
      <style>{`
        @keyframes wavePulse {
          0% { height: 4px; }
          100% { height: 12px; }
        }
        
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #1c3526;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #254d35;
        }
      `}</style>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-56 bg-[#071008] border-r border-[#3dba6f]/10 flex flex-col flex-shrink-0">
          <div className="px-5 py-5 border-b border-[#3dba6f]/10">
            <Link href="/" className="flex items-center gap-2 group">
              <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f" />
                <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-base tracking-wide text-[#e8f5ec]/90">Groove Garden</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {[
              { key: "home", icon: <LayoutGrid size={14} />, label: "Home" },
              { key: "search", icon: <Search size={14} />, label: "Discover" },
              { key: "garden", icon: <Library size={14} />, label: "Your Garden" },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key as View)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${view === key
                    ? "bg-[#3dba6f]/10 text-[#e8f5ec] border border-[#3dba6f]/20"
                    : "text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#3dba6f]/5"}`}
              >
                <span className={`${view === key ? "text-[#3dba6f]" : "text-[#4a7a5a]"}`}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-28">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-[#0b1810]/90 backdrop-blur-xl border-b border-[#3dba6f]/10 px-6 py-3 flex items-center justify-between">
            <div className="relative w-80">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a7a5a]" />
              <input
                type="text"
                placeholder="Search tracks, artists..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value) setView("search")
                  else if (view === "search") setView("home")
                }}
                className="w-full bg-[#0f1f14] border border-[#3dba6f]/10 rounded-full pl-9 pr-4 py-1.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/25 transition-colors"
              />
            </div>
            
            <button
              onClick={() => setView("profile")}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full transition-all
                ${view === "profile"
                  ? "bg-[#3dba6f]/15 border border-[#3dba6f]/25"
                  : "bg-[#0f1f14] border border-[#3dba6f]/10 hover:border-[#3dba6f]/20"}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center">
                <span className="text-[#071008] text-[10px] font-bold">{userProfile?.username?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <span className="text-xs">{userProfile?.username?.split(' ')[0] || "Account"}</span>
            </button>
          </header>

          <div className="px-6 py-5">
            {/* HOME View */}
            {view === "home" && (
              <>
                {/* Hero Section */}
                <div className="relative rounded-xl overflow-hidden border border-[#3dba6f]/10 mb-8 bg-gradient-to-r from-[#0f1f14] to-[#0a150d] p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3dba6f]">Editor's Pick</span>
                      <h1 className="text-2xl font-bold mt-2 mb-3">Fresh Blooms</h1>
                      <p className="text-sm text-[#8ab89a] mb-4">Your weekly dose of fresh tracks</p>
                      <button
                        onClick={() => { const f = featuredTracks[0]; if (f) handlePlayTrack(f) }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold hover:bg-[#4ecf80] transition-colors"
                      >
                        <Play size={10} fill="currentColor" /> Play now
                      </button>
                    </div>
                    {featuredTracks[0] && (
                      <img src={coverSrc(featuredTracks[0])} alt="" className="hidden lg:block w-24 h-24 rounded-xl shadow-xl object-cover" />
                    )}
                  </div>
                </div>

                {/* Recent Tracks */}
                <div>
                  <h2 className="text-lg font-semibold mb-4">Recent Growth</h2>
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {tracks.slice(0, 12).map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTrack}
                          onLike={toggleLike}
                          onAddToQueue={addToQueue}
                          onAddToPlaylist={addToPlaylist}
                          isLiked={likedTracks.has(track.id)}
                          isActive={currentTrack?.id === track.id}
                          playlists={playlists}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SEARCH View */}
            {view === "search" && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Discover</h2>
                {searchQuery ? (
                  searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Music size={32} className="mx-auto mb-3 text-[#4a7a5a] opacity-40" />
                      <p className="text-sm text-[#4a7a5a]">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {searchResults.map((track) => (
                        <TrackCard
                          key={track.id}
                          track={track}
                          onPlay={handlePlayTrack}
                          onLike={toggleLike}
                          onAddToQueue={addToQueue}
                          onAddToPlaylist={addToPlaylist}
                          isLiked={likedTracks.has(track.id)}
                          isActive={currentTrack?.id === track.id}
                          playlists={playlists}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Search size={32} className="mx-auto mb-3 text-[#4a7a5a] opacity-40" />
                    <p className="text-sm text-[#4a7a5a]">Start typing to search</p>
                  </div>
                )}
              </div>
            )}

            {/* GARDEN View */}
            {view === "garden" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    {openPlaylist && (
                      <button onClick={() => setOpenPlaylist(null)} className="text-xs text-[#4a7a5a] hover:text-[#8ab89a] mb-1">
                        ← Back
                      </button>
                    )}
                    <h2 className="text-lg font-semibold">{openPlaylist ? openPlaylist.name : "Your Garden"}</h2>
                  </div>
                  {!openPlaylist && (
                    <button onClick={() => setShowNewPlaylist(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3dba6f]/10 border border-[#3dba6f]/20 rounded-lg text-xs font-medium text-[#3dba6f] hover:bg-[#3dba6f]/20 transition-colors">
                      <Plus size={12} /> New Playlist
                    </button>
                  )}
                </div>

                {showNewPlaylist && !openPlaylist && (
                  <div className="mb-5 p-4 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-xl">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                      className="w-full bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-[#3dba6f]/30"
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={newPlaylistDescription}
                      onChange={(e) => setNewPlaylistDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-[#3dba6f]/30 resize-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={createPlaylist} disabled={!newPlaylistName.trim() || creatingPlaylist} className="flex-1 px-3 py-1.5 bg-[#3dba6f] text-[#071008] rounded-lg text-xs font-semibold disabled:opacity-50">
                        {creatingPlaylist ? "Creating..." : "Create"}
                      </button>
                      <button onClick={() => { setShowNewPlaylist(false); setNewPlaylistName(""); setNewPlaylistDescription(""); }} className="px-3 py-1.5 bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg text-xs">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {openPlaylist ? (
                  <div>
                    {openPlaylist.tracks.length > 0 && (
                      <button onClick={() => playPlaylist(openPlaylist)} className="flex items-center gap-2 px-4 py-1.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold mb-4">
                        <Play size={10} /> Play all
                      </button>
                    )}
                    {openPlaylist.tracks.length === 0 ? (
                      <div className="text-center py-12">
                        <Music size={32} className="mx-auto mb-3 text-[#4a7a5a] opacity-40" />
                        <p className="text-sm text-[#4a7a5a]">No tracks yet</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {openPlaylist.tracks.map((track, i) => (
                          <div key={track.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#142a19] group">
                            <span className="text-xs text-[#4a7a5a] w-6">{i + 1}</span>
                            <img src={coverSrc(track)} alt="" className="w-8 h-8 rounded object-cover" />
                            <div className="flex-1 min-w-0" onClick={() => handlePlayTrack(track)}>
                              <p className="text-sm font-medium truncate">{track.title}</p>
                              <p className="text-xs text-[#8ab89a] truncate">{track.artist}</p>
                            </div>
                            <button onClick={() => removeFromPlaylist(track.id, openPlaylist.id)} className="text-[#4a7a5a] hover:text-red-400 opacity-0 group-hover:opacity-100">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 bg-[#0f1f14] border border-[#3dba6f]/10 rounded-lg p-1 w-fit mb-5">
                      {[
                        { key: "liked", label: `Liked (${likedTracks.size})` },
                        { key: "playlists", label: `Playlists (${playlists.length})` },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setGardenTab(tab.key as any)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
                            ${gardenTab === tab.key ? "bg-[#142a19] text-[#3dba6f]" : "text-[#4a7a5a] hover:text-[#8ab89a]"}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {gardenTab === "liked" && (
                      likedTracksList.length === 0 ? (
                        <div className="text-center py-12">
                          <Heart size={32} className="mx-auto mb-3 text-[#4a7a5a] opacity-40" />
                          <p className="text-sm text-[#4a7a5a]">Like some tracks to grow your garden</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {likedTracksList.map((track) => (
                            <TrackCard
                              key={track.id}
                              track={track}
                              onPlay={handlePlayTrack}
                              onLike={toggleLike}
                              onAddToQueue={addToQueue}
                              onAddToPlaylist={addToPlaylist}
                              isLiked
                              isActive={currentTrack?.id === track.id}
                              playlists={playlists}
                            />
                          ))}
                        </div>
                      )
                    )}

                    {gardenTab === "playlists" && (
                      playlistsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                      ) : playlists.length === 0 ? (
                        <div className="text-center py-12">
                          <ListMusic size={32} className="mx-auto mb-3 text-[#4a7a5a] opacity-40" />
                          <p className="text-sm text-[#4a7a5a]">No playlists yet</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {playlists.map((pl) => (
                            <PlaylistCard key={pl.id} playlist={pl} onClick={() => setOpenPlaylist(pl)} onDelete={deletePlaylist} />
                          ))}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            )}

            {/* PROFILE View */}
            {view === "profile" && (
              <div>
                <h2 className="text-lg font-semibold mb-5">Profile</h2>
                
                <div className="bg-gradient-to-r from-[#0f1f14] to-[#0a150d] border border-[#3dba6f]/10 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center">
                      <span className="text-2xl font-bold text-[#071008]">{userProfile?.username?.[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{userProfile?.username}</h3>
                      <p className="text-sm text-[#8ab89a]">{userProfile?.email}</p>
                      <p className="text-xs text-[#4a7a5a] mt-1">{formatDate(userProfile?.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl p-3">
                    <Heart size={14} className="text-[#3dba6f] mb-1" />
                    <p className="text-2xl font-semibold">{likedTracks.size}</p>
                    <p className="text-xs text-[#4a7a5a]">Liked</p>
                  </div>
                  <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl p-3">
                    <ListMusic size={14} className="text-[#3dba6f] mb-1" />
                    <p className="text-2xl font-semibold">{playlists.length}</p>
                    <p className="text-xs text-[#4a7a5a]">Playlists</p>
                  </div>
                  <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl p-3">
                    <TrendingUp size={14} className="text-[#8ab89a] mb-1" />
                    <p className="text-2xl font-semibold">{stats.topGenre}</p>
                    <p className="text-xs text-[#4a7a5a]">Top Genre</p>
                  </div>
                  <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl p-3">
                    <Award size={14} className="text-[#8ab89a] mb-1" />
                    <p className="text-2xl font-semibold">{stats.listeningStreak}</p>
                    <p className="text-xs text-[#4a7a5a]">Day Streak</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {userProfile?.artist_id && (
                    <Link href="/artist" className="px-4 py-2 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-lg text-sm hover:border-[#3dba6f]/30 transition-colors">
                      Artist Studio
                    </Link>
                  )}
                  <button onClick={handleLogout} className="px-4 py-2 bg-[#0f1f14] border border-red-400/15 rounded-lg text-sm text-red-400/70 hover:border-red-400/30 hover:text-red-400 transition-colors">
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="h-4" />
        </main>
      </div>

      <PlaybackBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        volume={volume}
        currentTime={currentTime}
        duration={duration}
        likedTracks={likedTracks}
        queue={queue}
        showQueue={showQueue}
        showLyrics={showLyrics}
        lyrics={lyrics}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSkipNext={skipToNext}
        onSkipPrevious={skipToPrevious}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onToggleRepeat={() => setIsRepeat((r) => !r)}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleLike={toggleLike}
        onToggleQueue={() => setShowQueue(!showQueue)}
        onToggleLyrics={() => setShowLyrics(!showLyrics)}
        onRemoveFromQueue={removeFromQueue}
        onPlayFromQueue={playFromQueue}
      />
    </div>
  )
}