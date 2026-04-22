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

// ─── Types ─────────────────────────────────────────────────────────────

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

// ─── Sub‑components ───────────────────────────────────────────────────

function WaveBars({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[8, 12, 6, 10, 8].map((h, i) => (
        <div
          key={i}
          className="w-0.5 bg-[#3dba6f] rounded-sm"
          style={{
            height: playing ? `${h}px` : "3px",
            transition: playing ? "none" : "height 0.3s ease",
            animationName: playing ? "wavePulse" : "none",
            animationDuration: `${0.4 + i * 0.1}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationDelay: `${i * 0.07}s`,
          }}
        />
      ))}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-[#0f1f14] border border-[#3dba6f]/8 rounded-xl p-3 animate-pulse">
      <div className="aspect-square bg-[#142a19] rounded-lg mb-2" />
      <div className="h-3 bg-[#142a19] rounded-lg w-3/4 mb-1" />
      <div className="h-2 bg-[#142a19] rounded-lg w-1/2" />
    </div>
  )
}

// ─── Context Menu (unchanged) ─────────────────────────────────────────

function ContextMenu({
  x, y, track, playlists, onPlay, onAddToQueue, onLike, isLiked, onAddToPlaylist, onClose
}: {
  x: number; y: number; track: Track; playlists: Playlist[]
  onPlay: () => void; onAddToQueue: () => void; onLike: () => void
  isLiked: boolean; onAddToPlaylist: (playlistId: string) => void; onClose: () => void
}) {
  const [showPlaylists, setShowPlaylists] = useState(false)

  useEffect(() => {
    const handler = () => onClose()
    window.addEventListener("click", handler)
    return () => window.removeEventListener("click", handler)
  }, [onClose])

  return (
    <div
      className="fixed z-[100] bg-[#0f1f14] border border-[#3dba6f]/18 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {[
        { icon: <Play size={12} />, label: "Play now", action: () => { onPlay(); onClose() } },
        { icon: <ListPlus size={12} />, label: "Add to queue", action: () => { onAddToQueue(); onClose() } },
      ].map(({ icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer"
        >
          <span className="text-[#3dba6f]">{icon}</span> {label}
        </button>
      ))}

      {playlists.length > 0 && (
        <>
          <div className="my-1 mx-2 border-t border-[#3dba6f]/8" />
          <button
            onClick={() => setShowPlaylists((s) => !s)}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer"
          >
            <span className="text-[#3dba6f]"><ListMusic size={12} /></span>
            Add to playlist
            <ChevronRight size={10} className={`ml-auto text-[#4a7a5a] transition-transform ${showPlaylists ? "rotate-90" : ""}`} />
          </button>
          {showPlaylists && playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => { onAddToPlaylist(pl.id); onClose() }}
              className="flex items-center gap-2 w-full pl-9 pr-3.5 py-1.5 text-xs text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer"
            >
              <img src={playlistCover(pl)} alt="" className="w-4 h-4 rounded-md" />
              <span className="truncate">{pl.name}</span>
            </button>
          ))}
        </>
      )}

      <div className="my-1 mx-2 border-t border-[#3dba6f]/8" />
      <button
        onClick={() => { onLike(); onClose() }}
        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-[#e8f5ec] hover:bg-[#162b1e] transition-colors text-left bg-transparent border-none cursor-pointer"
      >
        <Heart size={12} fill={isLiked ? "currentColor" : "none"} className={isLiked ? "text-[#3dba6f]" : "text-[#4a7a5a]"} />
        {isLiked ? "Unlike" : "Like"}
      </button>
    </div>
  )
}

// ─── Track Card (compact for denser grids) ────────────────────────────

function TrackCard({
  track, onPlay, onLike, onAddToQueue, onAddToPlaylist, isLiked, isActive, playlists
}: {
  track: Track; onPlay: (t: Track) => void; onLike: (id: string) => void
  onAddToQueue: (t: Track) => void; onAddToPlaylist: (trackId: string, playlistId: string) => void
  isLiked: boolean; isActive: boolean; playlists: Playlist[]
}) {
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)
  const [heartBurst, setHeartBurst] = useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLike(track.id)
    setHeartBurst(true)
    setTimeout(() => setHeartBurst(false), 300)
  }

  return (
    <>
      <div
        onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }) }}
        className={`group bg-[#0f1f14] border rounded-xl p-3 cursor-pointer transition-all duration-200
          ${isActive
            ? "border-[#3dba6f]/30 bg-[#142a19]"
            : "border-[#3dba6f]/8 hover:border-[#3dba6f]/20 hover:bg-[#122318]"}`}
      >
        <div className="relative aspect-square bg-[#0a150d] rounded-lg mb-2 overflow-hidden">
          <img
            src={coverSrc(track)}
            alt={track.title}
            className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={() => onPlay(track)}
            className="absolute bottom-2 right-2 w-8 h-8 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 shadow-lg border-none cursor-pointer"
            aria-label="Play track"
          >
            <Play size={12} fill="currentColor" className="ml-0.5" />
          </button>
          {isActive && (
            <div className="absolute top-2 left-2 bg-[#0b1810]/75 backdrop-blur-sm rounded-full px-1.5 py-0.5">
              <WaveBars playing />
            </div>
          )}
        </div>
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-medium truncate ${isActive ? "text-[#3dba6f]" : "text-[#e8f5ec]"}`}>
              {track.title}
            </p>
            <p className="text-[10px] text-[#8ab89a] truncate mt-0.5">{track.artist}</p>
          </div>
          <button
            onClick={handleLike}
            className={`flex-shrink-0 transition-colors border-none bg-transparent cursor-pointer p-0 ${heartBurst ? "animate-heart-burst" : ""}
              ${isLiked ? "text-[#3dba6f]" : "text-[#3a6045] hover:text-[#3dba6f]"}`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y} track={track} playlists={playlists}
          onPlay={() => onPlay(track)} onAddToQueue={() => onAddToQueue(track)}
          onLike={() => onLike(track.id)} isLiked={isLiked}
          onAddToPlaylist={(pid) => onAddToPlaylist(track.id, pid)}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

// ─── Track Row (unchanged) ────────────────────────────────────────────

function TrackRow({
  track, index, onPlay, onLike, onAddToQueue, onAddToPlaylist, isLiked, isActive, playlists
}: {
  track: Track; index: number; onPlay: (t: Track) => void; onLike: (id: string) => void
  onAddToQueue: (t: Track) => void; onAddToPlaylist: (trackId: string, playlistId: string) => void
  isLiked: boolean; isActive: boolean; playlists: Playlist[]
}) {
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)

  return (
    <>
      <div
        onContextMenu={(e) => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY }) }}
        onClick={() => onPlay(track)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group cursor-pointer
          ${isActive
            ? "bg-[#3dba6f]/8 border border-[#3dba6f]/18"
            : "hover:bg-[#142a19] border border-transparent"}`}
      >
        <span className="text-[10px] text-[#3a6045] w-5 text-right font-mono flex-shrink-0 tabular-nums">{index + 1}</span>
        <div className="w-8 h-8 bg-[#142a19] rounded-md overflow-hidden flex-shrink-0">
          <img src={coverSrc(track)} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isActive ? "text-[#3dba6f]" : "text-[#e8f5ec]"}`}>{track.title}</p>
          <p className="text-xs text-[#8ab89a] truncate">{track.artist}</p>
        </div>
        {track.album && <p className="text-xs text-[#4a7a5a] hidden lg:block truncate max-w-[120px]">{track.album}</p>}
        <span className="text-xs text-[#4a7a5a] font-mono flex-shrink-0">{fmt(track.duration)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToQueue(track) }}
            className="w-6 h-6 flex items-center justify-center text-[#4a7a5a] hover:text-[#3dba6f] transition-colors border-none bg-transparent cursor-pointer rounded hover:bg-[#3dba6f]/8"
            aria-label="Add to queue"
          >
            <ListPlus size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLike(track.id) }}
            className={`w-6 h-6 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer rounded hover:bg-[#3dba6f]/8
              ${isLiked ? "text-[#3dba6f]" : "text-[#4a7a5a] hover:text-[#3dba6f]"}`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <Heart size={11} fill={isLiked ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(track) }}
            className="w-6 h-6 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] border-none cursor-pointer hover:bg-[#4ecf80] transition-colors"
            aria-label="Play now"
          >
            <Play size={9} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x} y={ctx.y} track={track} playlists={playlists}
          onPlay={() => onPlay(track)} onAddToQueue={() => onAddToQueue(track)}
          onLike={() => onLike(track.id)} isLiked={isLiked}
          onAddToPlaylist={(pid) => onAddToPlaylist(track.id, pid)}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

// ─── Playlist Card (larger for better visibility) ─────────────────────

function PlaylistCard({ playlist, onClick, onDelete }: {
  playlist: Playlist; onClick: () => void; onDelete: (id: string) => void
}) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0f1f14] border border-[#3dba6f]/8 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#3dba6f]/20 hover:bg-[#122318]"
    >
      <div className="relative aspect-square">
        <img
          src={playlistCover(playlist)}
          alt={playlist.name}
          className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
        />
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(playlist.id) }}
          className="absolute top-2 right-2 w-6 h-6 bg-[#0b1810]/70 rounded-full flex items-center justify-center text-red-400/80 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 border-none cursor-pointer backdrop-blur-sm"
          aria-label="Delete playlist"
        >
          <Trash2 size={10} />
        </button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate text-[#e8f5ec]">{playlist.name}</p>
        <p className="text-xs text-[#8ab89a] mt-0.5">
          {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
        </p>
      </div>
    </div>
  )
}

// ─── Playback Bar (retractable, compact) ──────────────────────────────

function PlaybackBar({
  currentTrack, isPlaying, isShuffle, isRepeat, volume, currentTime, duration,
  likedTracks, queue, showQueue, showLyrics,
  onTogglePlay, onSkipNext, onSkipPrevious, onToggleShuffle, onToggleRepeat,
  onSeek, onVolumeChange, onToggleLike, onToggleQueue, onToggleLyrics,
  onRemoveFromQueue, onPlayFromQueue
}: any) {
  const [volumeSliderVisible, setVolumeSliderVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b1810]/95 backdrop-blur-xl border-t border-[#3dba6f]/18 transition-all duration-300">
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-[#3dba6f]/20 cursor-pointer group"
        onClick={onSeek}
      >
        <div className="relative h-full bg-[#3dba6f]" style={{ width: `${progress}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 h-16">
              <div className="flex items-center gap-3 w-1/3 min-w-[160px]">
                {currentTrack && (
                  <div className="w-10 h-10 rounded-md overflow-hidden shadow-md flex-shrink-0">
                    <img src={coverSrc(currentTrack)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-[#e8f5ec]">{currentTrack?.title || "Select a track"}</p>
                  <p className="text-xs text-[#8ab89a] truncate">{currentTrack?.artist || "—"}</p>
                </div>
                <button
                  onClick={() => onToggleLike(currentTrack?.id)}
                  className="flex-shrink-0 text-[#4a7a5a] hover:text-[#3dba6f] transition-colors"
                  aria-label={likedTracks.has(currentTrack?.id) ? "Unlike" : "Like"}
                >
                  <Heart size={14} fill={likedTracks.has(currentTrack?.id) ? "currentColor" : "none"} className={likedTracks.has(currentTrack?.id) ? "text-[#3dba6f]" : ""} />
                </button>
              </div>

              <div className="flex flex-col items-center gap-0.5 w-1/3">
                <div className="flex items-center gap-3">
                  <button onClick={onToggleShuffle} className={`transition-colors ${isShuffle ? "text-[#3dba6f]" : "text-[#4a7a5a] hover:text-[#8ab89a]"}`} aria-label="Shuffle">
                    <Shuffle size={14} />
                  </button>
                  <button onClick={onSkipPrevious} className="text-[#e8f5ec] hover:text-white transition-colors" aria-label="Previous">
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={onTogglePlay}
                    className="w-8 h-8 rounded-full bg-[#3dba6f] flex items-center justify-center text-[#071008] hover:bg-[#4ecf80] transition-transform active:scale-95"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button onClick={onSkipNext} className="text-[#e8f5ec] hover:text-white transition-colors" aria-label="Next">
                    <SkipForward size={18} />
                  </button>
                  <button onClick={onToggleRepeat} className={`transition-colors ${isRepeat ? "text-[#3dba6f]" : "text-[#4a7a5a] hover:text-[#8ab89a]"}`} aria-label="Repeat">
                    {isRepeat ? <Repeat1 size={14} /> : <Repeat size={14} />}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#4a7a5a]">
                  <span>{fmt(currentTime)}</span>
                  <div className="w-48 h-1 bg-[#3dba6f]/20 rounded-full cursor-pointer group relative" onClick={onSeek}>
                    <div className="h-full bg-[#3dba6f] rounded-full" style={{ width: `${progress}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" style={{ left: `${progress}%` }} />
                  </div>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 w-1/3 min-w-[160px]">
                <div className="relative flex items-center gap-2">
                  <button
                    onClick={() => setVolumeSliderVisible(!volumeSliderVisible)}
                    className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors"
                    aria-label="Volume"
                  >
                    {volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  {volumeSliderVisible && (
                    <div className="absolute bottom-10 right-0 bg-[#0f1f14] border border-[#3dba6f]/18 rounded-lg p-2 shadow-xl w-28">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                        className="w-full accent-[#3dba6f]"
                        aria-label="Volume slider"
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={onToggleQueue}
                  className={`text-[#4a7a5a] hover:text-[#8ab89a] transition-colors ${showQueue ? "text-[#3dba6f]" : ""}`}
                  aria-label="Queue"
                >
                  <ListMusic size={14} />
                </button>
                <button
                  onClick={onToggleLyrics}
                  className={`text-[#4a7a5a] hover:text-[#8ab89a] transition-colors ${showLyrics ? "text-[#3dba6f]" : ""}`}
                  aria-label="Lyrics"
                >
                  <Music size={14} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors"
                  aria-label="Collapse"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showQueue && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#3dba6f]/8 bg-[#0b1810]/95 backdrop-blur-xl overflow-hidden"
                >
                  <div className="p-3 max-h-80 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-[#e8f5ec] mb-2">Queue ({queue.length})</h3>
                    {queue.length === 0 ? (
                      <p className="text-xs text-[#8ab89a]">Queue is empty</p>
                    ) : (
                      <div className="space-y-1">
                        {queue.map((track: Track, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142a19] group">
                            <img src={coverSrc(track)} alt="" className="w-8 h-8 rounded" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#e8f5ec] truncate">{track.title}</p>
                              <p className="text-[10px] text-[#8ab89a] truncate">{track.artist}</p>
                            </div>
                            <button
                              onClick={() => onPlayFromQueue(idx)}
                              className="text-[#4a7a5a] hover:text-[#3dba6f]"
                              aria-label="Play now"
                            >
                              <Play size={12} />
                            </button>
                            <button
                              onClick={() => onRemoveFromQueue(idx)}
                              className="text-[#4a7a5a] hover:text-red-400"
                              aria-label="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
            transition={{ duration: 0.2 }}
            className="h-10 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={onTogglePlay}
                className="w-6 h-6 rounded-full bg-[#3dba6f] flex items-center justify-center text-[#071008] hover:bg-[#4ecf80] transition-transform active:scale-95"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={onSkipPrevious} className="text-[#e8f5ec] hover:text-white" aria-label="Previous">
                <SkipBack size={12} />
              </button>
              <button onClick={onSkipNext} className="text-[#e8f5ec] hover:text-white" aria-label="Next">
                <SkipForward size={12} />
              </button>
              <div className="text-xs truncate max-w-[200px]">
                <span className="text-[#e8f5ec] font-medium">{currentTrack?.title || "No track"}</span>
                <span className="text-[#8ab89a] ml-1">{currentTrack?.artist ? `— ${currentTrack.artist}` : ""}</span>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors"
              aria-label="Expand"
            >
              <ChevronUp size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Player Component ────────────────────────────────────────────

type View = "home" | "search" | "garden" | "profile"

const NAV_ITEMS: { key: View; icon: React.ReactNode; label: string }[] = [
  { key: "home",   icon: <LayoutGrid size={15} />, label: "Home" },
  { key: "search", icon: <Search size={15} />,     label: "Discover" },
  { key: "garden", icon: <Library size={15} />,    label: "Your Garden" },
]

export default function Player() {
  const router = useRouter()

  // State
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

  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null)
  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
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

  // ─── Effects ─────────────────────────────────────────────────────────

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
    const audio = audioRef.current
    if (!audio) return

    const onTime = () => setCurrentTime(audio.currentTime)
    const onDuration = () => setDuration(audio.duration)
    const onEnded = () => {
      if (userId && currentTrack) {
        fetch("/api/listen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            track_id: currentTrack.id,
            duration_listened: Math.floor(Date.now() / 1000) - listenStart,
            track_duration: currentTrack.duration,
            source: "player",
          }),
        })
      }
      if (queue.length > 0) {
        const [next, ...rest] = queue
        setQueue(rest)
        setCurrentTrack(next)
        setIsPlaying(true)
      } else if (isRepeat) {
        audio.currentTime = 0
        audio.play()
      } else {
        const idx = tracks.findIndex((t) => t.id === currentTrack?.id)
        const next = isShuffle ? Math.floor(Math.random() * tracks.length) : (idx + 1) % tracks.length
        setCurrentTrack(tracks[next])
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

  // Keyboard shortcuts
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
    setShowQueue(true)
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

  const toggleQueue = useCallback(() => {
    setShowQueue((q) => !q)
    setShowLyrics(false)
  }, [])

  const toggleLyrics = useCallback(() => {
    setShowLyrics((l) => !l)
    setShowQueue(false)
  }, [])

  const createPlaylist = async () => {
    if (!newPlaylistName.trim() || !userId) return
    setCreatingPlaylist(true)
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", user_id: userId, name: newPlaylistName.trim() }),
    })
    setNewPlaylistName("")
    setShowNewPlaylist(false)
    setCreatingPlaylist(false)
    fetchPlaylists()
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

  const [heroPreviewTrack, setHeroPreviewTrack] = useState<Track | null>(featuredTracks[0] || null)

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="h-screen w-full bg-[#0b1810] text-[#e8f5ec] overflow-hidden flex flex-col">
      <audio ref={audioRef} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        
        * {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        
        .gg-serif {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        
        @keyframes wavePulse {
          from { height: 3px; }
          to { height: 12px; }
        }
        
        @keyframes heartBurst {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .animate-heart-burst {
          animation: heartBurst 0.3s ease;
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
        <aside className="w-56 bg-[#071008] border-r border-[#3dba6f]/8 flex flex-col flex-shrink-0">
          <div className="px-5 py-5 border-b border-[#3dba6f]/8">
            <Link href="/" className="flex items-center gap-2.5 no-underline group">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f" />
                <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="gg-serif text-base tracking-wide text-[#e8f5ec]/85">Groove Garden</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#3a6045] px-2 mb-2.5">Menu</p>
            {NAV_ITEMS.map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border-none cursor-pointer
                  ${view === key
                    ? "bg-[#3dba6f]/12 text-[#e8f5ec] border border-[#3dba6f]/18"
                    : "bg-transparent text-[#8ab89a] hover:text-[#e8f5ec] hover:bg-[#3dba6f]/6 border border-transparent"}`}
              >
                <span className={`flex-shrink-0 ${view === key ? "text-[#3dba6f]" : "text-[#4a7a5a]"}`}>{icon}</span>
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header with search and account */}
          <header className="sticky top-0 z-20 bg-[#0b1810]/90 backdrop-blur-xl border-b border-[#3dba6f]/8 px-6 py-3 flex items-center justify-between">
            <div className="relative w-80">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a7a5a]" />
              <input
                type="text"
                placeholder="Tracks, artists, albums…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value) setView("search")
                  else if (view === "search") setView("home")
                }}
                className="w-full bg-[#0f1f14] border border-[#3dba6f]/10 rounded-full pl-9 pr-4 py-2 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/28 transition-colors"
              />
            </div>
            
            {/* Account button moved here */}
            <button
              onClick={() => setView("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border-none cursor-pointer
                ${view === "profile"
                  ? "bg-[#3dba6f]/15 border border-[#3dba6f]/25 text-[#e8f5ec]"
                  : "bg-[#0f1f14] border border-[#3dba6f]/12 hover:border-[#3dba6f]/25 text-[#8ab89a]"}`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center">
                <span className="text-[#071008] text-[10px] font-bold">{userProfile?.username?.[0]?.toUpperCase() || "?"}</span>
              </div>
              <span className="text-xs font-medium">{userProfile?.username?.split(' ')[0] || "Account"}</span>
            </button>
          </header>

          <div className="px-6 py-5">
            {/* HOME view */}
            {view === "home" && (
              <>
                {/* Hero */}
                <section className="relative rounded-xl overflow-hidden border border-[#3dba6f]/10 mb-8 bg-gradient-to-r from-[#0f1f14] to-[#0a150d]">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(61,186,111,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,186,111,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                  
                  <div className="relative p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#3dba6f] block mb-3">Editor's Pick</span>
                      <h1 className="gg-serif text-3xl font-medium leading-tight mb-4 text-[#e8f5ec]">
                        Fresh Blooms<br />for the Weekend
                      </h1>
                      <div className="flex gap-2 mb-5">
                        <button
                          onClick={() => { const f = featuredTracks[0]; if (f) handlePlayTrack(f) }}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold hover:bg-[#4ecf80] transition-colors border-none cursor-pointer"
                        >
                          <Play size={10} fill="currentColor" /> Play mix
                        </button>
                        <button className="px-4 py-1.5 bg-transparent border border-[#3dba6f]/20 rounded-full text-xs text-[#8ab89a] hover:border-[#3dba6f]/35 hover:text-[#e8f5ec] transition-all cursor-pointer">
                          Save to Garden
                        </button>
                      </div>
                      
                      {/* Featured tracks horizontal */}
                      <div className="flex gap-2">
                        {featuredTracks.slice(0, 3).map((track) => (
                          <button
                            key={track.id}
                            onClick={() => handlePlayTrack(track)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#0b1810]/60 border border-[#3dba6f]/10 text-xs hover:border-[#3dba6f]/25 transition-all"
                          >
                            <img src={coverSrc(track)} alt="" className="w-5 h-5 rounded-full object-cover" />
                            <span className="truncate max-w-[80px]">{track.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {heroPreviewTrack && (
                      <div className="hidden lg:block w-32 h-32 rounded-xl overflow-hidden shadow-xl">
                        <img src={coverSrc(heroPreviewTrack)} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </section>

                {/* Track grid - denser */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="gg-serif text-xl font-medium text-[#e8f5ec]">Recent Growth</h2>
                    <button className="text-xs text-[#4a7a5a] hover:text-[#3dba6f] transition-colors bg-transparent border-none cursor-pointer">
                      See all →
                    </button>
                  </div>
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-12">
                      <Music size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                      <p className="text-xs text-[#4a7a5a]">No tracks yet</p>
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
                </section>
              </>
            )}

            {/* SEARCH view */}
            {view === "search" && (
              <div>
                <h2 className="gg-serif text-xl font-medium mb-4 text-[#e8f5ec]">Discover</h2>
                {searchQuery ? (
                  searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Music size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                      <p className="text-xs text-[#4a7a5a]">No results for "{searchQuery}"</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a7a5a] mb-3">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                      </p>
                      <div className="space-y-0.5">
                        {searchResults.map((track, i) => (
                          <TrackRow
                            key={track.id}
                            track={track}
                            index={i}
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
                    </>
                  )
                ) : (
                  <div className="text-center py-12">
                    <Search size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                    <p className="text-xs text-[#4a7a5a]">Type in the search bar above</p>
                  </div>
                )}
              </div>
            )}

            {/* GARDEN view - fuller layout */}
            {view === "garden" && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    {openPlaylist ? (
                      <button onClick={() => setOpenPlaylist(null)} className="flex items-center gap-1 text-xs text-[#4a7a5a] hover:text-[#8ab89a] transition-colors bg-transparent border-none cursor-pointer mb-1">
                        <ChevronRight size={10} className="rotate-180" /> Back
                      </button>
                    ) : null}
                    <h2 className="gg-serif text-xl font-medium text-[#e8f5ec]">
                      {openPlaylist ? openPlaylist.name : "Your Garden"}
                    </h2>
                    <p className="text-xs text-[#4a7a5a] mt-0.5">
                      {openPlaylist
                        ? `${openPlaylist.tracks.length} tracks`
                        : `${likedTracks.size} liked · ${playlists.length} playlists`}
                    </p>
                  </div>
                  {!openPlaylist && (
                    <button onClick={() => setShowNewPlaylist(true)} className="flex items-center gap-1 px-3 py-1.5 bg-[#3dba6f]/10 border border-[#3dba6f]/18 rounded-lg text-xs font-medium text-[#3dba6f] hover:bg-[#3dba6f]/18 transition-colors cursor-pointer">
                      <Plus size={12} /> New Playlist
                    </button>
                  )}
                </div>

                {showNewPlaylist && !openPlaylist && (
                  <div className="flex items-center gap-2 mb-5 p-3 bg-[#0f1f14] border border-[#3dba6f]/12 rounded-xl">
                    <input autoFocus type="text" placeholder="Playlist name…" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createPlaylist()} className="flex-1 bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg px-3 py-1.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/30 transition-colors" />
                    <button onClick={createPlaylist} disabled={!newPlaylistName.trim() || creatingPlaylist} className="px-3 py-1.5 bg-[#3dba6f] text-[#071008] rounded-lg text-xs font-semibold hover:bg-[#4ecf80] transition-colors disabled:opacity-50 cursor-pointer border-none">
                      {creatingPlaylist ? "…" : "Create"}
                    </button>
                    <button onClick={() => { setShowNewPlaylist(false); setNewPlaylistName("") }} className="text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors bg-transparent border-none cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {openPlaylist ? (
                  <div>
                    {openPlaylist.tracks.length > 0 && (
                      <div className="flex gap-2 mb-4">
                        <button onClick={() => playPlaylist(openPlaylist)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3dba6f] text-[#071008] rounded-full text-xs font-semibold hover:bg-[#4ecf80] transition-colors cursor-pointer border-none">
                          <Play size={10} fill="currentColor" /> Play all
                        </button>
                      </div>
                    )}
                    {openPlaylist.tracks.length === 0 ? (
                      <div className="text-center py-12">
                        <Music size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                        <p className="text-xs text-[#4a7a5a]">No tracks yet — right-click any track to add it here</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {openPlaylist.tracks.map((track, i) => (
                          <div key={track.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group cursor-pointer ${currentTrack?.id === track.id ? "bg-[#3dba6f]/8 border border-[#3dba6f]/18" : "hover:bg-[#142a19] border border-transparent"}`}>
                            <span className="text-[10px] text-[#3a6045] w-5 text-right font-mono flex-shrink-0">{i + 1}</span>
                            <div className="w-8 h-8 bg-[#142a19] rounded-md overflow-hidden flex-shrink-0">
                              <img src={coverSrc(track)} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0" onClick={() => handlePlayTrack(track)}>
                              <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? "text-[#3dba6f]" : "text-[#e8f5ec]"}`}>{track.title}</p>
                              <p className="text-xs text-[#8ab89a] truncate">{track.artist}</p>
                            </div>
                            <span className="text-xs text-[#4a7a5a] font-mono">{fmt(track.duration)}</span>
                            <button onClick={() => removeFromPlaylist(track.id, openPlaylist.id)} className="text-[#3a6045] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 bg-transparent border-none cursor-pointer">
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-0.5 bg-[#0f1f14] border border-[#3dba6f]/8 rounded-lg p-1 w-fit mb-5">
                      {(["liked", "playlists"] as const).map((tab) => (
                        <button key={tab} onClick={() => setGardenTab(tab)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer ${gardenTab === tab ? "bg-[#142a19] text-[#3dba6f]" : "bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]"}`}>
                          {tab === "liked" ? `Liked (${likedTracks.size})` : `Playlists (${playlists.length})`}
                        </button>
                      ))}
                    </div>

                    {gardenTab === "liked" && (
                      likedTracksList.length === 0 ? (
                        <div className="text-center py-12">
                          <Heart size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                          <p className="text-xs text-[#4a7a5a]">Like some tracks to grow your garden</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                      ) : playlists.length === 0 ? (
                        <div className="text-center py-12">
                          <ListMusic size={28} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                          <p className="text-xs text-[#4a7a5a] mb-2">No playlists yet</p>
                          <button onClick={() => setShowNewPlaylist(true)} className="text-xs text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer">
                            Create your first playlist →
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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

            {/* PROFILE view - full width dashboard */}
            {view === "profile" && (
              <div>
                <h2 className="gg-serif text-xl font-medium mb-5 text-[#e8f5ec]">Your Profile</h2>
                
                {/* Profile header card */}
                <div className="bg-gradient-to-r from-[#0f1f14] to-[#0a150d] border border-[#3dba6f]/10 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex-shrink-0 flex items-center justify-center shadow-lg">
                      <span className="text-[#071008] text-2xl font-bold">{userProfile?.username?.[0]?.toUpperCase() || "?"}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-xl font-semibold text-[#e8f5ec]">{userProfile?.username}</h3>
                        <span className="text-[10px] px-2 py-0.5 bg-[#3dba6f]/15 text-[#3dba6f] rounded-full border border-[#3dba6f]/25 font-medium">
                          {userProfile?.plan_type}
                        </span>
                      </div>
                      <p className="text-sm text-[#8ab89a] mb-3">{userProfile?.email}</p>
                      <div className="flex items-center gap-4 text-xs text-[#4a7a5a]">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(userProfile?.created_at)}</span>
                        <span className="flex items-center gap-1"><Headphones size={12} /> {stats.totalPlayTime} hrs listened</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { icon: <Heart size={14} />, label: "Liked Tracks", value: likedTracks.size, color: "text-[#3dba6f]" },
                    { icon: <ListMusic size={14} />, label: "Playlists", value: playlists.length, color: "text-[#3dba6f]" },
                    { icon: <TrendingUp size={14} />, label: "Top Genre", value: stats.topGenre, color: "text-[#8ab89a]" },
                    { icon: <Award size={14} />, label: "Day Streak", value: `${stats.listeningStreak} days`, color: "text-[#8ab89a]" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-[#0f1f14] border border-[#3dba6f]/8 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={stat.color}>{stat.icon}</span>
                        <span className="text-[10px] text-[#4a7a5a] uppercase tracking-wide">{stat.label}</span>
                      </div>
                      <p className={`text-lg font-semibold ${stat.color === "text-[#3dba6f]" ? "text-[#3dba6f]" : "text-[#e8f5ec]"}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recently played section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#e8f5ec] flex items-center gap-2">
                      <Clock size={14} className="text-[#4a7a5a]" /> Recently Played
                    </h3>
                    <button className="text-[10px] text-[#4a7a5a] hover:text-[#3dba6f] transition-colors">View all →</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {tracks.slice(0, 5).map((track) => (
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
                </div>

                {/* Top artists section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#e8f5ec] flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#4a7a5a]" /> Top Artists This Month
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(tracks.map(t => t.artist))].slice(0, 8).map((artist, i) => (
                      <div key={artist} className="bg-[#0f1f14] border border-[#3dba6f]/8 rounded-full px-3 py-1.5 text-xs text-[#8ab89a] hover:border-[#3dba6f]/25 hover:text-[#e8f5ec] transition-all">
                        #{i + 1} {artist}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  {userProfile?.artist_id && (
                    <Link href="/artist" className="flex items-center gap-2 px-4 py-2 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-xl text-sm text-[#8ab89a] hover:border-[#3dba6f]/30 hover:text-[#e8f5ec] transition-all no-underline">
                      <Music size={14} /> Artist Studio
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-[#0f1f14] border border-red-400/15 rounded-xl text-sm text-red-400/70 hover:border-red-400/30 hover:text-red-400 transition-all cursor-pointer">
                    <X size={14} /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="h-5" />
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
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onSkipNext={skipToNext}
        onSkipPrevious={skipToPrevious}
        onToggleShuffle={() => setIsShuffle((s) => !s)}
        onToggleRepeat={() => setIsRepeat((r) => !r)}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleLike={toggleLike}
        onToggleQueue={toggleQueue}
        onToggleLyrics={toggleLyrics}
        onRemoveFromQueue={removeFromQueue}
        onPlayFromQueue={playFromQueue}
      />
    </div>
  )
}