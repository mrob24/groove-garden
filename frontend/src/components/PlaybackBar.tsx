"use client"

import React, { useRef, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Repeat, Shuffle,
  Volume2, Mic2, ListMusic, Heart, X, GripVertical, ChevronDown,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string
  cover_url?: string
  is_featured?: boolean
  lyrics?: string | null
  lyrics_type?: 'plain' | 'lrc'
}

interface LrcLine {
  time: number
  text: string
}

interface PlaybackBarProps {
  currentTrack: Track | null
  isPlaying: boolean
  isShuffle: boolean
  isRepeat: boolean
  volume: number
  currentTime: number
  duration: number
  likedTracks: Set<string>
  queue: Track[]
  showQueue: boolean
  showLyrics: boolean
  onTogglePlay: () => void
  onSkipNext: () => void
  onSkipPrevious: () => void
  onToggleShuffle: () => void
  onToggleRepeat: () => void
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onVolumeChange: (volume: number) => void
  onToggleLike: (trackId: string) => void
  onToggleQueue: () => void
  onToggleLyrics: () => void
  onRemoveFromQueue: (index: number) => void
  onPlayFromQueue: (index: number) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(t: number) {
  if (!t || isNaN(t)) return '0:00'
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`
}

function parseLRC(raw: string): LrcLine[] {
  return raw
    .split('\n')
    .map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
      if (!match) return null
      const [, min, sec, cs, text] = match
      return {
        time: +min * 60 + +sec + +cs / (cs.length === 3 ? 1000 : 100),
        text: text.trim(),
      }
    })
    .filter((l): l is LrcLine => l !== null && l.text.length > 0)
}

function coverSrc(track: Track) {
  return track.cover_url ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${track.id}&backgroundColor=1a3a20`
}

// ─── Lyrics Panel ─────────────────────────────────────────────────────────────

function LyricsPanel({
  track,
  currentTime,
  onClose,
}: {
  track: Track
  currentTime: number
  onClose: () => void
}) {
  const activeRef = useRef<HTMLDivElement>(null)

  const isLrc = track.lyrics_type === 'lrc' && !!track.lyrics
  const lrcLines: LrcLine[] = isLrc ? parseLRC(track.lyrics!) : []
  const activeLine = isLrc
    ? lrcLines.reduce((best, line, i) => (line.time <= currentTime ? i : best), -1)
    : -1

  // Auto-scroll to active line
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeLine])

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3dba6f]/10">
        <div className="flex items-center gap-2 min-w-0">
          <Mic2 size={13} className="text-[#3dba6f] flex-shrink-0" />
          <p className="text-xs font-medium truncate">{track.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-[#3f6b4e] hover:text-[#e8f5ec] transition-colors flex-shrink-0 ml-2"
        >
          <X size={13} />
        </button>
      </div>

      {/* Content */}
      <div className="h-72 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin">
        {!track.lyrics ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Mic2 size={28} className="text-[#3f6b4e] mb-3 opacity-40" />
            <p className="text-xs text-[#3f6b4e]">No lyrics available for this track</p>
            <p className="text-[10px] text-[#3f6b4e]/60 mt-1">Artists can add lyrics in their studio</p>
          </div>
        ) : isLrc ? (
          lrcLines.map((line, i) => (
            <div
              key={i}
              ref={i === activeLine ? activeRef : null}
              className={`text-sm leading-relaxed transition-all duration-300 px-1 py-0.5 rounded
                ${i === activeLine
                  ? 'text-[#3dba6f] font-semibold scale-105 origin-left'
                  : i < activeLine
                    ? 'text-[#3f6b4e]'
                    : 'text-[#7aaa8a]'}`}
            >
              {line.text}
            </div>
          ))
        ) : (
          // Plain text — just render lines
          track.lyrics.split('\n').map((line, i) => (
            <p key={i} className={`text-sm leading-relaxed ${line === '' ? 'h-3' : 'text-[#7aaa8a]'}`}>
              {line}
            </p>
          ))
        )}
      </div>

      {/* LRC badge */}
      {isLrc && (
        <div className="px-4 py-2 border-t border-[#3dba6f]/10 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3dba6f] animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-[#3f6b4e]">Synced lyrics</span>
        </div>
      )}
    </div>
  )
}

