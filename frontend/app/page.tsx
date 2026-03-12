"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import ArtistCarousel from '../components/ArtistCarousel'
import Blobs from '../components/Blobs'
import Petals from '../components/Petals'

// Hook que observa elementos y les agrega la clase 'revealed' al entrar en viewport
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target) // solo una vez
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export default function Landing() {
  const router = useRouter()
  useReveal()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

        .display { font-family: 'Cormorant Garamond', serif; }
        .body-text { font-family: 'DM Sans', sans-serif; }

        .grain-overlay {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        .section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #4ade80;
          opacity: 0.8;
        }

        .stat-card {
          background: linear-gradient(135deg, rgba(18,32,22,0.8) 0%, rgba(15,26,18,0.6) 100%);
          border: 1px solid rgba(74,222,128,0.12);
          backdrop-filter: blur(8px);
          transition: border-color 0.3s ease, transform 0.3s ease;
        }
        .stat-card:hover {
          border-color: rgba(74,222,128,0.28);
          transform: translateY(-2px);
        }

        .step-card {
          background: linear-gradient(135deg, rgba(18,32,22,0.7) 0%, rgba(15,26,18,0.5) 100%);
          border: 1px solid rgba(74,222,128,0.08);
          backdrop-filter: blur(6px);
          transition: all 0.3s ease;
        }
        .step-card:hover {
          border-color: rgba(74,222,128,0.2);
          background: linear-gradient(135deg, rgba(22,42,26,0.8) 0%, rgba(18,32,22,0.6) 100%);
        }

        .price-panel {
          background: linear-gradient(160deg, rgba(18,32,22,0.9) 0%, rgba(12,20,14,0.95) 100%);
          backdrop-filter: blur(16px);
        }

        .green-text {
          background: linear-gradient(135deg, #4ade80, #22c55e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .glow-btn {
          box-shadow: 0 0 24px rgba(74,222,128,0.2);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 40px rgba(74,222,128,0.4);
          transform: translateY(-1px);
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(74,222,128,0.2), transparent);
        }

        /* ── SCROLL ANIMATIONS ── */

        /* Fade up — default */
        [data-reveal] {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Fade from left */
        [data-reveal="left"] {
          transform: translateX(-40px);
        }

        /* Fade from right */
        [data-reveal="right"] {
          transform: translateX(40px);
        }

        /* Scale up */
        [data-reveal="scale"] {
          transform: scale(0.94) translateY(20px);
        }

        /* Revealed state — same for all */
        [data-reveal].revealed {
          opacity: 1;
          transform: translateY(0) translateX(0) scale(1);
        }

        /* Stagger delays via data-delay */
        [data-delay="1"] { transition-delay: 0.1s; }
        [data-delay="2"] { transition-delay: 0.2s; }
        [data-delay="3"] { transition-delay: 0.3s; }
        [data-delay="4"] { transition-delay: 0.4s; }
        [data-delay="5"] { transition-delay: 0.5s; }
        [data-delay="6"] { transition-delay: 0.6s; }

        /* Hero elements start visible but animate in on load */
        .hero-label {
          opacity: 0;
          transform: translateY(16px);
          animation: heroFadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        }
        .hero-title {
          opacity: 0;
          transform: translateY(24px);
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
        }
        .hero-divider {
          opacity: 0;
          width: 0;
          animation: heroDivider 0.8s ease 0.9s forwards;
        }
        .hero-body {
          opacity: 0;
          transform: translateY(16px);
          animation: heroFadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
        }
        .hero-carousel {
          opacity: 0;
          transform: translateY(24px);
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards;
        }

        @keyframes heroFadeUp {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroDivider {
          to { opacity: 1; width: 64px; }
        }
      `}</style>

      <div className="grain-overlay" />
      <Petals count={22} />

      <div className="min-h-screen text-[#f0f7f0] body-text relative"
        style={{ background: 'linear-gradient(160deg, #071009 0%, #0a1a0f 40%, #0d1f12 70%, #071009 100%)' }}>

        <Navbar />

        {/* ── HERO ── */}
        <section className="relative flex flex-col items-center justify-center text-center min-h-screen pt-32 px-12 overflow-hidden">
          <Blobs />
          <div className="relative z-10 w-full flex flex-col items-center">
            <p className="hero-label section-label mb-8 tracking-[0.35em]">A new kind of music platform</p>
            <h1 className="hero-title display font-light text-[clamp(64px,8vw,112px)] leading-[1.0] mb-8 max-w-[1100px] mx-auto"
              style={{ letterSpacing: '-0.02em' }}>
              The <em className="italic" style={{ color: '#4ade80' }}>garden</em> where<br />
              music <em className="italic">flourishes</em>
            </h1>
            <div className="hero-divider divider mb-8" style={{ height: '1px' }} />
            <p className="hero-body text-[15px] text-[#7a9e7d] leading-[1.9] max-w-[560px] mx-auto font-light tracking-wide">
              Groove Garden is a space where artists are nurtured, not overlooked.
              Music cultivated with intention — supported by community, given the
              tools it needs to truly flourish.
            </p>
            <div className="hero-carousel mt-14 w-full">
              <ArtistCarousel />
            </div>
          </div>
        </section>

        <div className="divider mx-12" />

        {/* ── MANIFESTO ── */}
        <section className="relative px-16 py-28">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-24 items-start">

            <div data-reveal="left">
              <p className="section-label mb-6">Our manifesto</p>
              <h2 className="display font-light text-[clamp(42px,4.5vw,64px)] leading-[1.1] mb-8"
                style={{ letterSpacing: '-0.02em' }}>
                <span className="green-text italic">Artists</span> are{' '}
                <em className="italic">not</em><br />
                disposable content
              </h2>
              <p className="text-[13px] text-[#7a9e7d] leading-[2] font-light max-w-[400px]">
                Traditional streaming platforms reduce music to passive consumption.
                Groove Garden was built to change that — every stream has meaning,
                every artist is valued, and every listen plays a role in the ecosystem.
              </p>
              <p className="text-[13px] text-[#7a9e7d] leading-[2] font-light max-w-[400px] mt-4">
                We are not chasing volume. We are creating the ballroom between artists
                and listeners — a garden where community helps determine what truly flourishes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-12">
              {[
                { big: '70%', desc: 'Of every subscription goes directly to the artists you support. No hidden intermediaries.' },
                { title: 'Sustainable Growth', desc: 'We reward artists — not viral spikes or disposable content.' },
                { title: 'Direct Support', desc: 'Choose exactly which artists your subscription empowers.' },
                { title: 'Transparent', desc: 'Clear revenue distribution. No black boxes. No manipulation.' },
              ].map((s, i) => (
                <div key={i} data-reveal="scale" data-delay={String(i + 1)} className="stat-card rounded-2xl p-7">
                  {s.big && <span className="display block font-light text-[56px] leading-none mb-3 green-text">{s.big}</span>}
                  {s.title && <h3 className="display font-semibold text-[20px] leading-tight mb-3 text-[#e8f5e8]">{s.title}</h3>}
                  <p className="text-[11px] text-[#5a7a5d] leading-relaxed font-light tracking-wide">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider mx-12" />

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="relative px-16 py-28 overflow-hidden">
          <Blobs />
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 gap-24 items-center relative z-10">

            <div data-reveal="left">
              <p className="section-label mb-6">How it works</p>
              <h2 className="display font-light text-[clamp(42px,4.5vw,64px)] leading-[1.05] mb-8"
                style={{ letterSpacing: '-0.02em' }}>
                A <em className="italic green-text">place</em><br />
                where music<br />
                <em className="italic">grows</em> with you
              </h2>
              <p className="text-[13px] text-[#7a9e7d] leading-[2] font-light">
                Not just streaming — an ecosystem. Your attention has weight.
                Artists are seeds. Every listen helps something real grow.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { num: '01', title: 'Your experience has value.', body: 'Discover new artists, listen to songs you like from our human-curated playlists. The music you save has an impact and a weight.' },
                { num: '02', title: 'Your money, directly to your artists.', body: 'Choose to pay per song or subscribe monthly. Either way, 70% goes straight to the artist — no intermediaries, no black boxes.' },
                { num: '03', title: 'See what you love grow.', body: 'Track the impact of your support in real time. See how your listens and contributions help artists reach new audiences.' },
              ].map((s, i) => (
                <div key={s.num} data-reveal data-delay={String(i + 1)} className="step-card rounded-2xl p-6 flex gap-6">
                  <span className="display font-light text-[28px] text-[#4ade80] min-w-[48px] opacity-60">{s.num}</span>
                  <div>
                    <h3 className="display font-semibold text-[17px] mb-2 text-[#e8f5e8]">{s.title}</h3>
                    <p className="text-[12px] text-[#5a7a5d] leading-relaxed font-light">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider mx-12" />

        {/* ── PRICING ── */}
        <section id="pricing" className="relative px-16 py-28">
          <div className="max-w-[1200px] mx-auto">
            <div data-reveal>
              <p className="section-label mb-6">Pricing</p>
              <h2 className="display font-light text-[clamp(42px,4.5vw,64px)] mb-16"
                style={{ letterSpacing: '-0.02em' }}>
                Two ways to <em className="italic green-text">help</em>
              </h2>
            </div>

            <div data-reveal="scale" className="grid grid-cols-2 border border-[rgba(74,222,128,0.12)] rounded-3xl overflow-hidden"
              style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,222,128,0.05) inset' }}>

              {/* Pay per song */}
              <div className="price-panel p-10">
                <span className="section-label block mb-4">Free plan</span>
                <h3 className="display font-light text-[36px] mb-3 leading-tight">
                  <span className="green-text italic">Pay</span> per song
                </h3>
                <p className="text-[12px] text-[#5a7a5d] leading-relaxed pb-8 mb-8 border-b border-[rgba(74,222,128,0.08)] font-light">
                  No subscription. Pay for the music you like and support artists directly.
                </p>
                <h4 className="display font-light text-[26px] leading-tight mb-5 text-[#e8f5e8]">
                  Pay <em className="italic green-text">only</em><br />for what you want.
                </h4>
                <p className="text-[12px] text-[#5a7a5d] leading-relaxed mb-6 font-light">
                  No subscription model. Just a small, transparent price per song.
                  Buy what you love, own it forever.
                </p>
                {[
                  { title: 'How are you supporting artists?', body: 'Every song costs $0.99, then $0.69 goes straight to them — 70%. The remaining $0.30 sustains the platform.' },
                  { title: 'What do you get?', body: 'Once you buy it, it is yours forever. No DRM. No expiration. High-quality audio, yours to keep offline.' },
                ].map(item => (
                  <div key={item.title} className="stat-card rounded-xl p-4 mb-3">
                    <strong className="block text-[12px] text-[#c8dfc8] mb-1.5 font-medium">{item.title}</strong>
                    <p className="text-[11px] text-[#5a7a5d] leading-relaxed font-light">{item.body}</p>
                  </div>
                ))}
                <button onClick={() => router.push('/auth')}
                  className="w-full mt-6 py-3.5 rounded-full text-[11px] tracking-[0.15em] uppercase font-medium cursor-pointer border border-[rgba(74,222,128,0.2)] text-[#a3c8a5] hover:border-[rgba(74,222,128,0.4)] hover:text-[#f0f7f0] transition-all"
                  style={{ background: 'rgba(18,32,22,0.6)' }}>
                  Get started
                </button>
              </div>

              {/* Smart subscription */}
              <div className="price-panel p-10 border-l border-[rgba(74,222,128,0.08)]">
                <span className="section-label block mb-4">Paid subscription</span>
                <h3 className="display font-light text-[36px] mb-3 leading-tight">
                  <span className="green-text italic">Smart</span> subscription
                </h3>
                <p className="text-[12px] text-[#5a7a5d] leading-relaxed pb-8 mb-8 border-b border-[rgba(74,222,128,0.08)] font-light">
                  The best way to support artists you like, based on how much you listen.
                </p>
                {[
                  { label: 'Listener buys', sub: '1 Song', amount: '$0.99' },
                  { label: 'The artist gets', sub: '70%', amount: '$0.69' },
                  { label: 'Platform infrastructure', sub: '30%', amount: '$0.30' },
                ].map(({ label, sub, amount }) => (
                  <div key={label} className="stat-card flex items-center gap-4 rounded-xl px-5 py-4 mb-2">
                    <div className="flex-1">
                      <div className="text-[12px] text-[#a3b8a5] font-light">{label}</div>
                      <div className="text-[10px] text-[#4a6a4d] mt-0.5 tracking-wide uppercase">{sub}</div>
                    </div>
                    <div className="display font-semibold text-[18px] text-[#e8f5e8]">{amount}</div>
                  </div>
                ))}
                <div className="flex justify-center my-8">
                  <svg viewBox="0 0 120 120" className="w-[110px] h-[110px]"
                    style={{ filter: 'drop-shadow(0 0 16px rgba(74,222,128,0.2))' }}>
                    <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(18,40,22,0.8)" strokeWidth="14"/>
                    <circle cx="60" cy="60" r="46" fill="none" stroke="url(#grad)" strokeWidth="14"
                      strokeDasharray="289" strokeDashoffset="86.7" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e"/>
                        <stop offset="100%" stopColor="#4ade80"/>
                      </linearGradient>
                    </defs>
                    <text x="60" y="54" textAnchor="middle" fill="white" fontSize="17" fontWeight="300"
                      fontFamily="Cormorant Garamond, serif">70%</text>
                    <text x="60" y="70" textAnchor="middle" fill="#5a7a5d" fontSize="7.5"
                      fontFamily="DM Sans, sans-serif" letterSpacing="1">to artist</text>
                  </svg>
                </div>
                <button onClick={() => router.push('/auth')}
                  className="glow-btn w-full py-3.5 rounded-full text-[11px] tracking-[0.15em] uppercase font-medium cursor-pointer border-none"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)', color: '#071009' }}>
                  Get started
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="divider mx-12" />

        {/* ── FINAL CTA ── */}
        <section className="relative text-center px-12 py-32 overflow-hidden">
          <Blobs />
          <div data-reveal className="relative z-10">
            <p className="section-label mb-8 tracking-[0.35em]">Join the garden</p>
            <h2 className="display font-light text-[clamp(42px,5vw,72px)] leading-[1.1] mb-10"
              style={{ letterSpacing: '-0.02em' }}>
              Ready to <em className="italic green-text">start</em> supporting<br />
              artists <em className="italic">you</em> love?
            </h2>
            <button
              onClick={() => router.push('/auth')}
              className="glow-btn px-14 py-4 rounded-full text-[11px] tracking-[0.2em] uppercase font-medium cursor-pointer border border-[rgba(74,222,128,0.25)] text-[#a3c8a5] hover:text-[#f0f7f0] hover:border-[rgba(74,222,128,0.5)] transition-all"
              style={{ background: 'rgba(18,32,22,0.5)', backdropFilter: 'blur(8px)' }}
            >
              Get started
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="px-16 py-8 border-t border-[rgba(74,222,128,0.08)] flex items-center justify-between">
          <span className="display text-[13px] text-[#3a5a3d] tracking-widest uppercase">Groove Garden</span>
          <span className="text-[10px] text-[#2a3a2d] tracking-widest uppercase">© 2025</span>
        </div>
      </div>
    </>
  )
}