"use client"

import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, Mic2, ListMusic, Heart } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  duration: number
  url: string
  cover_url?: string
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
  onTogglePlay: () => void
  onSkipNext: () => void
  onSkipPrevious: () => void
  onToggleShuffle: () => void
  onToggleRepeat: () => void
  onSeek: (e: React.MouseEvent<HTMLDivElement>) => void
  onVolumeChange: (volume: number) => void
  onToggleLike: (trackId: string) => void
}

export default function PlaybackBar({
  currentTrack,
  isPlaying,
  isShuffle,
  isRepeat,
  volume,
  currentTime,
  duration,
  likedTracks,
  onTogglePlay,
  onSkipNext,
  onSkipPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onSeek,
  onVolumeChange,
  onToggleLike,
}: PlaybackBarProps) {
  const isLiked = currentTrack ? likedTracks.has(currentTrack.id) : false

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const newVolume = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    onVolumeChange(Math.min(100, Math.max(0, newVolume)))
  }

  const handleLikeClick = () => {
    if (currentTrack) onToggleLike(currentTrack.id)
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-[#0d2010]/80 backdrop-blur-2xl border-t border-[#4ade80]/10 px-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-4 w-[30%]">
        <div className="w-14 h-14 bg-[#1a3a20] rounded-lg border border-[#4ade80]/10 flex-shrink-0 relative group overflow-hidden">
          <img
            src={
              currentTrack?.cover_url ||
              `https://api.dicebear.com/7.x/shapes/svg?seed=${currentTrack?.id || 'default'}&backgroundColor=1a3a20`
            }
            alt="cover"
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform"
          />
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 flex items-end justify-center gap-0.5 pb-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-[#4ade80] animate-pulse"
                  style={{ height: `${30 + i * 10}%`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold">{currentTrack?.title || 'No track selected'}</h4>
          <p className="text-[11px] text-[#a3b8a5]">{currentTrack?.artist || 'Unknown artist'}</p>
        </div>
        <button
          onClick={handleLikeClick}
          className={`ml-2 ${isLiked ? 'text-[#4ade80]' : 'text-[#6b8a6e] hover:text-[#4ade80]'} transition-colors`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 w-[40%]">
        <div className="flex items-center gap-6">
          <button
            onClick={onToggleShuffle}
            className={`${isShuffle ? 'text-[#4ade80]' : 'text-[#6b8a6e] hover:text-[#4ade80]'} transition-colors`}
          >
            <Shuffle size={18} />
          </button>
          <button onClick={onSkipPrevious} className="text-[#f0f7f0] hover:scale-110 transition-transform">
            <SkipBack size={22} fill="currentColor" />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-10 h-10 bg-[#f0f7f0] text-[#0a1a0f] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_15px_rgba(74,222,128,0.3)]"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ml-1" fill="currentColor" />}
          </button>
          <button onClick={onSkipNext} className="text-[#f0f7f0] hover:scale-110 transition-transform">
            <SkipForward size={22} fill="currentColor" />
          </button>
          <button
            onClick={onToggleRepeat}
            className={`${isRepeat ? 'text-[#4ade80]' : 'text-[#6b8a6e] hover:text-[#4ade80]'} transition-colors`}
          >
            <Repeat size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 w-full max-w-md">
          <span className="text-[10px] text-[#6b8a6e] font-mono">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-[#1a3a20] rounded-full relative group cursor-pointer"
            onClick={onSeek}
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#4ade80] rounded-full group-hover:bg-[#22c55e]"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-[-4px] top-[-3px] w-2.5 h-2.5 bg-[#f0f7f0] rounded-full opacity-0 group-hover:opacity-100 shadow-md" />
            </div>
          </div>
          <span className="text-[10px] text-[#6b8a6e] font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 w-[30%]">
        <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors">
          <Mic2 size={16} />
        </button>
        <button className="text-[#6b8a6e] hover:text-[#4ade80] transition-colors">
          <ListMusic size={16} />
        </button>
        <div className="flex items-center gap-2 w-28">
          <Volume2 size={16} className="text-[#6b8a6e]" />
          <div className="flex-1 h-1 bg-[#1a3a20] rounded-full relative cursor-pointer" onClick={handleVolumeClick}>
            <div className="absolute top-0 left-0 h-full bg-[#a3b8a5] rounded-full" style={{ width: `${volume}%` }} />
          </div>
        </div>
      </div>
    </footer>
  )
}

function formatTime(time: number) {
  if (!time || isNaN(time)) return '0:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
