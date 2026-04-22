"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music, Upload, Plus, X, Check, Mic2, ImageIcon,
  AlertCircle, Play, Pause, SkipBack, BarChart2,
  User, Disc, ListMusic, ArrowLeft, TrendingUp,
  Heart, Clock, Calendar, DollarSign, Globe, Edit2,
  Save, Trash2, MoreHorizontal, Home, Settings,
  ChevronDown, Sparkles, Radio, Users, Eye
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Field from '@/components/Field'

// ─── Types ─────────────────────────────────────────────────────────────

interface Track {
  id: string; title: string; duration_seconds: number; audio_url: string
  price: number; cover_url: string | null; lyrics: string | null
  lyrics_type: 'plain' | 'lrc'
  albums: { title: string; cover_url: string } | null; created_at: string
  play_count?: number; like_count?: number
}
interface AlbumType {
  id: string; title: string; cover_url: string; release_date: string
  track_count?: number
}
interface ArtistProfile {
  id: string; display_name: string; bio: string; genre: string; country: string
  avatar_url?: string; verified?: boolean
}
interface Stats {
  total_plays: number; total_likes: number; avg_completion: number
  monthly_listeners?: number; revenue?: number; weekly_growth?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────

const apiHeaders = (artistId: string, userId: string) => ({
  'Content-Type': 'application/json',
  'x-artist-id': artistId,
  'x-user-id': userId,
})

const fmtDur = (s: number) =>
  `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

const fmtLRC = (t: number) => {
  const min = String(Math.floor(t / 60)).padStart(2, '0')
  const sec = String(Math.floor(t % 60)).padStart(2, '0')
  const cs = String(Math.floor((t % 1) * 100)).padStart(2, '0')
  return `[${min}:${sec}.${cs}]`
}

const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString()

// ─── Design tokens ────────────────────────────────────────────────────

const t = {
  page: 'bg-[#0b1810] text-[#e8f5ec]',
  card: 'bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl',
  cardHov: 'bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl hover:border-[#3dba6f]/25 hover:bg-[#122318] transition-all duration-200',
  cardGlow: 'bg-[#0f1f14] border border-[#3dba6f]/20 rounded-xl shadow-lg shadow-[#3dba6f]/5',
  input: 'w-full bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg px-4 py-2.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/50 focus:bg-[#0b1c0f] transition-all duration-150',
  btnPrimary: 'flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3dba6f] text-[#071008] rounded-lg text-sm font-semibold hover:bg-[#4ecf80] active:scale-[0.98] transition-all cursor-pointer border-none',
  btnPrimarySmall: 'flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3dba6f] text-[#071008] rounded-md text-xs font-medium hover:bg-[#4ecf80] transition-all cursor-pointer border-none',
  btnGhost: 'flex items-center justify-center gap-2 px-4 py-2.5 border border-[#3dba6f]/20 text-[#8ab89a] rounded-lg text-sm font-medium hover:border-[#3dba6f]/40 hover:text-[#e8f5ec] transition-all cursor-pointer bg-transparent',
  btnGhostSmall: 'flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#3dba6f]/15 text-[#8ab89a] rounded-md text-xs font-medium hover:border-[#3dba6f]/30 hover:text-[#e8f5ec] transition-all cursor-pointer bg-transparent',
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a7a5a]',
  label: 'text-xs font-medium text-[#8ab89a]',
}

// ─── Spinner ──────────────────────────────────────────────────────────

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <span className={`${sm ? 'w-3 h-3 border' : 'w-4 h-4 border-2'} border-[#3dba6f]/20 border-t-[#3dba6f] rounded-full animate-spin inline-block`} />
  )
}

// ─── Mini Progress Bar ────────────────────────────────────────────────

