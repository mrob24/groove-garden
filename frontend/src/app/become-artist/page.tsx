"use client"

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const GENRES = ['Indie', 'Urbano', 'Electronic', 'Pop', 'Rock', 'Jazz', 'Classical', 'R&B', 'Folk', 'Metal', 'Reggae', 'Latin']

const inputCls = `
  w-full bg-[#0a150d] border border-[#3dba6f]/15 rounded-xl px-4 py-3
  text-sm text-[#e8f5ec] placeholder-[#3a6045]
  outline-none focus:border-[#3dba6f]/50 focus:bg-[#0b1c0f]
  transition-all duration-150
`

export default function BecomeArtist() {
  const router = useRouter()
  const [form,    setForm]    = useState({ display_name: '', bio: '', genre: '', country: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.display_name || !form.genre) { setError('Artist name and genre are required'); return }
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('gg_user') || '{}')
      if (!user.id) { setError('You must be signed in first'); return }
      const res = await fetch('/api/become-artist/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong'); return }
      localStorage.setItem('gg_user', JSON.stringify({ ...user, artist_id: data.artist_id }))
      setSuccess(true)
      setTimeout(() => router.push('/artist'), 1600)
    } catch { setError('Could not connect to server') }
    finally { setLoading(false) }
  }

  return (
    <div
      className="min-h-screen bg-[#0b1810] text-[#e8f5ec] flex"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        .gg-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
      `}</style>

      {/* ── Left: brand panel ── */}
      <div className="hidden lg:flex flex-col w-[400px] flex-shrink-0 bg-[#071008] border-r border-[#3dba6f]/8 px-12 py-14 relative overflow-hidden">
        {/* Organic background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#3dba6f]/4 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#3dba6f]/5 blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f"/>
            <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="text-sm font-semibold text-[#8ab89a] tracking-wide">Groove Garden</span>
        </div>

        {/* Hero copy */}
        <div className="mt-auto mb-auto py-16 relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3dba6f] mb-5">For artists</p>
          <h2 className="gg-serif text-5xl font-medium leading-tight text-[#e8f5ec] mb-6">
            Plant your<br />
            <em className="text-[#3dba6f]">roots here.</em>
          </h2>
          <p className="text-sm text-[#4a7a5a] leading-relaxed mb-10 max-w-[260px]">
            Set up your profile in under a minute. Upload tracks, sync lyrics, and reach listeners who genuinely care.
          </p>

          <div className="space-y-3.5">
            {[
              'Upload tracks and albums',
              'Sync lyrics with the built-in syncer',
              'Track plays, likes, and completion',
            ].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#3dba6f]/15 border border-[#3dba6f]/25 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-[#3dba6f]" />
                </div>
                <p className="text-sm text-[#8ab89a]/70">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#3a6045] relative">© {new Date().getFullYear()} Groove Garden</p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[420px]">

          <Link href="/player"
            className="inline-flex items-center gap-1.5 text-xs text-[#4a7a5a] hover:text-[#8ab89a] transition-colors no-underline mb-8 uppercase tracking-widest">
            <ArrowLeft size={12} /> Back to player
          </Link>

          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#3dba6f]/15 border border-[#3dba6f]/25 flex items-center justify-center mx-auto mb-5">
                <Check size={26} className="text-[#3dba6f]" />
              </div>
              <h1 className="gg-serif text-4xl font-medium text-[#e8f5ec] mb-2">You're live.</h1>
              <p className="text-sm text-[#4a7a5a]">Heading to your studio…</p>
            </div>
          ) : (
            <>
              {/* Mobile logo */}
              <div className="flex items-center gap-2.5 mb-8 lg:hidden">
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                  <path d="M14 3C14 3 9 8 9 14C9 17.5 11.2 20 14 21C16.8 20 19 17.5 19 14C19 8 14 3 14 3Z" fill="#3dba6f"/>
                  <path d="M14 21L14 26" stroke="#3dba6f" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span className="text-sm font-semibold text-[#8ab89a]">Groove Garden</span>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#3dba6f] mb-3">Artist profile</p>
                <h1 className="gg-serif text-4xl font-medium text-[#e8f5ec] leading-snug">
                  Set up your<br />artist profile
                </h1>
              </div>

              {/* Form */}
              <div className="bg-[#0f1f14] border border-[#3dba6f]/10 rounded-2xl p-7 space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#8ab89a] mb-2">
                    Artist name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="display_name" placeholder="How the world will know you"
                    value={form.display_name} onChange={handleChange} className={inputCls} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8ab89a] mb-2">Bio</label>
                  <textarea name="bio" placeholder="Tell your story in a few sentences…"
                    value={form.bio} onChange={handleChange} rows={3}
                    className={`${inputCls} resize-none leading-relaxed`} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8ab89a] mb-2">
                      Genre <span className="text-red-400">*</span>
                    </label>
                    <select name="genre" value={form.genre} onChange={handleChange}
                      className={`${inputCls} cursor-pointer`}>
                      <option value="" disabled>Select…</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8ab89a] mb-2">Country</label>
                    <input type="text" name="country" placeholder="CR, US, MX…"
                      value={form.country} onChange={handleChange} className={inputCls} />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 px-4 py-3 bg-red-400/6 border border-red-400/15 rounded-xl">{error}</p>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full py-3.5 bg-[#3dba6f] text-[#071008] rounded-xl text-sm font-semibold
                    hover:bg-[#4ecf80] active:scale-[0.98] transition-all cursor-pointer border-none
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
                  {loading
                    ? <span className="w-4 h-4 border border-[#071008]/30 border-t-[#071008] rounded-full animate-spin" />
                    : 'Create artist profile →'}
                </button>
              </div>

              <p className="text-xs text-center text-[#3a6045] mt-5">
                By continuing you agree to our{' '}
                <Link href="/terms" className="text-[#4a7a5a] hover:text-[#8ab89a] transition-colors">terms of service</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}