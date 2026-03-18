"use client"

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import ArtistCarousel from '../components/ArtistCarousel'
import Blobs from '../components/Blobs'
import Petals from '../components/Petals'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

const STEPS = [
  {
    num: '#1',
    title: 'Your experience and impact is valuable.',
    body: 'Discover new artists, listen to songs you like from our human-curated playlists — not whatever an algorithm wants. The music you save has an impact and a weight.',
  },
  {
    num: '#2',
    title: 'Your money, directly to your artists.',
    body: 'Choose to pay per song or subscribe monthly. Either way, 70% goes straight to the artist; no intermediaries, no black boxes.',
  },
  {
    num: '#3',
    title: 'See what you love grow.',
    body: "Track the impact of your support in real time. See how your listens and contributions help artists grow, release new work, and reach new audiences. You're not just streaming; you're part of the artist's story.",
  },
]

export default function Landing() {
  const router = useRouter()
  const [plan, setPlan] = useState<'song' | 'sub'>('song')
  useReveal()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .serif { font-family: 'Cormorant Garamond', serif; }
        .sans  { font-family: 'DM Sans', sans-serif; }

        .grain {
          position: fixed; inset: 0; pointer-events: none; z-index: 1; opacity: 0.022;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 200px;
        }

        /* ── Tokens ── */
        .accent  { color: #3dba6f; }
        .muted   { color: #7a9e7d; }
        .soft    { color: #a3c8a5; }
        .faint   { color: #4a7a5a; }

        .eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px; letter-spacing: 0.26em;
          text-transform: uppercase; color: #3dba6f;
        }

        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(61,186,111,0.15), transparent);
          margin: 0 64px;
        }

        /* ── Step cards (right column in How it works) ── */
        .step-card {
          background: rgba(12,22,15,0.7);
          border: 1px solid rgba(61,186,111,0.1);
          border-radius: 16px;
          padding: 22px 20px 22px 0;
          display: grid;
          grid-template-columns: 72px 1fr;
          align-items: flex-start;
          transition: border-color 0.25s;
        }
        .step-card:hover { border-color: rgba(61,186,111,0.22); }

        .step-num-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 2px;
        }

        .step-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px; font-weight: 300;
          color: #3dba6f; line-height: 1;
        }

        .step-icon {
          margin-top: 12px;
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(61,186,111,0.07);
          border: 1px solid rgba(61,186,111,0.12);
          display: flex; align-items: center; justify-content: center;
        }

        /* ── Plan toggle (pricing section) ── */
        .plan-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid rgba(61,186,111,0.1);
        }

        .plan-tab {
          padding: 28px 32px;
          cursor: pointer; background: transparent; border: none;
          text-align: left; font-family: 'DM Sans', sans-serif;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: background 0.2s, opacity 0.2s;
        }
        .plan-tab.active { border-bottom-color: #3dba6f; }
        .plan-tab:not(.active) { opacity: 0.45; }
        .plan-tab:not(.active):hover { opacity: 0.7; background: rgba(61,186,111,0.02); }
        .plan-tab + .plan-tab { border-left: 1px solid rgba(61,186,111,0.08); }

        /* ── Plan content grid (inside each plan panel) ── */
        .plan-content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          animation: planFade 0.3s ease forwards;
        }
        @keyframes planFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }

        .plan-left  { padding: 36px 32px; border-right: 1px solid rgba(61,186,111,0.08); }
        .plan-right { padding: 36px 32px; }

        /* ── Breakdown rows ── */
        .brow {
          display: flex; align-items: center; gap: 12px;
          background: rgba(10,18,12,0.85);
          border: 1px solid rgba(61,186,111,0.1);
          border-radius: 12px; padding: 14px 16px;
          transition: border-color 0.2s;
        }
        .brow.hi { border-color: rgba(61,186,111,0.25); }
        .brow-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: rgba(61,186,111,0.07);
          border: 1px solid rgba(61,186,111,0.12);
          display: flex; align-items: center; justify-content: center;
        }
        .brow-icon.hi { background: rgba(61,186,111,0.13); border-color: rgba(61,186,111,0.25); }
        .brow-amt {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px; font-weight: 400; color: #e8f5ec; flex-shrink: 0;
        }
        .brow-amt.hi { color: #3dba6f; }

        /* ── Artist bars ── */
        .arow {
          display: flex; align-items: center; gap: 12px;
          background: rgba(10,18,12,0.85);
          border: 1px solid rgba(61,186,111,0.1);
          border-radius: 12px; padding: 13px 16px;
        }
        .aicon {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: rgba(61,186,111,0.09);
          border: 1px solid rgba(61,186,111,0.15);
          display: flex; align-items: center; justify-content: center;
        }
        .abar-w { flex: 1; height: 3px; background: rgba(61,186,111,0.1); border-radius: 2px; overflow: hidden; }
        .abar   { height: 100%; background: #3dba6f; border-radius: 2px; }
        .aamt   { font-size: 13px; font-weight: 500; color: #e8f5ec; flex-shrink: 0; }

        /* ── FAQ inline card ── */
        .faq-card {
          background: rgba(8,16,10,0.85);
          border: 1px solid rgba(61,186,111,0.1);
          border-radius: 12px; padding: 16px;
        }

        /* ── Buttons ── */
        .btn-primary {
          background: #3dba6f; color: #071008;
          border: none; border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: #4ecf80; transform: translateY(-1px); }

        .btn-ghost {
          background: rgba(12,22,15,0.5);
          border: 1px solid rgba(61,186,111,0.2);
          color: #a3c8a5; border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          cursor: pointer; backdrop-filter: blur(8px);
          transition: border-color 0.25s, color 0.25s, transform 0.15s;
        }
        .btn-ghost:hover {
          border-color: rgba(61,186,111,0.45);
          color: #e8f5ec; transform: translateY(-1px);
        }

        /* ── Scroll reveal ── */
        [data-reveal] {
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1),
                      transform 0.85s cubic-bezier(0.16,1,0.3,1);
        }
        [data-reveal="left"]  { transform: translateX(-30px); }
        [data-reveal="right"] { transform: translateX(30px); }
        [data-reveal="scale"] { transform: scale(0.95) translateY(14px); }
        [data-reveal].revealed { opacity: 1; transform: none; }
        [data-delay="1"] { transition-delay: 0.08s; }
        [data-delay="2"] { transition-delay: 0.18s; }
        [data-delay="3"] { transition-delay: 0.28s; }

        /* ── Hero animations ── */
        .h-label   { opacity:0; transform:translateY(12px); animation: fu 0.85s cubic-bezier(0.16,1,0.3,1) 0.15s forwards; }
        .h-title   { opacity:0; transform:translateY(22px); animation: fu 1s   cubic-bezier(0.16,1,0.3,1) 0.32s forwards; }
        .h-rule    { opacity:0; width:0;                    animation: gr 0.75s ease 0.85s forwards; }
        .h-body    { opacity:0; transform:translateY(14px); animation: fu 0.85s cubic-bezier(0.16,1,0.3,1) 0.58s forwards; }
        .h-cta     { opacity:0; transform:translateY(10px); animation: fu 0.8s  cubic-bezier(0.16,1,0.3,1) 0.82s forwards; }
        .h-carousel{ opacity:0; transform:translateY(18px); animation: fu 0.9s  cubic-bezier(0.16,1,0.3,1) 1.0s forwards; }
        @keyframes fu { to { opacity:1; transform:none; } }
        @keyframes gr { to { opacity:1; width:52px; } }
      `}</style>

      <div className="grain" />
      <Petals count={20} />

      <div className="sans min-h-screen text-[#e8f5ec] relative"
        style={{ background: 'linear-gradient(160deg, #060e08 0%, #091509 40%, #0c1c0e 70%, #060e08 100%)' }}>

        <Navbar />

        {/* ══ HERO ══ */}
        <section className="relative flex flex-col items-center justify-center text-center min-h-screen pt-32 pb-20 px-16 overflow-hidden">
          <Blobs />
          <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center">
            <p className="h-label eyebrow mb-7">A new kind of music platform</p>
            <h1 className="h-title serif font-light leading-[1.0] mb-8 max-w-[1000px]"
              style={{ fontSize: 'clamp(60px,7.5vw,108px)', letterSpacing: '-0.025em' }}>
              The <em className="italic accent">garden</em> where<br />
              music <em className="italic" style={{ color: '#e8f5ec' }}>flourishes</em>
            </h1>
            <div className="h-rule mb-8"
              style={{ height: '1px', background: 'linear-gradient(to right, transparent, rgba(61,186,111,0.3), transparent)' }} />
            <p className="h-body text-[15px] soft leading-[1.95] max-w-[520px] font-light tracking-wide">
              Groove Garden is a space where artists are nurtured, not overlooked.
              Music cultivated with intention — supported by community,
              given the tools it needs to truly flourish.
            </p>
            <button onClick={() => router.push('/auth')}
              className="btn-primary h-cta mt-10 px-12 py-4">
              Get started free
            </button>
            <div className="h-carousel mt-14 w-full">
              <ArtistCarousel />
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ══ HOW IT WORKS ══ */}
        <section id="how-it-works" className="relative px-16 py-28 overflow-hidden">
          <Blobs />
          <div className="max-w-6xl mx-auto grid grid-cols-2 gap-20 items-start relative z-10">

            {/* Left — heading + body */}
            <div data-reveal="left" className="sticky top-32">
              <p className="eyebrow mb-5">— How it works</p>
              <h2 className="serif font-light leading-[1.0] mb-8"
                style={{ fontSize: 'clamp(52px,5.5vw,80px)', letterSpacing: '-0.025em' }}>
                A <em className="italic accent">place</em><br />
                where music<br />
                <em className="italic" style={{ color: '#e8f5ec' }}>grows</em> with you
              </h2>
              <div className="text-[14px] soft leading-[2] font-light space-y-0 max-w-[300px]">
                <p>Not just streaming — an ecosystem.</p>
                <p>Your attention has weight.</p>
                <p>Artists are seeds.</p>
                <p>Every listen helps something real grow.</p>
              </div>
            </div>

            {/* Right — step cards */}
            <div className="flex flex-col gap-3 pt-2">
              {STEPS.map((s, i) => (
                <div key={s.num} data-reveal data-delay={String(i + 1)} className="step-card">
                  <div className="step-num-wrap">
                    <span className="step-num">{s.num}</span>
                    <div className="step-icon">
                      {i === 0 && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3dba6f" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                      )}
                      {i === 1 && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3dba6f" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/>
                        </svg>
                      )}
                      {i === 2 && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3dba6f" strokeWidth="1.5">
                          <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="serif font-semibold text-[18px] leading-snug mb-2.5 text-[#e8f5ec]">
                      {s.title}
                    </h3>
                    <p className="text-[13px] muted leading-relaxed font-light">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ══ PRICING ══ */}
        <section id="pricing" className="relative px-16 py-28">
          <div className="max-w-6xl mx-auto">

            {/* Section header */}
            <div data-reveal className="mb-12">
              <p className="eyebrow mb-4">Pricing</p>
              <h2 className="serif font-light leading-tight"
                style={{ fontSize: 'clamp(42px,5vw,64px)', letterSpacing: '-0.025em' }}>
                Two ways to <em className="italic accent">help</em>
              </h2>
            </div>

            {/* The whole pricing card */}
            <div data-reveal="scale"
              className="rounded-3xl overflow-hidden"
              style={{ border: '1px solid rgba(61,186,111,0.12)', background: 'rgba(8,16,10,0.96)' }}>

              {/* ── Plan selector tabs ── */}
              <div className="plan-selector">
                <button
                  className={`plan-tab ${plan === 'song' ? 'active' : ''}`}
                  onClick={() => setPlan('song')}>
                  <span className="eyebrow block mb-3">Free Plan</span>
                  <span className="serif font-light leading-tight text-[#e8f5ec]"
                    style={{ fontSize: 'clamp(28px,3vw,40px)' }}>
                    <em className="italic accent">Pay</em> per song
                  </span>
                  <p className="text-[13px] muted font-light mt-2 leading-relaxed">
                    No subscription, pay for the music you like and support artists directly.
                  </p>
                </button>
                <button
                  className={`plan-tab ${plan === 'sub' ? 'active' : ''}`}
                  onClick={() => setPlan('sub')}>
                  <span className="eyebrow block mb-3">Paid Subscription</span>
                  <span className="serif font-light leading-tight text-[#e8f5ec]"
                    style={{ fontSize: 'clamp(28px,3vw,40px)' }}>
                    <em className="italic accent">Smart</em> subscription
                  </span>
                  <p className="text-[13px] muted font-light mt-2 leading-relaxed">
                    The best way to support artists you like, based on how much you listen to them.
                  </p>
                </button>
              </div>

              {/* ── PAY PER SONG ── */}
              {plan === 'song' && (
                <div key="song" className="plan-content-grid">
                  <div className="plan-left">
                    <h3 className="serif font-light leading-tight text-[#e8f5ec] mb-4"
                      style={{ fontSize: 'clamp(32px,3.5vw,48px)', letterSpacing: '-0.02em' }}>
                      Pay <em className="italic accent">only</em> for<br />
                      what you want.
                    </h3>
                    <p className="text-[14px] muted leading-relaxed font-light mb-8">
                      No subscription model. Just a small, transparent price per song.
                      Buy what you love, own it forever. No gimmicks. No fine print.
                    </p>
                    <div className="space-y-2.5">
                      <div className="faq-card">
                        <p className="text-[13px] text-[#c8dfc8] font-medium mb-2">How are you supporting artists?</p>
                        <p className="text-[12px] muted leading-relaxed font-light">
                          Every song costs $0.99, then $0.69 goes straight to them — 70%.
                          The remaining $0.30 sustains the platform. No hidden cuts. No complexity.
                        </p>
                      </div>
                      <div className="faq-card">
                        <p className="text-[13px] text-[#c8dfc8] font-medium mb-2">What do you get?</p>
                        <p className="text-[12px] muted leading-relaxed font-light">
                          Once you buy it, it's yours forever. No DRM. No expiration.
                          Just high-quality audio, yours to keep and listen offline.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="plan-right flex flex-col gap-5">
                    <p className="eyebrow">How much money goes to artists?</p>
                    <div className="space-y-2">
                      <div className="brow">
                        <div className="brow-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7a5a" strokeWidth="1.5">
                            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] soft font-light">Listener buys</p>
                          <p className="text-[11px] faint font-light">1 Song</p>
                        </div>
                        <span className="brow-amt">$0.99</span>
                      </div>
                      <div className="brow hi">
                        <div className="brow-icon hi">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3dba6f" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#e8f5ec] font-medium">The artist gets</p>
                          <p className="text-[11px] accent font-semibold">70%</p>
                        </div>
                        <span className="brow-amt hi">$0.69</span>
                      </div>
                      <div className="brow">
                        <div className="brow-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7a5a" strokeWidth="1.5">
                            <path d="M12 22V12m0 0H2m10 0h10M2 7l10-5 10 5"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] soft font-light">The remaining money</p>
                          <p className="text-[11px] faint font-light">Goes to our infrastructure</p>
                        </div>
                        <span className="brow-amt" style={{ color: '#7a9e7d' }}>$0.30</span>
                      </div>
                    </div>

                    {/* Donut */}
                    <div className="flex flex-col items-center pt-2">
                      <svg viewBox="0 0 140 140" className="w-[120px] h-[120px]">
                        <circle cx="70" cy="70" r="50" fill="none" stroke="rgba(10,24,13,0.95)" strokeWidth="16"/>
                        <circle cx="70" cy="70" r="50" fill="none" stroke="#3dba6f" strokeWidth="16"
                          strokeDasharray="314.2" strokeDashoffset="94.2" strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }}/>
                        <text x="70" y="65" textAnchor="middle" fill="#e8f5ec" fontSize="22" fontWeight="300"
                          fontFamily="Cormorant Garamond, serif">70%</text>
                        <text x="70" y="80" textAnchor="middle" fill="#4a7a5a" fontSize="9"
                          fontFamily="DM Sans, sans-serif" letterSpacing="1.5">to artist</text>
                      </svg>
                      <p className="text-[15px] muted font-light mt-3">
                        Goes <em className="serif italic accent" style={{ fontSize: '17px' }}>straight</em> to the artist
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SMART SUBSCRIPTION ── */}
              {plan === 'sub' && (
                <div key="sub" className="plan-content-grid">
                  <div className="plan-left">
                    <h3 className="serif font-light leading-tight text-[#e8f5ec] mb-4"
                      style={{ fontSize: 'clamp(32px,3.5vw,48px)', letterSpacing: '-0.02em' }}>
                      The <em className="italic accent">more</em> you listen,<br />
                      the <em className="italic accent">more</em> they get.
                    </h3>
                    <p className="text-[14px] muted leading-relaxed font-light mb-8">
                      With a subscription, you don't pay per song. Instead, Groove Garden
                      automatically distributes your monthly contribution among the artists
                      you listened to — based on how much you listened to them that month.
                    </p>
                    <div className="faq-card">
                      <p className="text-[13px] text-[#c8dfc8] font-medium mb-2">How are you supporting artists?</p>
                      <p className="text-[12px] muted leading-relaxed font-light">
                        Your money follows your listening. If you spend 60% of your time on one artist,
                        they receive 60% of your creator funds that month; no global pool, no dilution.
                        From your subscription, 70% goes to artists and is distributed proportionally
                        based on your real listening time.
                      </p>
                    </div>
                  </div>

                  <div className="plan-right flex flex-col gap-5">
                    <p className="eyebrow">Example on how this works:</p>
                    <div className="space-y-2">
                      {[
                        { label: 'Artist 1', pct: 60, amount: '$2.52' },
                        { label: 'Artist 2', pct: 25, amount: '$1.05' },
                        { label: 'Artist 3', pct: 10, amount: '$0.42' },
                        { label: 'Artist 4', pct: 5,  amount: '$0.21' },
                      ].map((a) => (
                        <div key={a.label} className="arow">
                          <div className="aicon">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3dba6f" strokeWidth="1.5">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                          <p className="text-[13px] soft font-light w-16 flex-shrink-0">{a.label}</p>
                          <div className="abar-w">
                            <div className="abar" style={{ width: `${a.pct}%` }} />
                          </div>
                          <span className="aamt">{a.amount}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-baseline justify-between pt-4 border-t border-[rgba(61,186,111,0.08)]">
                      <p className="text-[13px] muted font-light">Total money to artists:</p>
                      <span className="serif font-light accent"
                        style={{ fontSize: '38px', letterSpacing: '-0.02em' }}>$4.20</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ══ FINAL CTA ══ */}
        <section className="relative text-center px-16 py-32 overflow-hidden">
          <Blobs />
          <div data-reveal className="relative z-10 max-w-4xl mx-auto">
            <h2 className="serif font-light leading-[1.1] mb-10"
              style={{ fontSize: 'clamp(44px,5.5vw,72px)', letterSpacing: '-0.025em' }}>
              Ready to <em className="italic accent">start</em> supporting<br />
              artists <em className="italic" style={{ color: '#e8f5ec' }}>you</em> love?
            </h2>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => router.push('/auth')}
                className="btn-primary px-14 py-4">
                Get started
              </button>
              <button className="btn-ghost px-10 py-4">
                Learn more
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="px-16 py-8 border-t border-[rgba(61,186,111,0.07)] flex items-center justify-between">
          <span className="serif text-[13px] faint tracking-widest uppercase">Groove Garden</span>
          <span className="text-[10px] tracking-widest uppercase" style={{ color: '#1a2a1c' }}>© 2025</span>
        </div>

      </div>
    </>
  )
}