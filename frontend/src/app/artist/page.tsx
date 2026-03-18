"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Music, Upload, Plus, X, Check, Mic2, ImageIcon,
  AlertCircle, Play, Pause, SkipBack, BarChart2,
  User, Disc, ListMusic, ArrowLeft,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Track {
  id: string; title: string; duration_seconds: number; audio_url: string
  price: number; cover_url: string | null; lyrics: string | null
  lyrics_type: 'plain' | 'lrc'
  albums: { title: string; cover_url: string } | null; created_at: string
}
interface AlbumType {
  id: string; title: string; cover_url: string; release_date: string
}
interface ArtistProfile {
  id: string; display_name: string; bio: string; genre: string; country: string
}
interface Stats {
  total_plays: number; total_likes: number; avg_completion: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const cs  = String(Math.floor((t % 1) * 100)).padStart(2, '0')
  return `[${min}:${sec}.${cs}]`
}

// ─── Design tokens ─────────────────────────────────────────────────────────────
// Three surface levels + one accent. Everything derives from these.
// bg0: deepest (page bg)     #0b1810
// bg1: cards / panels        #0f1f14
// bg2: inputs / inset areas  #0a150d
// border: subtle             rgba(61,186,111,0.12)
// border-hi: hover / focus   rgba(61,186,111,0.35)
// accent: #3dba6f
// text-hi: #e8f5ec
// text-mid: #8ab89a
// text-lo: #4a7a5a

