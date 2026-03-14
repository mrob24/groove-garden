"use client"

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const GENRES = ['Indie', 'Urbano', 'Electronic', 'Pop', 'Rock', 'Jazz', 'Classical', 'R&B', 'Folk', 'Metal', 'Reggae', 'Latin']

export default function BecomeArtist() {
  const router = useRouter()
  const [form, setForm] = useState({ display_name: '', bio: '', genre: '', country: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
  if (!form.display_name || !form.genre) { setError('Nombre artístico y género son requeridos'); return }
  setLoading(true)
  try {
    const user = JSON.parse(localStorage.getItem('gg_user') || '{}')
    if (!user.id) { setError('Debes iniciar sesión primero'); return }

    const res = await fetch('/api/become-artist/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user.id   // ← esto faltaba
      },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Algo salió mal'); return }
    localStorage.setItem('gg_user', JSON.stringify({ ...user, artist_id: data.artist_id }))
    router.push('/artist')
  } catch {
    setError('No se pudo conectar al servidor')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-[#f0f7f0] flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 48px),
                         repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 48px)`
      }} />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#4ade80]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-[#22c55e]/5 blur-[100px] rounded-full" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Back */}
        <Link href="/player" className="text-xs text-[#6b8a6e] hover:text-[#4ade80] transition-colors mb-8 flex items-center gap-2 no-underline">
          ← Back to player
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
              <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
              <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10 22 C10 22, 8 21, 7 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M18 22 C18 22, 20 21, 21 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-extrabold text-xs tracking-widest">GROOVE GARDEN</span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-3">
            Plant your <em className="text-[#4ade80] not-italic">roots</em>
          </h1>
          <p className="text-sm text-[#a3b8a5] leading-relaxed">
            Set up your artist profile. Your music will reach listeners who actually care.
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#0d2010] border border-[#4ade80]/10 rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-xs text-[#a3b8a5] mb-1.5">Artist name <span className="text-[#4ade80]">*</span></label>
            <input
              type="text" name="display_name" placeholder="How the world will know you"
              value={form.display_name} onChange={handleChange}
              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-[#a3b8a5] mb-1.5">Bio</label>
            <textarea
              name="bio" placeholder="Tell your story..." value={form.bio}
              onChange={handleChange} rows={3}
              className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#a3b8a5] mb-1.5">Genre <span className="text-[#4ade80]">*</span></label>
              <select
                name="genre" value={form.genre} onChange={handleChange}
                className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] outline-none focus:border-[#4ade80]/40 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select genre</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#a3b8a5] mb-1.5">Country</label>
              <input
                type="text" name="country" placeholder="CR, US, MX..."
                value={form.country} onChange={handleChange}
                className="w-full bg-[#122016] border border-[#4ade80]/10 rounded-xl px-4 py-3 text-sm text-[#f0f7f0] placeholder-[#6b8a6e] outline-none focus:border-[#4ade80]/40 transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 px-3.5 py-2.5 bg-red-400/10 border border-red-400/20 rounded-lg">{error}</p>
          )}

          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full py-4 bg-[#166534] border-none rounded-xl text-[#f0f7f0] font-semibold hover:bg-[#22c55e] hover:text-[#0a1a0f] hover:-translate-y-px transition-all cursor-pointer disabled:opacity-70 flex items-center justify-center min-h-[50px] mt-2"
          >
            {loading
              ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Start growing 🌱'
            }
          </button>
        </div>
      </div>
    </div>
  )
}