// ─── Queue Panel ──────────────────────────────────────────────────────────────

function QueuePanel({
  queue,
  currentTrack,
  onClose,
  onRemove,
  onPlay,
}: {
  queue: Track[]
  currentTrack: Track | null
  onClose: () => void
  onRemove: (i: number) => void
  onPlay: (i: number) => void
}) {
  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#3dba6f]/10">
        <div className="flex items-center gap-2">
          <ListMusic size={13} className="text-[#3dba6f]" />
          <p className="text-xs font-medium">Queue</p>
          {queue.length > 0 && (
            <span className="text-[9px] bg-[#3dba6f]/15 text-[#3dba6f] px-1.5 py-0.5 rounded-full border border-[#3dba6f]/20">
              {queue.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-[#3f6b4e] hover:text-[#e8f5ec] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Now playing */}
      {currentTrack && (
        <div className="px-4 py-2.5 border-b border-[#3dba6f]/10">
          <p className="text-[9px] uppercase tracking-widest text-[#3f6b4e] mb-2">Now Playing</p>
          <div className="flex items-center gap-2.5">
            <img src={coverSrc(currentTrack)} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#3dba6f] truncate">{currentTrack.title}</p>
              <p className="text-[10px] text-[#7aaa8a] truncate">{currentTrack.artist}</p>
            </div>
          </div>
        </div>
      )}

      {/* Queue list */}
      <div className="h-64 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <ListMusic size={28} className="text-[#3f6b4e] mb-3 opacity-40" />
            <p className="text-xs text-[#3f6b4e]">Queue is empty</p>
            <p className="text-[10px] text-[#3f6b4e]/60 mt-1">Right-click a track to add it</p>
          </div>
        ) : (
          <div className="py-1">
            {queue.map((track, i) => (
              <div
                key={`${track.id}-${i}`}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#162b1e] group transition-colors"
              >
                <GripVertical size={12} className="text-[#3f6b4e] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <img src={coverSrc(track)} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(i)}>
                  <p className="text-xs font-medium truncate group-hover:text-[#3dba6f] transition-colors">{track.title}</p>
                  <p className="text-[10px] text-[#7aaa8a] truncate">{track.artist}</p>
                </div>
                <span className="text-[9px] text-[#3f6b4e] font-mono flex-shrink-0">{fmt(track.duration)}</span>
                <button
                  onClick={() => onRemove(i)}
                  className="text-[#3f6b4e] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PlaybackBar ──────────────────────────────────────────────────────────────

export default function PlaybackBar({
  currentTrack,
  isPlaying,
  isShuffle,
  isRepeat,
  volume,
  currentTime,
  duration,
  likedTracks,
  queue,
  showQueue,
  showLyrics,
  onTogglePlay,
  onSkipNext,
  onSkipPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onSeek,
  onVolumeChange,
  onToggleLike,
  onToggleQueue,
  onToggleLyrics,
  onRemoveFromQueue,
  onPlayFromQueue,
}: PlaybackBarProps) {
  const isLiked = currentTrack ? likedTracks.has(currentTrack.id) : false
  const hasLyrics = !!currentTrack?.lyrics

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const v = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    onVolumeChange(Math.min(100, Math.max(0, v)))
  }

  return (
    <footer className="relative h-24 bg-[#0d1f12]/90 backdrop-blur-2xl border-t border-[#3dba6f]/10 px-6 flex items-center justify-between z-50 flex-shrink-0">

      {/* ── Left: track info ── */}
      <div className="flex items-center gap-3 w-[30%] min-w-0">
        <div className="w-13 h-13 w-12 h-12 bg-[#162b1e] rounded-xl border border-[#3dba6f]/10 flex-shrink-0 overflow-hidden">
          <img
            src={coverSrc(currentTrack || { id: 'default', title: '', artist: '', duration: 0, url: '' })}
            alt="cover"
            className="w-full h-full object-cover opacity-70"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{currentTrack?.title || 'No track selected'}</p>
          <p className="text-[10px] text-[#7aaa8a] truncate">{currentTrack?.artist || '—'}</p>
        </div>
        <button
          onClick={() => currentTrack && onToggleLike(currentTrack.id)}
          disabled={!currentTrack}
          className={`flex-shrink-0 transition-colors ${isLiked ? 'text-[#3dba6f]' : 'text-[#3f6b4e] hover:text-[#3dba6f]'} disabled:opacity-30`}
        >
          <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ── Center: controls + progress ── */}
      <div className="flex flex-col items-center gap-2 w-[40%]">
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleShuffle}
            className={`transition-colors ${isShuffle ? 'text-[#3dba6f]' : 'text-[#3f6b4e] hover:text-[#7aaa8a]'}`}
          >
            <Shuffle size={15} />
          </button>
          <button onClick={onSkipPrevious} className="text-[#e8f5ec] hover:scale-110 transition-transform">
            <SkipBack size={19} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 bg-[#e8f5ec] text-[#0b1810] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying
              ? <Pause size={17} fill="currentColor" />
              : <Play  size={17} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={onSkipNext} className="text-[#e8f5ec] hover:scale-110 transition-transform">
            <SkipForward size={19} fill="currentColor" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={`transition-colors ${isRepeat ? 'text-[#3dba6f]' : 'text-[#3f6b4e] hover:text-[#7aaa8a]'}`}
          >
            <Repeat size={15} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5 w-full max-w-sm">
          <span className="text-[10px] text-[#3f6b4e] font-mono w-7 text-right">{fmt(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-[#162b1e] rounded-full relative group cursor-pointer"
            onClick={onSeek}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#3dba6f] rounded-full group-hover:bg-[#4fd080] transition-colors"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-[-4px] top-[-3px] w-2.5 h-2.5 bg-[#e8f5ec] rounded-full opacity-0 group-hover:opacity-100 shadow-md" />
            </div>
          </div>
          <span className="text-[10px] text-[#3f6b4e] font-mono w-7">{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Right: lyrics, queue, volume ── */}
      <div className="flex items-center justify-end gap-3 w-[30%]">

        {/* Lyrics toggle */}
        <div className="relative">
          <button
            onClick={onToggleLyrics}
            disabled={!currentTrack}
            title={hasLyrics ? 'Lyrics' : 'No lyrics available'}
            className={`transition-colors disabled:opacity-30 ${
              showLyrics
                ? 'text-[#3dba6f]'
                : hasLyrics
                  ? 'text-[#7aaa8a] hover:text-[#3dba6f]'
                  : 'text-[#3f6b4e]'
            }`}
          >
            <Mic2 size={15} />
          </button>
          {showLyrics && currentTrack && (
            <LyricsPanel
              track={currentTrack}
              currentTime={currentTime}
              onClose={onToggleLyrics}
            />
          )}
        </div>

        {/* Queue toggle */}
        <div className="relative">
          <button
            onClick={onToggleQueue}
            className={`transition-colors relative ${showQueue ? 'text-[#3dba6f]' : 'text-[#3f6b4e] hover:text-[#7aaa8a]'}`}
          >
            <ListMusic size={15} />
            {queue.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#3dba6f] text-[#0b1810] rounded-full text-[7px] font-bold flex items-center justify-center">
                {queue.length > 9 ? '9+' : queue.length}
              </span>
            )}
          </button>
          {showQueue && (
            <QueuePanel
              queue={queue}
              currentTrack={currentTrack}
              onClose={onToggleQueue}
              onRemove={onRemoveFromQueue}
              onPlay={onPlayFromQueue}
            />
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-[#3f6b4e] flex-shrink-0" />
          <div
            className="w-20 h-1 bg-[#162b1e] rounded-full relative cursor-pointer group"
            onClick={handleVolumeClick}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#7aaa8a] rounded-full group-hover:bg-[#3dba6f] transition-colors"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}