const t = {
  page:   'bg-[#0b1810] text-[#e8f5ec]',
  card:   'bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl',
  cardHov:'bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl hover:border-[#3dba6f]/25 transition-colors duration-200',
  input:  'w-full bg-[#0a150d] border border-[#3dba6f]/15 rounded-xl px-4 py-2.5 text-sm text-[#e8f5ec] placeholder-[#4a7a5a] outline-none focus:border-[#3dba6f]/50 focus:bg-[#0b1c0f] transition-all duration-150',
  // Buttons
  btnPrimary: 'flex items-center justify-center gap-2 px-5 py-2.5 bg-[#3dba6f] text-[#071008] rounded-xl text-sm font-semibold hover:bg-[#4ecf80] active:scale-[0.98] transition-all cursor-pointer border-none',
  btnGhost:   'flex items-center justify-center gap-2 px-5 py-2.5 border border-[#3dba6f]/20 text-[#8ab89a] rounded-xl text-sm font-medium hover:border-[#3dba6f]/40 hover:text-[#e8f5ec] transition-all cursor-pointer bg-transparent',
  // Labels
  eyebrow: 'text-[10px] font-semibold uppercase tracking-[0.15em] text-[#4a7a5a]',
  label:   'text-xs font-medium text-[#8ab89a]',
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <span className={`${sm ? 'w-3.5 h-3.5 border' : 'w-5 h-5 border-2'} border-[#3dba6f]/20 border-t-[#3dba6f] rounded-full animate-spin inline-block`} />
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={t.label}>{label}</label>
        {hint && <span className="text-[10px] text-[#4a7a5a]">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ─── Cover Upload ─────────────────────────────────────────────────────────────

function CoverUpload({ file, preview, onChange, required, label = 'Cover art' }: {
  file: File | null; preview: string | null
  onChange: (f: File | null) => void; required?: boolean; label?: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className={t.label}>{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
        {preview && (
          <button onClick={() => onChange(null)}
            className="text-[10px] text-[#4a7a5a] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer">
            Remove
          </button>
        )}
      </div>
      <label className={`flex items-center gap-3 w-full bg-[#0a150d] border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all duration-150
        ${preview ? 'border-[#3dba6f]/30 hover:border-[#3dba6f]/50' : 'border-[#3dba6f]/15 hover:border-[#3dba6f]/30'}`}>
        {preview ? (
          <>
            <img src={preview} alt="cover" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#e8f5ec] truncate">{file?.name}</p>
              <p className="text-xs text-[#4a7a5a] mt-0.5">Click to change</p>
            </div>
            <Check size={14} className="text-[#3dba6f] flex-shrink-0" />
          </>
        ) : (
          <>
            <div className="w-11 h-11 rounded-xl bg-[#3dba6f]/8 border border-[#3dba6f]/15 flex items-center justify-center flex-shrink-0">
              <ImageIcon size={16} className="text-[#4a7a5a]" />
            </div>
            <div>
              <p className="text-sm text-[#8ab89a]">Upload image</p>
              <p className="text-xs text-[#4a7a5a] mt-0.5">JPG, PNG, WEBP</p>
            </div>
          </>
        )}
        <input type="file" accept="image/*" className="hidden"
          onChange={e => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  )
}

// ─── Lyrics Syncer ────────────────────────────────────────────────────────────

function LyricsSyncer({ audioUrl, initialLyrics, onDone, onCancel }: {
  audioUrl: string; initialLyrics: string
  onDone: (lrc: string) => void; onCancel: () => void
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [rawLines]   = useState(initialLyrics.split('\n').filter(l => l.trim()))
  const [timestamps, setTimestamps] = useState<(number | null)[]>(() =>
    new Array(initialLyrics.split('\n').filter(l => l.trim()).length).fill(null))
  const [currentLine, setCurrentLine] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [started,     setStarted]     = useState(false)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDur  = () => setDuration(audio.duration)
    const onEnd  = () => setPlaying(false)
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
      <div className="bg-[#0f1f14] border border-[#3dba6f]/15 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <p className="text-sm font-semibold text-[#e8f5ec]">Lyrics Syncer</p>
            <p className="text-xs text-[#4a7a5a] mt-0.5">
              {!started ? 'Press start — tap each line as it plays'
                : done ? 'All lines captured!'
                : `Line ${currentLine + 1} of ${rawLines.length}`}
            </p>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#0a150d] border border-[#3dba6f]/10 flex items-center justify-center text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors cursor-pointer border-solid">
            <X size={14} />
          </button>
        </div>

        <div className="h-px bg-[#3dba6f]/8 mx-6 relative overflow-hidden">
          <div className="h-full bg-[#3dba6f] absolute left-0 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-0.5">
          {rawLines.map((line, i) => (
            <div key={i} ref={el => { lineRefs.current[i] = el }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all
                ${i === currentLine && started && !done
                  ? 'bg-[#3dba6f]/10 border border-[#3dba6f]/20 text-[#e8f5ec] font-semibold'
                  : i < currentLine ? 'text-[#3a6045]' : 'text-[#8ab89a]'}`}>
              <span className="font-mono text-[10px] w-16 flex-shrink-0 text-[#3a6045]">
                {timestamps[i] != null ? fmtLRC(timestamps[i]!) : '—'}
              </span>
              <span className="flex-1">{line}</span>
              {i < currentLine && <Check size={11} className="text-[#3dba6f] flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="border-t border-[#3dba6f]/8 px-6 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} disabled={!started}
              className="w-9 h-9 bg-[#3dba6f] rounded-full flex items-center justify-center text-[#071008] disabled:opacity-30 cursor-pointer border-none hover:bg-[#4ecf80] transition-colors flex-shrink-0">
              {playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={handleUndo} disabled={!started || currentLine === 0}
              className="w-9 h-9 border border-[#3dba6f]/15 rounded-full flex items-center justify-center text-[#8ab89a] hover:text-[#e8f5ec] hover:border-[#3dba6f]/30 disabled:opacity-30 transition-all cursor-pointer bg-transparent border-solid flex-shrink-0">
              <SkipBack size={12} />
            </button>
            <span className="flex-1 text-center text-xs font-mono text-[#4a7a5a]">
              {fmtDur(Math.floor(currentTime))} / {fmtDur(Math.floor(duration))}
            </span>
            <span className="text-xs text-[#4a7a5a]">{synced}/{rawLines.length}</span>
          </div>

          {!started ? (
            <button onClick={() => { setStarted(true); audioRef.current?.play(); setPlaying(true) }}
              className={`w-full py-3 ${t.btnPrimary} rounded-xl`}>
              Start — tap or press Space for each line
            </button>
          ) : done ? (
            <button onClick={() => {
              const lrc = rawLines.map((l, i) => timestamps[i] != null ? `${fmtLRC(timestamps[i]!)} ${l}` : null).filter(Boolean).join('\n')
              onDone(lrc)
            }} className={`w-full py-3 ${t.btnPrimary} rounded-xl`}>
              <Check size={14} /> Generate LRC ({synced} lines)
            </button>
          ) : (
            <button onClick={handleTap}
              className={`w-full py-3 ${t.btnPrimary} rounded-xl select-none`}>
              Tap — "{rawLines[currentLine]}"
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lyrics Modal ─────────────────────────────────────────────────────────────

function LyricsModal({ track, artistId, userId, onClose, onSaved }: {
  track: Track; artistId: string; userId: string; onClose: () => void; onSaved: () => void
}) {
  const [lyrics,     setLyrics]     = useState(track.lyrics || '')
  const [lyricsType, setLyricsType] = useState<'plain' | 'lrc'>(track.lyrics_type || 'plain')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState('')
  const [showSyncer, setShowSyncer] = useState(false)

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/artist/tracks', {
        method: 'PUT', headers: apiHeaders(artistId, userId),
        body: JSON.stringify({ track_id: track.id, lyrics: lyrics || null, lyrics_type: lyricsType }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error saving'); return }
      setSaved(true); setTimeout(() => { onSaved(); onClose() }, 1200)
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
      <div className="bg-[#0f1f14] border border-[#3dba6f]/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#3dba6f]/8">
          <div>
            <p className="text-sm font-semibold text-[#e8f5ec]">{track.title}</p>
            <p className="text-xs text-[#4a7a5a] mt-0.5">{track.lyrics ? 'Edit lyrics' : 'Add lyrics'}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0a150d] border border-[#3dba6f]/10 flex items-center justify-center text-[#4a7a5a] hover:text-[#e8f5ec] transition-colors cursor-pointer border-solid">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className={t.label}>Format</span>
            <div className="flex items-center gap-0.5 bg-[#0a150d] border border-[#3dba6f]/10 rounded-lg p-0.5">
              {(['plain', 'lrc'] as const).map(type => (
                <button key={type} onClick={() => setLyricsType(type)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer
                    ${lyricsType === type ? 'bg-[#162b1e] text-[#3dba6f]' : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
                  {type === 'plain' ? 'Plain text' : 'Synced (LRC)'}
                </button>
              ))}
            </div>
          </div>

          <textarea placeholder={lyricsType === 'lrc' ? '[00:12.00] First line\n[00:17.20] Second line...' : 'Paste your lyrics here...'}
            value={lyrics} onChange={e => setLyrics(e.target.value)} rows={10}
            className={`${t.input} resize-none font-mono text-xs leading-relaxed`} />

          {lyrics.trim() && lyricsType === 'plain' && (
            <button onClick={() => setShowSyncer(true)}
              className="flex items-center gap-2 text-xs font-medium text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer p-0">
              <Mic2 size={13} /> Sync these lyrics to the audio →
            </button>
          )}
          {error && <p className="text-xs text-red-400 px-3 py-2.5 bg-red-400/8 border border-red-400/15 rounded-xl">{error}</p>}
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className={`flex-1 py-2.5 ${t.btnGhost} rounded-xl`}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-2.5 ${t.btnPrimary} rounded-xl disabled:opacity-60`}>
            {saving ? <Spinner sm /> : saved ? <><Check size={14} /> Saved</> : 'Save lyrics'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Format toggle ─────────────────────────────────────────────────────────────

function LyricsFormatToggle({ value, onChange }: { value: 'plain' | 'lrc', onChange: (v: 'plain' | 'lrc') => void }) {
  return (
    <div className="flex items-center gap-0.5 bg-[#0a150d] border border-[#3dba6f]/10 rounded-lg p-0.5">
      {(['plain', 'lrc'] as const).map(type => (
        <button key={type} onClick={() => onChange(type)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border-none cursor-pointer
            ${value === type ? 'bg-[#162b1e] text-[#3dba6f]' : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a]'}`}>
          {type === 'plain' ? 'Plain text' : 'Synced (LRC)'}
        </button>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Section = 'tracks' | 'upload' | 'albums' | 'new-album' | 'stats' | 'profile'

const NAV = [
  { key: 'tracks',  label: 'Tracks',    Icon: ListMusic },
  { key: 'albums',  label: 'Albums',    Icon: Disc },
  { key: 'stats',   label: 'Analytics', Icon: BarChart2 },
  { key: 'profile', label: 'Profile',   Icon: User },
] as const

export default function ArtistStudio() {
  const router = useRouter()
  const [section,      setSection]      = useState<Section>('tracks')
  const [artistId,     setArtistId]     = useState('')
  const [userId,       setUserId]       = useState('')
  const [tracks,       setTracks]       = useState<Track[]>([])
  const [albums,       setAlbums]       = useState<AlbumType[]>([])
  const [stats,        setStats]        = useState<Stats | null>(null)
  const [profile,      setProfile]      = useState<ArtistProfile | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [lyricsTrack,  setLyricsTrack]  = useState<Track | null>(null)

  const [trackForm, setTrackForm] = useState({
    title: '', album_id: '', price: '', lyrics: '', lyrics_type: 'plain' as 'plain' | 'lrc',
  })
  const [audioFile,     setAudioFile]     = useState<File | null>(null)
  const [coverFile,     setCoverFile]     = useState<File | null>(null)
  const [coverPreview,  setCoverPreview]  = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError,   setUploadError]   = useState('')
  const [showSyncer,    setShowSyncer]    = useState(false)

  const [albumForm,      setAlbumForm]      = useState({ title: '', release_date: '' })
  const [albumCover,     setAlbumCover]     = useState<File | null>(null)
  const [albumCoverPrev, setAlbumCoverPrev] = useState<string | null>(null)
  const [albumUploading, setAlbumUploading] = useState(false)
  const [albumError,     setAlbumError]     = useState('')

  const [editProfile,   setEditProfile]   = useState(false)
  const [profileForm,   setProfileForm]   = useState({ display_name: '', bio: '', genre: '', country: '' })
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
      fetch('/api/artist/stats',  { headers: h }),
      supabase.from('artists').select('*').eq('id', artistId).single(),
    ])
    if (tR.ok && aR.ok && sR.ok) {
      const [tD, aD, sD] = await Promise.all([tR.json(), aR.json(), sR.json()])
      setTracks(tD.tracks || []); setAlbums(aD.albums || []); setStats(sD)
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
      if (!trackForm.title)         { setUploadError('Track title is required'); return }
      if (!audioFile)               { setUploadError('Audio file is required'); return }
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
    if (!albumCover)      { setAlbumError('Cover art is required'); return }
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

  const isSub = section === 'upload' || section === 'new-album'
  const parentSec: Section = section === 'upload' ? 'tracks' : 'albums'

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${t.page}`}
      style={{ fontFamily: "'Cabinet Grotesk', 'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        .gg-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .gg-body  { font-family: 'DM Sans', system-ui, sans-serif; }
        :root { font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>

      {lyricsTrack && (
        <LyricsModal track={lyricsTrack} artistId={artistId} userId={userId}
          onClose={() => setLyricsTrack(null)} onSaved={fetchAll} />
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-[#0b1810]/92 backdrop-blur-xl border-b border-[#3dba6f]/8 h-14 flex items-center px-8">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/player" className="flex items-center gap-2.5 no-underline group">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform duration-300">
                <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f"/>
                <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="gg-body text-sm font-semibold text-[#e8f5ec]/80 tracking-wide">Groove Garden</span>
            </Link>
            <span className="text-[#3dba6f]/30 text-xs">/</span>
            <span className="text-xs text-[#4a7a5a]">Artist Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#8ab89a]">{profile?.display_name}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center">
              <span className="text-[#071008] text-xs font-bold">
                {profile?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* ── Page header ── */}
        <div className="flex items-end justify-between mb-8">
          <div>
            {isSub && (
              <button onClick={() => setSection(parentSec)}
                className="flex items-center gap-1.5 text-xs text-[#4a7a5a] hover:text-[#8ab89a] transition-colors bg-transparent border-none cursor-pointer mb-3 p-0 uppercase tracking-widest">
                <ArrowLeft size={12} /> Back
              </button>
            )}
            <h1 className="gg-serif text-4xl font-medium text-[#e8f5ec] leading-none">
              {section === 'tracks'    && 'Your Tracks'}
              {section === 'upload'    && 'Upload Track'}
              {section === 'albums'    && 'Your Albums'}
              {section === 'new-album' && 'New Album'}
              {section === 'stats'     && 'Analytics'}
              {section === 'profile'   && 'Artist Profile'}
            </h1>
          </div>

          {/* Nav pill */}
          <nav className="flex items-center gap-0.5 bg-[#0f1f14] border border-[#3dba6f]/10 rounded-xl p-1">
            {NAV.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setSection(key as Section)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border-none cursor-pointer
                  ${section === key || (section === 'upload' && key === 'tracks') || (section === 'new-album' && key === 'albums')
                    ? 'bg-[#3dba6f] text-[#071008]'
                    : 'bg-transparent text-[#4a7a5a] hover:text-[#8ab89a] hover:bg-[#3dba6f]/5'}`}>
                <Icon size={13} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-32"><Spinner /></div>
        ) : (
          <>

          {/* ══ TRACKS ══ */}
          {section === 'tracks' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setSection('upload')} className={t.btnPrimary}>
                  <Plus size={14} /> Upload Track
                </button>
              </div>

              {tracks.length === 0 ? (
                <div className={`${t.card} py-24 flex flex-col items-center text-center`}>
                  <div className="w-16 h-16 rounded-2xl bg-[#3dba6f]/8 border border-[#3dba6f]/10 flex items-center justify-center mb-5">
                    <Music size={24} className="text-[#3dba6f]/40" />
                  </div>
                  <p className="text-base font-semibold text-[#e8f5ec] mb-1.5">No tracks yet</p>
                  <p className="text-sm text-[#4a7a5a] mb-6 max-w-xs">Upload your first track to start building your catalog</p>
                  <button onClick={() => setSection('upload')} className={t.btnPrimary}>
                    <Plus size={14} /> Upload Track
                  </button>
                </div>
              ) : (
                <div className={`${t.card} divide-y divide-[#3dba6f]/6 overflow-hidden`}>
                  {tracks.map((track, i) => (
                    <div key={track.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#3dba6f]/3 transition-colors group">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#142a19]">
                        {(track.cover_url || track.albums?.cover_url)
                          ? <img src={track.cover_url || track.albums?.cover_url || ''} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Music size={13} className="text-[#3dba6f]/30" />
                            </div>}
                      </div>
                      <span className="text-[10px] text-[#3a6045] w-5 text-right tabular-nums flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#e8f5ec] truncate">{track.title}</p>
                        <p className="text-xs text-[#4a7a5a] mt-0.5">{track.albums?.title || 'Single'} · {fmtDur(track.duration_seconds)}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-1 rounded-md ${track.price ? 'bg-[#162b1e] text-[#8ab89a]' : 'bg-[#3dba6f]/10 text-[#3dba6f]'}`}>
                        {track.price ? `$${track.price}` : 'Free'}
                      </span>
                      {track.lyrics ? (
                        <button onClick={() => setLyricsTrack(track)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#3dba6f]/10 border border-[#3dba6f]/20 rounded-lg text-[10px] font-medium text-[#3dba6f] hover:bg-[#3dba6f]/15 transition-colors cursor-pointer flex-shrink-0 border-solid">
                          <Mic2 size={10} />{track.lyrics_type === 'lrc' ? 'Synced' : 'Lyrics'}
                        </button>
                      ) : (
                        <button onClick={() => setLyricsTrack(track)}
                          className="flex items-center gap-1.5 px-2.5 py-1 border border-dashed border-[#3dba6f]/15 rounded-lg text-[10px] text-[#3a6045] hover:text-[#3dba6f] hover:border-[#3dba6f]/30 transition-all cursor-pointer flex-shrink-0 opacity-0 group-hover:opacity-100 bg-transparent">
                          <Plus size={10} /> Add lyrics
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
            <div className="max-w-xl space-y-4">

              {trackForm.album_id && !albumHasCover && (
                <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-400/6 border border-amber-400/20 rounded-xl">
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

              <div className={`${t.card} p-6 space-y-5`}>
                <p className={t.eyebrow}>Track info</p>
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
                      {albums.map(a => <option key={a.id} value={a.id}>{a.title}{!a.cover_url ? ' ⚠' : ''}</option>)}
                    </select>
                  </Field>
                  <Field label="Price (USD)" hint="0 = free">
                    <input type="number" min="0" step="0.01" placeholder="0.00"
                      value={trackForm.price} onChange={e => setTrackForm(p => ({ ...p, price: e.target.value }))}
                      className={t.input} />
                  </Field>
                </div>
              </div>

              <div className={`${t.card} p-6 space-y-5`}>
                <p className={t.eyebrow}>Files</p>
                <Field label="Audio file" hint="MP3, WAV, FLAC">
                  <label className={`flex items-center gap-3 w-full bg-[#0a150d] border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all
                    ${audioFile ? 'border-[#3dba6f]/30 hover:border-[#3dba6f]/50' : 'border-[#3dba6f]/15 hover:border-[#3dba6f]/30'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${audioFile ? 'bg-[#3dba6f]/15' : 'bg-[#3dba6f]/6 border border-[#3dba6f]/10'}`}>
                      <Music size={15} className={audioFile ? 'text-[#3dba6f]' : 'text-[#4a7a5a]'} />
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
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#0a150d] border border-[#3dba6f]/15 rounded-xl">
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

              <div className={`${t.card} p-6 space-y-4`}>
                <div className="flex items-center justify-between">
                  <p className={t.eyebrow}>Lyrics <span className="normal-case font-normal tracking-normal text-[#3a6045] ml-1">— optional</span></p>
                  <LyricsFormatToggle value={trackForm.lyrics_type} onChange={v => setTrackForm(p => ({ ...p, lyrics_type: v }))} />
                </div>
                <textarea
                  placeholder={trackForm.lyrics_type === 'lrc' ? '[00:12.00] First line\n[00:17.20] Second line...' : 'Paste your lyrics here...'}
                  value={trackForm.lyrics} onChange={e => setTrackForm(p => ({ ...p, lyrics: e.target.value }))}
                  rows={6} className={`${t.input} resize-none font-mono text-xs leading-relaxed`} />
                {trackForm.lyrics.trim() && trackForm.lyrics_type === 'plain' && audioFile && (
                  <button onClick={() => setShowSyncer(true)}
                    className="flex items-center gap-2 text-xs font-medium text-[#3dba6f] hover:text-[#4ecf80] transition-colors bg-transparent border-none cursor-pointer p-0">
                    <Mic2 size={13} /> Sync to audio →
                  </button>
                )}
                {trackForm.lyrics.trim() && trackForm.lyrics_type === 'plain' && !audioFile && (
                  <p className="text-xs text-[#3a6045]">Upload an audio file first to use the syncer</p>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-3 px-4 py-3.5 bg-red-400/6 border border-red-400/15 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{uploadError}</p>
                </div>
              )}

              <button onClick={handleUploadTrack} disabled={uploading || !canUpload}
                className={`w-full py-3.5 ${t.btnPrimary} rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed`}>
                {uploading ? <><Spinner sm /> Uploading…</>
                  : uploadSuccess ? <><Check size={15} /> Uploaded!</>
                  : <><Upload size={14} /> Upload Track</>}
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
              <div className="flex justify-end mb-4">
                <button onClick={() => setSection('new-album')} className={t.btnPrimary}>
                  <Plus size={14} /> New Album
                </button>
              </div>
              {albums.length === 0 ? (
                <div className={`${t.card} py-24 flex flex-col items-center text-center`}>
                  <div className="w-16 h-16 rounded-2xl bg-[#3dba6f]/8 border border-[#3dba6f]/10 flex items-center justify-center mb-5">
                    <Disc size={24} className="text-[#3dba6f]/40" />
                  </div>
                  <p className="text-base font-semibold text-[#e8f5ec] mb-1.5">No albums yet</p>
                  <p className="text-sm text-[#4a7a5a] mb-6">Create an album to group your tracks</p>
                  <button onClick={() => setSection('new-album')} className={t.btnPrimary}><Plus size={14} /> New Album</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {albums.map(album => (
                    <div key={album.id} className={`${t.cardHov} p-4`}>
                      <div className="aspect-square bg-[#142a19] rounded-xl mb-3 overflow-hidden">
                        {album.cover_url
                          ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={22} className="text-[#3dba6f]/20" /></div>}
                      </div>
                      <p className="text-sm font-medium text-[#e8f5ec] truncate">{album.title}</p>
                      <p className="text-xs text-[#4a7a5a] mt-0.5">{album.release_date || 'No release date'}</p>
                      {!album.cover_url && (
                        <p className="text-[10px] text-amber-400/80 mt-1.5 flex items-center gap-1">
                          <AlertCircle size={10} /> No cover art
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ NEW ALBUM ══ */}
          {section === 'new-album' && (
            <div className="max-w-xl space-y-4">
              <div className={`${t.card} p-6 space-y-5`}>
                <p className={t.eyebrow}>Album details</p>
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
                <div className="flex items-center gap-3 px-4 py-3.5 bg-red-400/6 border border-red-400/15 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">{albumError}</p>
                </div>
              )}
              <button onClick={handleUploadAlbum} disabled={albumUploading || !albumForm.title || !albumCover}
                className={`w-full py-3.5 ${t.btnPrimary} rounded-xl disabled:opacity-40 disabled:cursor-not-allowed`}>
                {albumUploading ? <><Spinner sm /> Creating…</> : <><Plus size={14} /> Create Album</>}
              </button>
            </div>
          )}

          {/* ══ STATS ══ */}
          {section === 'stats' && (
            <div className="space-y-4">
              {stats ? (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total plays',    value: stats.total_plays.toLocaleString(), sub: 'All-time streams' },
                      { label: 'Total likes',    value: stats.total_likes.toLocaleString(), sub: 'Saves & favorites' },
                      { label: 'Avg completion', value: `${stats.avg_completion}%`,         sub: 'Tracks finished' },
                    ].map(s => (
                      <div key={s.label} className={`${t.card} p-6`}>
                        <p className="gg-serif text-4xl font-medium text-[#3dba6f] mb-2 leading-none">{s.value}</p>
                        <p className="text-sm font-medium text-[#e8f5ec] mb-0.5">{s.label}</p>
                        <p className="text-xs text-[#4a7a5a]">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                  <div className={`${t.card} px-5 py-4 flex items-center gap-3`}>
                    <BarChart2 size={15} className="text-[#3a6045] flex-shrink-0" />
                    <p className="text-sm text-[#4a7a5a]">Track-by-track breakdowns, listener demographics, and revenue reports coming soon.</p>
                  </div>
                </>
              ) : (
                <div className={`${t.card} py-24 flex flex-col items-center text-center`}>
                  <div className="w-16 h-16 rounded-2xl bg-[#3dba6f]/8 border border-[#3dba6f]/10 flex items-center justify-center mb-5">
                    <BarChart2 size={24} className="text-[#3dba6f]/40" />
                  </div>
                  <p className="text-base font-semibold text-[#e8f5ec] mb-1.5">No data yet</p>
                  <p className="text-sm text-[#4a7a5a]">Upload tracks and get plays to see your analytics</p>
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ══ */}
          {section === 'profile' && profile && (
            <div className="max-w-xl space-y-4">
              <div className={`${t.card} p-6 space-y-5`}>
                {/* Artist identity header */}
                <div className="flex items-center gap-4 pb-5 border-b border-[#3dba6f]/8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1e5c38] to-[#3dba6f] flex items-center justify-center flex-shrink-0">
                    <span className="text-[#071008] text-xl font-bold">{profile.display_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#e8f5ec]">{profile.display_name}</p>
                    <p className="text-sm text-[#4a7a5a] mt-0.5">{profile.genre}{profile.country ? ` · ${profile.country}` : ''}</p>
                  </div>
                </div>

                {(['display_name', 'genre', 'country', 'bio'] as const).map(field => (
                  <Field key={field} label={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}>
                    {editProfile ? (
                      field === 'bio'
                        ? <textarea value={profileForm[field]} rows={4}
                            onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                            className={`${t.input} resize-none`} />
                        : <input type="text" value={profileForm[field]}
                            onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                            className={t.input} />
                    ) : (
                      <p className="text-sm text-[#e8f5ec] py-2">
                        {profile[field] || <span className="text-[#3a6045] italic">Not set</span>}
                      </p>
                    )}
                  </Field>
                ))}
              </div>

              {editProfile ? (
                <div className="flex gap-3">
                  <button onClick={() => setEditProfile(false)} className={`flex-1 py-3 ${t.btnGhost} rounded-xl`}>Cancel</button>
                  <button onClick={handleSaveProfile} disabled={profileSaving}
                    className={`flex-1 py-3 ${t.btnPrimary} rounded-xl disabled:opacity-60`}>
                    {profileSaving ? <Spinner sm /> : <><Check size={14} /> Save Changes</>}
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditProfile(true)} className={`w-full py-3 ${t.btnGhost} rounded-xl`}>
                  Edit Profile
                </button>
              )}
            </div>
          )}

          </>
        )}
      </div>
    </div>
  )
}