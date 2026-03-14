"use client"

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Music, Album, BarChart2, User, Upload, Plus, X, Check, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Track { id: string; title: string; duration_seconds: number; audio_url: string; price: number; albums: { title: string } | null; created_at: string }
interface AlbumType { id: string; title: string; cover_url: string; release_date: string; created_at: string }
interface Stats { total_plays: number; total_likes: number; avg_completion: number }
interface ArtistProfile { id: string; display_name: string; bio: string; genre: string; country: string }

const apiHeaders = (artistId: string, userId: string) => ({
  'Content-Type': 'application/json',
  'x-artist-id': artistId,
  'x-user-id': userId,
})

const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

export default function ArtistDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'tracks' | 'albums' | 'stats' | 'profile'>('tracks')
  const [artistId, setArtistId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [profile, setProfile] = useState<ArtistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Upload track state
  const [showTrackForm, setShowTrackForm] = useState(false)
  const [trackForm, setTrackForm] = useState({ title: '', album_id: '', price: '' })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Album form
  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [albumForm, setAlbumForm] = useState({ title: '', release_date: '' })
  const [albumCover, setAlbumCover] = useState<File | null>(null)
  const [albumUploading, setAlbumUploading] = useState(false)

  // Profile edit
  const [editProfile, setEditProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ display_name: '', bio: '', genre: '', country: '' })

  useEffect(() => {
    const user = localStorage.getItem('gg_user')
    if (!user) { router.push('/auth'); return }
    const parsed = JSON.parse(user)
    if (!parsed.artist_id) { router.push('/become-artist'); return }
    setUserId(parsed.id)
    setArtistId(parsed.artist_id)
  }, [])

  useEffect(() => {
    if (!artistId || !userId) return
    fetchAll()
  }, [artistId, userId])

  const fetchAll = async () => {
    setLoading(true)
    const h = apiHeaders(artistId, userId)
    const [tRes, aRes, sRes, pRes] = await Promise.all([
      fetch('/api/artist/tracks', { headers: h }),
      fetch('/api/artist/albums', { headers: h }),  // ← albums con s
      fetch('/api/artist/stats', { headers: h }),
      supabase.from('artists').select('*').eq('id', artistId).single()
    ])

    // Verificar que todas las respuestas son ok antes de parsear
    if (!tRes.ok || !aRes.ok || !sRes.ok) {
      console.error('tracks:', tRes.status, 'albums:', aRes.status, 'stats:', sRes.status)
      setLoading(false)
      return
    }

    const [tData, aData, sData] = await Promise.all([tRes.json(), aRes.json(), sRes.json()])
    setTracks(tData.tracks || [])
    setAlbums(aData.albums || [])
    setStats(sData)
    if (pRes.data) {
      setProfile(pRes.data)
      setProfileForm({ display_name: pRes.data.display_name, bio: pRes.data.bio || '', genre: pRes.data.genre || '', country: pRes.data.country || '' })
    }
    setLoading(false)
  }

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    return urlData.publicUrl
  }

  const handleUploadTrack = async () => {
    if (!trackForm.title || !audioFile) { setUploadError('Título y archivo de audio son requeridos'); return }
    setUploading(true); setUploadError('')
    try {
      const timestamp = Date.now()
      const audioUrl = await uploadFile(audioFile, 'tracks', `${artistId}/${timestamp}-${audioFile.name}`)

      // Get duration from audio
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio()
        audio.preload = 'metadata'
        audio.onloadedmetadata = () => resolve(Math.floor(audio.duration))
        audio.onerror = () => resolve(0)
        setTimeout(() => resolve(0), 5000) // fallback a los 5s
        audio.src = audioUrl
      })

      const res = await fetch('/api/artist/tracks', {
        method: 'POST',
        headers: apiHeaders(artistId, userId),
        body: JSON.stringify({ title: trackForm.title, album_id: trackForm.album_id || null, duration_seconds: duration, audio_url: audioUrl, price: parseFloat(trackForm.price) || 0 })
      })
      if (!res.ok) { const d = await res.json(); setUploadError(d.error); return }
      setUploadSuccess(true)
      setTimeout(() => { setUploadSuccess(false); setShowTrackForm(false); setTrackForm({ title: '', album_id: '', price: '' }); setAudioFile(null); setCoverFile(null) }, 2000)
      fetchAll()
    } catch (e: any) {
      setUploadError(e.message || 'Error al subir')
    } finally { setUploading(false) }
  }

  const handleUploadAlbum = async () => {
    if (!albumForm.title) return
    setAlbumUploading(true)
    try {
      let coverUrl = ''
      if (albumCover) coverUrl = await uploadFile(albumCover, 'tracks', `covers/${artistId}/${Date.now()}-${albumCover.name}`)
      const res = await fetch('/api/artist/albums', {
        method: 'POST',
        headers: apiHeaders(artistId, userId),
        body: JSON.stringify({ title: albumForm.title, cover_url: coverUrl, release_date: albumForm.release_date || null })
      })
      if (res.ok) { setShowAlbumForm(false); setAlbumForm({ title: '', release_date: '' }); setAlbumCover(null); fetchAll() }
    } finally { setAlbumUploading(false) }
  }

  const handleSaveProfile = async () => {
    const { error } = await supabase.from('artists').update(profileForm).eq('id', artistId)
    if (!error) { setEditProfile(false); fetchAll() }
  }

  const TABS = [
    { key: 'tracks', label: 'Tracks', icon: <Music size={16} /> },
    { key: 'albums', label: 'Albums', icon: <Album size={16} /> },
    { key: 'stats', label: 'Stats', icon: <BarChart2 size={16} /> },
    { key: 'profile', label: 'Profile', icon: <User size={16} /> },
  ]

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-[#f0f7f0] font-sans">
      {/* Header */}
      <header className="border-b border-[#4ade80]/10 bg-[#0a1a0f]/80 backdrop-blur-xl sticky top-0 z-30 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/player" className="flex items-center gap-2 no-underline group">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="group-hover:rotate-12 transition-transform">
              <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
              <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs font-bold tracking-widest text-[#f0f7f0]">GROOVE GARDEN</span>
          </Link>
          <span className="text-[#4ade80]/30">·</span>
          <span className="text-xs text-[#6b8a6e] tracking-widest uppercase">Artist Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#a3b8a5]">{profile?.display_name}</span>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#4ade80]" />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold mb-1">
            Welcome back, <em className="text-[#4ade80] not-italic">{profile?.display_name || '...'}</em>
          </h1>
          <p className="text-sm text-[#a3b8a5]">Manage your music, albums, and grow your garden 🌱</p>
        </div>

        {/* Quick Stats Bar */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: 'Total plays', value: stats.total_plays },
              { label: 'Total likes', value: stats.total_likes },
              { label: 'Avg completion', value: `${stats.avg_completion}%` },
            ].map(s => (
              <div key={s.label} className="bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-5">
                <p className="text-2xl font-extrabold text-[#4ade80]">{s.value}</p>
                <p className="text-xs text-[#6b8a6e] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-1 mb-8 w-fit gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer border-none
                ${tab === t.key ? 'bg-[#0a1a0f] text-[#f0f7f0]' : 'bg-transparent text-[#6b8a6e] hover:text-[#a3b8a5]'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* TRACKS TAB */}
            {tab === 'tracks' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Your Tracks ({tracks.length})</h2>
                  <button onClick={() => setShowTrackForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#166534] hover:bg-[#22c55e] hover:text-[#0a1a0f] rounded-xl text-sm font-semibold transition-all cursor-pointer border-none">
                    <Plus size={16} /> Upload Track
                  </button>
                </div>

                {/* Upload form */}
                {showTrackForm && (
                  <div className="bg-[#0d2010] border border-[#4ade80]/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold">New Track</h3>
                      <button onClick={() => setShowTrackForm(false)} className="text-[#6b8a6e] hover:text-[#f0f7f0] cursor-pointer border-none bg-transparent"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-[#a3b8a5] mb-1.5">Track title *</label>
                        <input type="text" placeholder="Track name" value={trackForm.title}
                          onChange={e => setTrackForm(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#a3b8a5] mb-1.5">Price (USD)</label>
                        <input type="number" placeholder="0.00" value={trackForm.price}
                          onChange={e => setTrackForm(p => ({ ...p, price: e.target.value }))}
                          className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs text-[#a3b8a5] mb-1.5">Album (optional)</label>
                      <select value={trackForm.album_id} onChange={e => setTrackForm(p => ({ ...p, album_id: e.target.value }))}
                        className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] outline-none focus:border-[#4ade80]/40 transition-colors cursor-pointer">
                        <option value="">No album (single)</option>
                        {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                      </select>
                    </div>
                    <div className="mb-5">
                      <label className="block text-xs text-[#a3b8a5] mb-1.5">Audio file (MP3) *</label>
                      <label className="flex items-center gap-3 w-full bg-[#122016] border border-dashed border-[#4ade80]/20 hover:border-[#4ade80]/40 rounded-xl px-4 py-4 cursor-pointer transition-colors">
                        <Upload size={18} className="text-[#4ade80]" />
                        <span className="text-sm text-[#6b8a6e]">{audioFile ? audioFile.name : 'Click to select MP3'}</span>
                        <input type="file" accept="audio/*" className="hidden" onChange={e => setAudioFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    {uploadError && <p className="text-xs text-red-400 mb-3 px-3 py-2 bg-red-400/10 border border-red-400/20 rounded-lg">{uploadError}</p>}
                    <button onClick={handleUploadTrack} disabled={uploading}
                      className="w-full py-3 bg-[#166534] hover:bg-[#22c55e] hover:text-[#0a1a0f] rounded-xl text-sm font-semibold transition-all cursor-pointer border-none disabled:opacity-70 flex items-center justify-center gap-2 min-h-[44px]">
                      {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : uploadSuccess ? <><Check size={16} /> Uploaded!</>
                        : <><Upload size={16} /> Upload Track</>}
                    </button>
                  </div>
                )}

                {/* Track list */}
                {tracks.length === 0 ? (
                  <div className="text-center py-16 text-[#6b8a6e]">
                    <Music size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No tracks yet. Upload your first one!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tracks.map((track, i) => (
                      <div key={track.id} className="flex items-center gap-4 p-4 bg-[#0d2010] border border-[#4ade80]/5 rounded-xl hover:border-[#4ade80]/20 transition-all group">
                        <span className="text-xs text-[#6b8a6e] w-5 text-right">{i + 1}</span>
                        <div className="w-10 h-10 bg-[#1a3a20] rounded-lg flex items-center justify-center flex-shrink-0">
                          <Music size={16} className="text-[#4ade80]/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{track.title}</p>
                          <p className="text-xs text-[#6b8a6e]">{track.albums?.title || 'Single'}</p>
                        </div>
                        <span className="text-xs text-[#6b8a6e]">{formatDuration(track.duration_seconds)}</span>
                        <span className="text-xs text-[#4ade80]">${track.price || 'Free'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ALBUMS TAB */}
            {tab === 'albums' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Your Albums ({albums.length})</h2>
                  <button onClick={() => setShowAlbumForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#166534] hover:bg-[#22c55e] hover:text-[#0a1a0f] rounded-xl text-sm font-semibold transition-all cursor-pointer border-none">
                    <Plus size={16} /> New Album
                  </button>
                </div>

                {showAlbumForm && (
                  <div className="bg-[#0d2010] border border-[#4ade80]/20 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold">New Album</h3>
                      <button onClick={() => setShowAlbumForm(false)} className="text-[#6b8a6e] hover:text-[#f0f7f0] cursor-pointer border-none bg-transparent"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs text-[#a3b8a5] mb-1.5">Album title *</label>
                        <input type="text" placeholder="Album name" value={albumForm.title}
                          onChange={e => setAlbumForm(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#a3b8a5] mb-1.5">Release date</label>
                        <input type="date" value={albumForm.release_date}
                          onChange={e => setAlbumForm(p => ({ ...p, release_date: e.target.value }))}
                          className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] outline-none focus:border-[#4ade80]/40 transition-colors" />
                      </div>
                    </div>
                    <div className="mb-5">
                      <label className="block text-xs text-[#a3b8a5] mb-1.5">Cover image</label>
                      <label className="flex items-center gap-3 w-full bg-[#122016] border border-dashed border-[#4ade80]/20 hover:border-[#4ade80]/40 rounded-xl px-4 py-4 cursor-pointer transition-colors">
                        <Upload size={18} className="text-[#4ade80]" />
                        <span className="text-sm text-[#6b8a6e]">{albumCover ? albumCover.name : 'Click to select image'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setAlbumCover(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                    <button onClick={handleUploadAlbum} disabled={albumUploading}
                      className="w-full py-3 bg-[#166534] hover:bg-[#22c55e] hover:text-[#0a1a0f] rounded-xl text-sm font-semibold transition-all cursor-pointer border-none disabled:opacity-70 flex items-center justify-center gap-2 min-h-[44px]">
                      {albumUploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> Create Album</>}
                    </button>
                  </div>
                )}

                {albums.length === 0 ? (
                  <div className="text-center py-16 text-[#6b8a6e]">
                    <Album size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No albums yet. Create your first one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {albums.map(album => (
                      <div key={album.id} className="bg-[#0d2010] border border-[#4ade80]/5 rounded-2xl p-4 hover:border-[#4ade80]/20 transition-all">
                        <div className="aspect-square bg-[#1a3a20] rounded-xl mb-3 overflow-hidden">
                          {album.cover_url
                            ? <img src={album.cover_url} alt={album.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Album size={32} className="text-[#4ade80]/30" /></div>}
                        </div>
                        <p className="font-semibold text-sm truncate">{album.title}</p>
                        <p className="text-xs text-[#6b8a6e] mt-1">{album.release_date || 'No date'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STATS TAB */}
            {tab === 'stats' && (
              <div>
                <h2 className="text-lg font-bold mb-6">Your Stats</h2>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Total Plays', value: stats.total_plays, desc: 'Times your music has been played', color: '#4ade80' },
                      { label: 'Total Likes', value: stats.total_likes, desc: 'Tracks saved in listeners\' libraries', color: '#22c55e' },
                      { label: 'Avg Completion', value: `${stats.avg_completion}%`, desc: 'How much of your songs people finish', color: '#86efac' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-7">
                        <p className="text-4xl font-extrabold mb-2" style={{ color: s.color }}>{s.value}</p>
                        <p className="font-semibold text-sm mb-1">{s.label}</p>
                        <p className="text-xs text-[#6b8a6e] leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-8 bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-6">
                  <p className="text-sm text-[#6b8a6e]">📊 More detailed analytics coming soon — track-by-track breakdowns, listener demographics, and revenue reports.</p>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {tab === 'profile' && profile && (
              <div className="max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Artist Profile</h2>
                  <button onClick={() => setEditProfile(!editProfile)}
                    className="px-4 py-2 border border-[#4ade80]/20 rounded-xl text-sm text-[#a3b8a5] hover:text-[#f0f7f0] hover:border-[#4ade80]/40 transition-all cursor-pointer bg-transparent">
                    {editProfile ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <div className="bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-7 space-y-5">
                  {(['display_name', 'bio', 'genre', 'country'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-xs text-[#a3b8a5] mb-1.5 capitalize">{field.replace('_', ' ')}</label>
                      {editProfile ? (
                        field === 'bio'
                          ? <textarea value={profileForm[field]} onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))} rows={3}
                              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] outline-none focus:border-[#4ade80]/40 transition-colors resize-none" />
                          : <input type="text" value={profileForm[field]} onChange={e => setProfileForm(p => ({ ...p, [field]: e.target.value }))}
                              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] outline-none focus:border-[#4ade80]/40 transition-colors" />
                      ) : (
                        <p className="text-sm text-[#f0f7f0]">{profile[field] || <span className="text-[#6b8a6e] italic">Not set</span>}</p>
                      )}
                    </div>
                  ))}
                  {editProfile && (
                    <button onClick={handleSaveProfile}
                      className="w-full py-3 bg-[#166534] hover:bg-[#22c55e] hover:text-[#0a1a0f] rounded-xl text-sm font-semibold transition-all cursor-pointer border-none flex items-center justify-center gap-2">
                      <Check size={16} /> Save Changes
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}