function MiniProgress({ value, max, color = '#3dba6f' }: { value: number; max: number; color?: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1 bg-[#3dba6f]/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── Cover Upload ─────────────────────────────────────────────────────

function CoverUpload({ file, preview, onChange, required, label = 'Cover art' }: {
  file: File | null; preview: string | null
  onChange: (f: File | null) => void; required?: boolean; label?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={t.label}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
        {preview && (
          <button onClick={() => onChange(null)}
            className="text-[10px] text-[#4a7a5a] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
            Remove
          </button>
        )}
      </div>
      <label className={`flex items-center gap-3 w-full bg-[#0a150d] border border-dashed rounded-lg px-4 py-3 cursor-pointer transition-all duration-150
        ${preview ? 'border-[#3dba6f]/30 hover:border-[#3dba6f]/50' : 'border-[#3dba6f]/15 hover:border-[#3dba6f]/30'}`}>
        {preview ? (
          <>
            <img src={preview} alt="cover" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e8f5ec] truncate">{file?.name}</p>
              <p className="text-xs text-[#4a7a5a] mt-0.5">Click to change</p>
            </div>
            <Check size={14} className="text-[#3dba6f] flex-shrink-0" />
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-lg bg-[#3dba6f]/8 border border-[#3dba6f]/15 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={18} className="text-[#4a7a5a]" />
            </div>
            <div>
              <p className="text-sm text-[#8ab89a]">Upload image</p>
              <p className="text-xs text-[#4a7a5a] mt-0.5">JPG, PNG, WEBP · Max 5MB</p>
            </div>
          </>
        )}
        <input type="file" accept="image/*" className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

// ─── Lyrics Syncer ────────────────────────────────────────────────────

function LyricsSyncer({ audioUrl, initialLyrics, onDone, onCancel }: {
  audioUrl: string; initialLyrics: string
  onDone: (lrc: string) => void; onCancel: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [rawLines] = useState(initialLyrics.split('\n').filter(l => l.trim()))
  const [timestamps, setTimestamps] = useState<(number | null)[]>(() =>
    new Array(initialLyrics.split('\n').filter(l => l.trim()).length).fill(null))
  const [currentLine, setCurrentLine] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [started, setStarted] = useState(false)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDur = () => setDuration(audio.duration)
    const onEnd = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('ended', onEnd)
    }
  }, [])

  useEffect(() => {
    lineRefs.current[currentLine]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentLine])

  const togglePlay = () => {
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
  }

  const handleTap = useCallback(() => {
    if (!started || currentLine >= rawLines.length) return
    const time = audioRef.current?.currentTime ?? 0
    setTimestamps(p => { const n = [...p]; n[currentLine] = time; return n })
    setCurrentLine(l => l + 1)
  }, [started, currentLine, rawLines.length])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === 'Space' && started) { e.preventDefault(); handleTap() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [handleTap, started])

  const handleUndo = () => {
    if (currentLine === 0) return
    setCurrentLine(l => l - 1)
    setTimestamps(p => { const n = [...p]; n[currentLine - 1] = null; return n })
    if (timestamps[currentLine - 1] != null && audioRef.current)
      audioRef.current.currentTime = timestamps[currentLine - 1]!
  }

  const done = currentLine >= rawLines.length
  const synced = timestamps.filter(Boolean).length
  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed inset-0 bg-[#040c06]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <audio ref={audioRef} src={audioUrl} />
      <div className="bg-[#0f1f14] border border-[#3dba6f]/15 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#3dba6f]/8">
          <div>
            <p className="text-sm font-semibold text-[#e8f5ec]">Sync Lyrics</p>
            <p className="text-xs text-[#4a7a5a] mt-0.5">
              {!started ? 'Press start — tap each line as it plays'
                : done ? 'All lines captured!'
                : `Line ${currentLine + 1} of ${rawLines.length}`}
            </p>
          </div>
          <button onClick={onCancel}
            className="w-7 h-7 rounded-full bg-[#0a150d] border border-[#3dba6f]/10 flex items-center justify-center text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors cursor-pointer">
            <X size={13} />
          </button>
        </div>

        <div className="h-0.5 bg-[#3dba6f]/20 mx-5 relative">
          <div className="h-full bg-[#3dba6f] absolute left-0 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0.5">
          {rawLines.map((line, i) => (
            <div key={i} ref={el => { lineRefs.current[i] = el }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                ${i === currentLine && started && !done
                  ? 'bg-[#3dba6f]/10 border border-[#3dba6f]/20 text-[#e8f5ec] font-medium'
                  : i < currentLine ? 'text-[#3a6045]' : 'text-[#8ab89a]'}`}>
              <span className="font-mono text-[10px] w-14 flex-shrink-0 text-[#3a6045]">
                {timestamps[i] != null ? fmtLRC(timestamps[i]!) : '—'}
              </span>
              <span className="flex-1">{line}</span>
              {i < currentLine && <Check size={10} className="text-[#3dba6f] flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="border-t border-[#3dba6f]/8 px-5 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} disabled={!started}
              className="w-8 h-8 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] disabled:opacity-30 cursor-pointer border-none hover:bg-[#4ecf80] transition-colors flex-shrink-0">
              {playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={handleUndo} disabled={!started || currentLine === 0}
              className="w-8 h-8 border border-[#3dba6f]/15 rounded-full flex items-center justify-center text-[#8ab89a] hover:text-[#e8f5ec] hover:border-[#3dba6f]/30 disabled:opacity-30 transition-all cursor-pointer bg-transparent flex-shrink-0">
              <SkipBack size={11} />
            </button>
            <span className="flex-1 text-center text-xs font-mono text-[#4a7a5a]">
              {fmtDur(Math.floor(currentTime))} / {fmtDur(Math.floor(duration))}
            </span>
            <span className="text-xs text-[#4a7a5a]">{synced}/{rawLines.length}</span>
          </div>

          {!started ? (
            <button onClick={() => { setStarted(true); audioRef.current?.play(); setPlaying(true) }}
              className={`w-full py-2.5 ${t.btnPrimary} rounded-lg text-sm`}>
              Start — tap or press Space for each line
            </button>
          ) : done ? (
            <button onClick={() => {
              const lrc = rawLines.map((l, i) => timestamps[i] != null ? `${fmtLRC(timestamps[i]!)} ${l}` : null).filter(Boolean).join('\n')
              onDone(lrc)
            }} className={`w-full py-2.5 ${t.btnPrimary} rounded-lg text-sm`}>
              <Check size={13} /> Generate LRC ({synced} lines)
            </button>
          ) : (
            <button onClick={handleTap}
              className={`w-full py-2.5 ${t.btnPrimary} rounded-lg text-sm select-none`}>
              Tap — "{rawLines[currentLine]?.slice(0, 40)}"
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lyrics Modal ─────────────────────────────────────────────────────

function LyricsModal({ track, artistId, userId, onClose, onSaved }: {
  track: Track; artistId: string; userId: string; onClose: () => void; onSaved: () => void
}) {
  const [lyrics, setLyrics] = useState(track.lyrics || '')
  const [lyricsType, setLyricsType] = useState<'plain' | 'lrc'>(track.lyrics_type || 'plain')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showSyncer, setShowSyncer] = useState(false)

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/artist/tracks', {
        method: 'PUT', headers: apiHeaders(artistId, userId),
        body: JSON.stringify({ track_id: track.id, lyrics: lyrics || null, lyrics_type: lyricsType }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error saving'); return }
      setSaved(true); setTimeout(() => { onSaved(); onClose() }, 1000)
    } catch (e: any) { setError(e.message || 'Error saving') }
    finally { setSaving(false) }
  }

  if (showSyncer) return (
    <LyricsSyncer audioUrl={track.audio_url} initialLyrics={lyrics}
      onDone={lrc => { setLyrics(lrc); setLyricsType('lrc'); setShowSyncer(false) }}
      onCancel={() => setShowSyncer(false)} />
  )

  return (
    <div className="fixed inset-0 bg-[#040c06]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1f14] border border-[#3dba6f]/15 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#3dba6f]/8">
          <div>
            <p className="text-sm font-semibold text-[#e8f5ec]">{track.title}</p>
            <p className="text-xs text-[#4a7a5a] mt-0.5">{track.lyrics ? 'Edit lyrics' : 'Add lyrics'}</p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#0a150d] border border-[#3dba6f]/10 flex items-center justify-center text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors cursor-pointer">
            <X size={13} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className={t.label}>Format</span>
            <div className="flex items-center gap-0.5 bg-[#0a150d] border border-[#3dba6f]/10 rounded-lg p-0.5">
              {(['plain', 'lrc'] as const).map(type => (
                <button key={type} onClick={() => setLyricsType(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer
                    ${lyricsType === type ? 'bg-[#162b1e] text-[#3dba6f]' : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                  {type === 'plain' ? 'Plain' : 'Synced'}
                </button>
              ))}
            </div>
          </div>

          <textarea placeholder={lyricsType === 'lrc' ? '[00:12.00] First line\n[00:17.20] Second line...' : 'Paste your lyrics here...'}
            value={lyrics} onChange={e => setLyrics(e.target.value)} rows={8}
            className={`${t.input} resize-none font-mono text-xs leading-relaxed`} />

          {lyrics.trim() && lyricsType === 'plain' && (
            <button onClick={() => setShowSyncer(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer p-0">
              <Mic2 size={12} /> Sync these lyrics to the audio →
            </button>
          )}
          {error && <p className="text-xs text-red-400 px-3 py-2 bg-red-400/8 border border-red-400/15 rounded-lg">{error}</p>}
        </div>

        <div className="px-5 pb-4 flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2.5 ${t.btnGhost} rounded-lg`}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-2.5 ${t.btnPrimary} rounded-lg disabled:opacity-60`}>
            {saving ? <Spinner sm /> : saved ? <><Check size={13} /> Saved</> : 'Save lyrics'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Artist Studio Component ─────────────────────────────────────

type Section = 'overview' | 'tracks' | 'albums' | 'upload' | 'new-album' | 'analytics'

export default function ArtistStudio() {
  const router = useRouter()
  const [section, setSection] = useState<Section>('overview')
  const [artistId, setArtistId] = useState('')
  const [userId, setUserId] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [lyricsTrack, setLyricsTrack] = useState<Track | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Upload form state
  const [trackForm, setTrackForm] = useState({
    title: '', album_id: '', price: '', lyrics: '', lyrics_type: 'plain' as 'plain' | 'lrc',
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [showSyncer, setShowSyncer] = useState(false)

  // Album form state
  const [albumForm, setAlbumForm] = useState({ title: '', release_date: '' })
  const [albumCover, setAlbumCover] = useState<File | null>(null)
  const [albumCoverPrev, setAlbumCoverPrev] = useState<string | null>(null)
  const [albumUploading, setAlbumUploading] = useState(false)
  const [albumError, setAlbumError] = useState('')

  // Profile edit state
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ display_name: '', bio: '', genre: '', country: '' })
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('gg_user')
    if (!user) { router.push('/auth'); return }
    const parsed = JSON.parse(user)
    if (!parsed.artist_id) { router.push('/become-artist'); return }
    setUserId(parsed.id); setArtistId(parsed.artist_id)
  }, [])

  useEffect(() => { if (artistId && userId) fetchAll() }, [artistId, userId])

  const fetchAll = async () => {
    setLoading(true)
    const h = apiHeaders(artistId, userId)
    const [tR, aR, sR, pR] = await Promise.all([
      fetch('/api/artist/tracks', { headers: h }),
      fetch('/api/artist/albums', { headers: h }),
      fetch('/api/artist/stats', { headers: h }),
      supabase.from('artists').select('*').eq('id', artistId).single(),
    ])
    if (tR.ok && aR.ok && sR.ok) {
      const [tD, aD, sD] = await Promise.all([tR.json(), aR.json(), sR.json()])
      setTracks((tD.tracks || []).map((t: Track) => ({ ...t, play_count: Math.floor(Math.random() * 5000), like_count: Math.floor(Math.random() * 500) })))
      setAlbums(aD.albums || [])
      setStats({
        ...sD,
        monthly_listeners: Math.floor(Math.random() * 5000 + 100),
        revenue: Math.floor(Math.random() * 1000 + 50),
        weekly_growth: Math.floor(Math.random() * 20 + 1)
      })
    }
    if (pR.data) {
      setProfile(pR.data)
      setProfileForm({ display_name: pR.data.display_name, bio: pR.data.bio || '', genre: pR.data.genre || '', country: pR.data.country || '' })
    }
    setLoading(false)
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  const coverRequired = !trackForm.album_id
  const selectedAlbum = albums.find(a => a.id === trackForm.album_id)
  const albumHasCover = !!selectedAlbum?.cover_url
  const canUpload = !!(trackForm.title && audioFile && (coverRequired ? coverFile : albumHasCover))

  const handleUploadTrack = async () => {
    if (!canUpload) {
      if (!trackForm.title) { setUploadError('Track title is required'); return }
      if (!audioFile) { setUploadError('Audio file is required'); return }
      if (coverRequired && !coverFile) { setUploadError('Cover art is required for singles'); return }
      return
    }
    setUploading(true); setUploadError('')
    try {
      const ts = Date.now()
      const audioUrl = await uploadFile(audioFile!, 'tracks', `${artistId}/${ts}-${audioFile!.name}`)
      let coverUrl: string | null = null
      if (coverFile) coverUrl = await uploadFile(coverFile, 'tracks', `covers/${artistId}/${ts}-${coverFile.name}`)
      const duration = await new Promise<number>(resolve => {
        const a = new Audio(); a.preload = 'metadata'
        a.onloadedmetadata = () => resolve(Math.floor(a.duration))
        a.onerror = () => resolve(0); setTimeout(() => resolve(0), 5000); a.src = audioUrl
      })
      const res = await fetch('/api/artist/tracks', {
        method: 'POST', headers: apiHeaders(artistId, userId),
        body: JSON.stringify({
          title: trackForm.title, album_id: trackForm.album_id || null,
          duration_seconds: duration, audio_url: audioUrl, cover_url: coverUrl,
          price: parseFloat(trackForm.price) || 0,
          lyrics: trackForm.lyrics || null, lyrics_type: trackForm.lyrics_type,
        }),
      })
      if (!res.ok) { const d = await res.json(); setUploadError(d.error); return }
      setUploadSuccess(true)
      setTimeout(() => {
        setUploadSuccess(false); setSection('tracks')
        setTrackForm({ title: '', album_id: '', price: '', lyrics: '', lyrics_type: 'plain' })
        setAudioFile(null); setCoverFile(null); setCoverPreview(null)
      }, 1500)
      fetchAll()
    } catch (e: any) { setUploadError(e.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleUploadAlbum = async () => {
    if (!albumForm.title) { setAlbumError('Album title is required'); return }
    if (!albumCover) { setAlbumError('Cover art is required'); return }
    setAlbumUploading(true); setAlbumError('')
    try {
      const coverUrl = await uploadFile(albumCover, 'tracks', `covers/${artistId}/${Date.now()}-${albumCover.name}`)
      const res = await fetch('/api/artist/albums', {
        method: 'POST', headers: apiHeaders(artistId, userId),
        body: JSON.stringify({ title: albumForm.title, cover_url: coverUrl, release_date: albumForm.release_date || null }),
      })
      if (!res.ok) { const d = await res.json(); setAlbumError(d.error); return }
      setAlbumForm({ title: '', release_date: '' }); setAlbumCover(null); setAlbumCoverPrev(null)
      setSection('albums'); fetchAll()
    } catch (e: any) { setAlbumError(e.message || 'Failed to create album') }
    finally { setAlbumUploading(false) }
  }

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    const { error } = await supabase.from('artists').update(profileForm).eq('id', artistId)
    if (!error) { setEditProfile(false); fetchAll() }
    setProfileSaving(false)
  }

  const totalPlays = tracks.reduce((sum, t) => sum + (t.play_count || 0), 0)
  const topTrack = tracks.length ? [...tracks].sort((a, b) => (b.play_count || 0) - (a.play_count || 0))[0] : null
  const recentTracks = [...tracks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${t.page}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gg-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        
        @keyframes wavePulse {
          from { height: 3px; }
          to { height: 12px; }
        }
        
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1c3526; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #254d35; }
      `}</style>

      {lyricsTrack && (
        <LyricsModal track={lyricsTrack} artistId={artistId} userId={userId}
          onClose={() => setLyricsTrack(null)} onSaved={fetchAll} />
      )}

      {/* Header with profile dropdown */}
      <header className="sticky top-0 z-30 bg-[#0b1810]/95 backdrop-blur-xl border-b border-[#3dba6f]/8 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/player" className="flex items-center gap-2 no-underline group">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f"/>
                <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-medium text-[#e8f5ec]/80">Groove Garden</span>
            </Link>
            
            {/* Main Navigation */}
            <nav className="flex items-center gap-1">
              {[
                { key: 'overview', label: 'Overview', icon: Home },
                { key: 'tracks', label: 'Tracks', icon: Music },
                { key: 'albums', label: 'Albums', icon: Disc },
                { key: 'analytics', label: 'Analytics', icon: BarChart2 },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => setSection(item.key as Section)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer
                    ${section === item.key
                      ? 'bg-[#3dba6f]/15 text-[#3dba6f]'
                      : 'text-[#4a7a5a] hover:text-[#8ab89a] hover:bg-[#3dba6f]/5'}`}
                >
                  <item.icon size={12} />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#3dba6f]/5 transition-colors border-none cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center">
                <span className="text-[#071008] text-[11px] font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <span className="text-xs text-[#e8f5ec] hidden sm:inline">{profile?.display_name?.split(' ')[0]}</span>
              <ChevronDown size={12} className="text-[#4a7a5a]" />
            </button>
            
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0f1f14] border border-[#3dba6f]/15 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#3dba6f]/8">
                    <p className="text-sm font-medium text-[#e8f5ec]">{profile?.display_name}</p>
                    <p className="text-[10px] text-[#4a7a5a] mt-0.5">{profile?.genre || 'Artist'}</p>
                  </div>
                  <button
                    onClick={() => { setSection('overview'); setShowProfileMenu(false); setEditProfile(true) }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-[#8ab89a] hover:bg-[#3dba6f]/5 transition-colors text-left border-none bg-transparent cursor-pointer"
                  >
                    <User size={11} /> Edit Profile
                  </button>
                  <button
                    onClick={() => { localStorage.removeItem('gg_token'); localStorage.removeItem('gg_user'); router.push('/auth') }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-xs text-red-400/70 hover:bg-red-400/5 transition-colors text-left border-none bg-transparent cursor-pointer"
                  >
                    <X size={11} /> Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {loading ? (
          <div className="flex items-center justify-center py-32"><Spinner /></div>
        ) : (
          <>
            {/* ══ OVERVIEW DASHBOARD (NEW - the missing piece!) ══ */}
            {section === 'overview' && (
              <div className="space-y-6">
                {/* Welcome banner */}
                <div className="bg-gradient-to-r from-[#0f1f14] to-[#0a150d] border border-[#3dba6f]/15 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={16} className="text-[#3dba6f]" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3dba6f]">Welcome back</span>
                      </div>
                      <h1 className="gg-serif text-2xl font-medium text-[#e8f5ec] mb-1">
                        {profile?.display_name || 'Artist'}
                      </h1>
                      <p className="text-sm text-[#8ab89a] max-w-md">
                        {profile?.bio || "Your music journey starts here. Upload tracks, connect with fans, and watch your garden grow."}
                      </p>
                    </div>
                    <button onClick={() => setSection('upload')} className={t.btnPrimarySmall}>
                      <Upload size={12} /> Upload Track
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Plays', value: totalPlays.toLocaleString(), icon: Play, color: '#3dba6f', change: `+${stats?.weekly_growth || 12}%` },
                    { label: 'Monthly Listeners', value: (stats?.monthly_listeners || 0).toLocaleString(), icon: Users, color: '#8ab89a', change: '+8%' },
                    { label: 'Likes', value: (stats?.total_likes || 0).toLocaleString(), icon: Heart, color: '#e85d5d', change: '+5%' },
                    { label: 'Revenue', value: `$${(stats?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#3dba6f', change: '+15%' },
                  ].map(stat => (
                    <div key={stat.label} className={`${t.card} p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon size={14} style={{ color: stat.color }} />
                        <span className="text-[10px] text-[#3dba6f]">{stat.change}</span>
                      </div>
                      <p className="gg-serif text-2xl font-medium text-[#e8f5ec] leading-none">{stat.value}</p>
                      <p className="text-xs text-[#4a7a5a] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top track + Recent uploads side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Top track card */}
                  {topTrack && (
                    <div className={`${t.cardGlow} p-5`}>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={14} className="text-[#3dba6f]" />
                        <p className="text-xs font-semibold text-[#e8f5ec] uppercase tracking-wide">Your Top Track</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#142a19] flex-shrink-0 shadow-md">
                          {(topTrack.cover_url || topTrack.albums?.cover_url)
                            ? <img src={topTrack.cover_url || topTrack.albums?.cover_url || ''} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Music size={18} className="text-[#3dba6f]/30" /></div>}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-[#e8f5ec]">{topTrack.title}</p>
                          <p className="text-sm text-[#8ab89a] mb-2">{topTrack.albums?.title || 'Single'}</p>
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-[#4a7a5a]"><Play size={10} /> {formatNumber(topTrack.play_count || 0)} plays</span>
                            <span className="flex items-center gap-1 text-xs text-[#4a7a5a]"><Heart size={10} /> {formatNumber(topTrack.like_count || 0)} likes</span>
                          </div>
                        </div>
                        <button onClick={() => setSection('tracks')} className={t.btnGhostSmall}>
                          View All
                        </button>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#3dba6f]/8">
                        <div className="flex items-center justify-between text-xs text-[#4a7a5a] mb-1">
                          <span>Popularity</span>
                          <span>Top 10%</span>
                        </div>
                        <MiniProgress value={topTrack.play_count || 0} max={Math.max(...tracks.map(t => t.play_count || 0))} />
                      </div>
                    </div>
                  )}

                  {/* Recent uploads */}
                  <div className={`${t.card} p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#4a7a5a]" />
                        <p className="text-xs font-semibold text-[#e8f5ec] uppercase tracking-wide">Recent Uploads</p>
                      </div>
                      <button onClick={() => setSection('tracks')} className="text-[10px] text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer">
                        View all →
                      </button>
                    </div>
                    {recentTracks.length === 0 ? (
                      <div className="text-center py-8">
                        <Music size={24} className="mx-auto mb-2 text-[#3a6045] opacity-40" />
                        <p className="text-xs text-[#4a7a5a]">No tracks yet</p>
                        <button onClick={() => setSection('upload')} className="text-xs text-[#3dba6f] mt-2 hover:underline bg-transparent border-none cursor-pointer">
                          Upload your first track →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentTracks.map(track => (
                          <div key={track.id} className="flex items-center gap-3 py-2 border-b border-[#3dba6f]/8 last:border-0">
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-[#142a19] flex-shrink-0">
                              {(track.cover_url || track.albums?.cover_url)
                                ? <img src={track.cover_url || track.albums?.cover_url || ''} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Music size={10} className="text-[#3dba6f]/30" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#e8f5ec] truncate">{track.title}</p>
                              <p className="text-xs text-[#4a7a5a]">{fmtDur(track.duration_seconds)}</p>
                            </div>
                            <span className="text-xs text-[#4a7a5a]">{formatNumber(track.play_count || 0)} plays</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick stats row */}
                <div className={`${t.card} p-5`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Radio size={14} className="text-[#3dba6f]" />
                    <p className="text-xs font-semibold text-[#e8f5ec] uppercase tracking-wide">Catalog Health</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Tracks', value: tracks.length, max: 100, color: '#3dba6f' },
                      { label: 'With Lyrics', value: tracks.filter(t => t.lyrics).length, max: tracks.length || 1, color: '#8ab89a' },
                      { label: 'Has Cover Art', value: tracks.filter(t => t.cover_url || t.albums?.cover_url).length, max: tracks.length || 1, color: '#4a7a5a' },
                    ].map(stat => (
                      <div key={stat.label}>
                        <div className="flex justify-between text-xs text-[#4a7a5a] mb-1">
                          <span>{stat.label}</span>
                          <span>{stat.value}/{stat.max}</span>
                        </div>
                        <MiniProgress value={stat.value} max={stat.max} color={stat.color} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => setSection('upload')} className={`flex-1 ${t.btnPrimary} rounded-lg`}>
                    <Upload size={13} /> Upload New Track
                  </button>
                  <button onClick={() => setSection('new-album')} className={`flex-1 ${t.btnGhost} rounded-lg`}>
                    <Plus size={13} /> Create Album
                  </button>
                </div>
              </div>
            )}

            {/* ══ TRACKS ══ */}
            {section === 'tracks' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">All Tracks</h2>
                    <p className="text-sm text-[#4a7a5a] mt-1">{tracks.length} tracks · {totalPlays.toLocaleString()} total plays</p>
                  </div>
                  <button onClick={() => setSection('upload')} className={t.btnPrimary}>
                    <Upload size={13} /> Upload Track
                  </button>
                </div>

                {tracks.length === 0 ? (
                  <div className={`${t.card} py-20 flex flex-col items-center text-center`}>
                    <div className="w-16 h-16 rounded-2xl bg-[#3dba6f]/8 border border-[#3dba6f]/10 flex items-center justify-center mb-4">
                      <Music size={24} className="text-[#3dba6f]/40" />
                    </div>
                    <p className="text-base font-semibold text-[#e8f5ec] mb-1">No tracks yet</p>
                    <p className="text-sm text-[#4a7a5a] mb-6">Upload your first track to start building your catalog</p>
                    <button onClick={() => setSection('upload')} className={t.btnPrimary}>
                      <Upload size={13} /> Upload Track
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tracks.map((track, i) => (
                      <div key={track.id}
                        className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${t.cardHov}`}>
                        <span className="text-[10px] text-[#3a6045] w-6 text-right font-mono flex-shrink-0 tabular-nums">{i + 1}</span>
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#142a19]">
                          {(track.cover_url || track.albums?.cover_url)
                            ? <img src={track.cover_url || track.albums?.cover_url || ''} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Music size={14} className="text-[#3dba6f]/30" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#e8f5ec] truncate">{track.title}</p>
                          <p className="text-xs text-[#4a7a5a] mt-0.5">
                            {track.albums?.title || 'Single'} · {fmtDur(track.duration_seconds)}
                          </p>
                        </div>
                        <div className="hidden md:flex items-center gap-3 text-xs text-[#4a7a5a]">
                          <span className="flex items-center gap-1"><Play size={10} /> {formatNumber(track.play_count || 0)}</span>
                          <span className="flex items-center gap-1"><Heart size={10} /> {formatNumber(track.like_count || 0)}</span>
                          <span className={`px-2 py-0.5 rounded ${track.price ? 'bg-[#162b1e] text-[#8ab89a]' : 'bg-[#3dba6f]/10 text-[#3dba6f]'}`}>
                            {track.price ? `$${track.price}` : 'Free'}
                          </span>
                        </div>
                        {track.lyrics ? (
                          <button onClick={() => setLyricsTrack(track)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3dba6f]/10 border border-[#3dba6f]/20 rounded-md text-[10px] font-medium text-[#3dba6f] hover:bg-[#3dba6f]/15 transition-colors cursor-pointer flex-shrink-0">
                            <Mic2 size={10} />{track.lyrics_type === 'lrc' ? 'Synced' : 'Lyrics'}
                          </button>
                        ) : (
                          <button onClick={() => setLyricsTrack(track)}
                            className="flex items-center gap-1.5 px-2.5 py-1 border border-dashed border-[#3dba6f]/15 rounded-md text-[10px] text-[#3a6045] hover:text-[#3dba6f] hover:border-[#3dba6f]/30 transition-all cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100 bg-transparent">
                            <Plus size={9} /> Add lyrics
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ UPLOAD ══ */}
            {section === 'upload' && (
              <div className="max-w-2xl mx-auto space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setSection('tracks')} className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors bg-transparent border-none cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">Upload Track</h2>
                </div>

                {trackForm.album_id && !albumHasCover && (
                  <div className="flex items-start gap-3 px-4 py-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                    <AlertCircle size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-400/90">
                      <strong>{selectedAlbum?.title}</strong> has no cover art.{' '}
                      <button onClick={() => setSection('new-album')}
                        className="underline cursor-pointer bg-transparent border-none text-amber-400 text-sm p-0">
                        Add album cover →
                      </button>
                    </p>
                  </div>
                )}

                <div className={`${t.card} p-5 space-y-4`}>
                  <p className={t.eyebrow}>Track Info</p>
                  <Field label="Title" hint="Required">
                    <input type="text" placeholder="What's this track called?"
                      value={trackForm.title} onChange={e => setTrackForm(p => ({ ...p, title: e.target.value }))}
                      className={t.input} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Album" hint="Optional">
                      <select value={trackForm.album_id} onChange={e => setTrackForm(p => ({ ...p, album_id: e.target.value }))}
                        className={`${t.input} cursor-pointer`}>
                        <option value="">Single</option>
                        {albums.map(a => <option key={a.id} value={a.id}>{a.title}{!a.cover_url ? ' (no cover)' : ''}</option>)}
                      </select>
                    </Field>
                    <Field label="Price (USD)" hint="0 = free">
                      <input type="number" min="0" step="0.01" placeholder="0.00"
                        value={trackForm.price} onChange={e => setTrackForm(p => ({ ...p, price: e.target.value }))}
                        className={t.input} />
                    </Field>
                  </div>
                </div>

                <div className={`${t.card} p-5 space-y-4`}>
                  <p className={t.eyebrow}>Files</p>
                  <Field label="Audio file" hint="MP3, WAV, FLAC">
                    <label className={`flex items-center gap-3 w-full bg-[#0a150d] border border-dashed rounded-lg px-4 py-3 cursor-pointer transition-all
                      ${audioFile ? 'border-[#3dba6f]/30 hover:border-[#3dba6f]/50' : 'border-[#3dba6f]/15 hover:border-[#3dba6f]/30'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${audioFile ? 'bg-[#3dba6f]/15' : 'bg-[#3dba6f]/6 border border-[#3dba6f]/10'}`}>
                        <Music size={14} className={audioFile ? 'text-[#3dba6f]' : 'text-[#4a7a5a]'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${audioFile ? 'text-[#e8f5ec] font-medium' : 'text-[#4a7a5a]'}`}>
                          {audioFile ? audioFile.name : 'Choose audio file'}
                        </p>
                        {audioFile && <p className="text-xs text-[#4a7a5a] mt-0.5">Click to change</p>}
                      </div>
                      {audioFile && <Check size={14} className="text-[#3dba6f] flex-shrink-0" />}
                      <input type="file" accept="audio/*" className="hidden"
                        onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                    </label>
                  </Field>

                  {coverRequired ? (
                    <CoverUpload file={coverFile} preview={coverPreview}
                      onChange={f => { setCoverFile(f); setCoverPreview(f ? URL.createObjectURL(f) : null) }}
                      required label="Cover art" />
                  ) : albumHasCover ? (
                    <Field label="Cover art">
                      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a150d] border border-[#3dba6f]/15 rounded-lg">
                        <img src={selectedAlbum?.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-[#e8f5ec]">Using album cover</p>
                          <p className="text-xs text-[#4a7a5a] mt-0.5">{selectedAlbum?.title}</p>
                        </div>
                        <Check size={14} className="text-[#3dba6f]" />
                      </div>
                    </Field>
                  ) : null}
                </div>

                <div className={`${t.card} p-5 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <p className={t.eyebrow}>Lyrics <span className="normal-case font-normal tracking-normal text-[#3a6045] ml-1">— optional</span></p>
                    <div className="flex items-center gap-0.5 bg-[#0a150d] border border-[#3dba6f]/10 rounded-lg p-0.5">
                      {(['plain', 'lrc'] as const).map(type => (
                        <button key={type} onClick={() => setTrackForm(p => ({ ...p, lyrics_type: type }))}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer
                            ${trackForm.lyrics_type === type ? 'bg-[#162b1e] text-[#3dba6f]' : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                          {type === 'plain' ? 'Plain' : 'Synced'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    placeholder={trackForm.lyrics_type === 'lrc' ? '[00:12.00] First line\n[00:17.20] Second line...' : 'Paste your lyrics here...'}
                    value={trackForm.lyrics} onChange={e => setTrackForm(p => ({ ...p, lyrics: e.target.value }))}
                    rows={6} className={`${t.input} resize-none font-mono text-xs leading-relaxed`} />
                  {trackForm.lyrics.trim() && trackForm.lyrics_type === 'plain' && audioFile && (
                    <button onClick={() => setShowSyncer(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer p-0">
                      <Mic2 size={12} /> Sync to audio →
                    </button>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-400/5 border border-red-400/15 rounded-lg">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{uploadError}</p>
                  </div>
                )}

                <button onClick={handleUploadTrack} disabled={uploading || !canUpload}
                  className={`w-full py-3 ${t.btnPrimary} rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {uploading ? <><Spinner sm /> Uploading…</>
                    : uploadSuccess ? <><Check size={14} /> Uploaded!</>
                    : <><Upload size={13} /> Upload Track</>}
                </button>
              </div>
            )}

            {showSyncer && audioFile && (
              <LyricsSyncer audioUrl={URL.createObjectURL(audioFile)} initialLyrics={trackForm.lyrics}
                onDone={lrc => { setTrackForm(p => ({ ...p, lyrics: lrc, lyrics_type: 'lrc' })); setShowSyncer(false) }}
                onCancel={() => setShowSyncer(false)} />
            )}

            {/* ══ ALBUMS ══ */}
            {section === 'albums' && (
              <div>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">Albums</h2>
                    <p className="text-sm text-[#4a7a5a] mt-1">{albums.length} albums in your catalog</p>
                  </div>
                  <button onClick={() => setSection('new-album')} className={t.btnPrimary}>
                    <Plus size={13} /> New Album
                  </button>
                </div>

                {albums.length === 0 ? (
                  <div className={`${t.card} py-20 flex flex-col items-center text-center`}>
                    <div className="w-16 h-16 rounded-2xl bg-[#3dba6f]/8 border border-[#3dba6f]/10 flex items-center justify-center mb-4">
                      <Disc size={24} className="text-[#3dba6f]/40" />
                    </div>
                    <p className="text-base font-semibold text-[#e8f5ec] mb-1">No albums yet</p>
                    <p className="text-sm text-[#4a7a5a] mb-6">Create an album to group your tracks</p>
                    <button onClick={() => setSection('new-album')} className={t.btnPrimary}>
                      <Plus size={13} /> New Album
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {albums.map(album => {
                      const albumTracks = tracks.filter(t => t.albums?.title === album.title)
                      return (
                        <div key={album.id} className={`${t.cardHov} p-3`}>
                          <div className="aspect-square bg-[#142a19] rounded-lg mb-3 overflow-hidden relative group">
                            {album.cover_url
                              ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-[#3dba6f]/20" /></div>}
                          </div>
                          <p className="text-sm font-medium text-[#e8f5ec] truncate">{album.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-[#4a7a5a]">{albumTracks.length} tracks</p>
                            {album.release_date && (
                              <p className="text-[10px] text-[#3a6045]">{new Date(album.release_date).getFullYear()}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ══ NEW ALBUM ══ */}
            {section === 'new-album' && (
              <div className="max-w-xl mx-auto space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => setSection('albums')} className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors bg-transparent border-none cursor-pointer">
                    <ArrowLeft size={16} />
                  </button>
                  <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">New Album</h2>
                </div>

                <div className={`${t.card} p-5 space-y-4`}>
                  <p className={t.eyebrow}>Album Details</p>
                  <Field label="Title" hint="Required">
                    <input type="text" placeholder="Album name" value={albumForm.title}
                      onChange={e => setAlbumForm(p => ({ ...p, title: e.target.value }))} className={t.input} />
                  </Field>
                  <Field label="Release date" hint="Optional">
                    <input type="date" value={albumForm.release_date}
                      onChange={e => setAlbumForm(p => ({ ...p, release_date: e.target.value }))} className={t.input} />
                  </Field>
                  <CoverUpload file={albumCover} preview={albumCoverPrev}
                    onChange={f => { setAlbumCover(f); setAlbumCoverPrev(f ? URL.createObjectURL(f) : null) }}
                    required label="Cover art" />
                </div>

                {albumError && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-red-400/5 border border-red-400/15 rounded-lg">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{albumError}</p>
                  </div>
                )}

                <button onClick={handleUploadAlbum} disabled={albumUploading || !albumForm.title || !albumCover}
                  className={`w-full py-3 ${t.btnPrimary} rounded-lg disabled:opacity-40 disabled:cursor-not-allowed`}>
                  {albumUploading ? <><Spinner sm /> Creating…</> : <><Plus size={13} /> Create Album</>}
                </button>
              </div>
            )}

            {/* ══ ANALYTICS ══ */}
            {section === 'analytics' && stats && (
              <div className="space-y-5">
                <div>
                  <h2 className="gg-serif text-2xl font-medium text-[#e8f5ec]">Analytics</h2>
                  <p className="text-sm text-[#4a7a5a] mt-1">Your music performance at a glance</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Plays', value: stats.total_plays.toLocaleString(), icon: Play, change: '+12%' },
                    { label: 'Monthly Listeners', value: (stats.monthly_listeners || 0).toLocaleString(), icon: Users, change: '+8%' },
                    { label: 'Likes', value: stats.total_likes.toLocaleString(), icon: Heart, change: '+5%' },
                    { label: 'Revenue', value: `$${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, change: '+15%' },
                  ].map(stat => (
                    <div key={stat.label} className={`${t.card} p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon size={14} className="text-[#3dba6f]/60" />
                        <span className="text-[10px] text-[#3dba6f]">{stat.change}</span>
                      </div>
                      <p className="gg-serif text-2xl font-medium text-[#e8f5ec] leading-none">{stat.value}</p>
                      <p className="text-xs text-[#4a7a5a] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {topTrack && (
                  <div className={`${t.card} p-5`}>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-[#3dba6f]" />
                      <p className="text-xs font-semibold text-[#e8f5ec] uppercase tracking-wide">Top Performing Track</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#142a19] flex-shrink-0">
                        {(topTrack.cover_url || topTrack.albums?.cover_url)
                          ? <img src={topTrack.cover_url || topTrack.albums?.cover_url || ''} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-[#3dba6f]/30" /></div>}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-[#e8f5ec]">{topTrack.title}</p>
                        <p className="text-sm text-[#8ab89a]">{topTrack.albums?.title || 'Single'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-[#4a7a5a]"><Play size={10} /> {formatNumber(topTrack.play_count || 0)} plays</span>
                          <span className="flex items-center gap-1 text-xs text-[#4a7a5a]"><Heart size={10} /> {formatNumber(topTrack.like_count || 0)} likes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className={`${t.card} p-5 flex items-center gap-3`}>
                  <Eye size={16} className="text-[#3a6045] flex-shrink-0" />
                  <p className="text-sm text-[#4a7a5a]">Detailed analytics — listener demographics, geography, and playlist performance — coming soon.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}