"use client"

import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import ArtistCarousel from '../components/ArtistCarousel'
import Blobs from '../components/Blobs'

export default function Landing() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0a1a0f] text-[#f0f7f0]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-screen pt-20 px-12 overflow-hidden">
        <Blobs />
        <div className="relative z-10 w-full max-w-[1200px] flex flex-col items-center gap-8">
          <h1 className="font-extrabold text-[clamp(56px,7vw,96px)] leading-[1.1] mb-3 max-w-[1000px] drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            The <em className="text-[#4ade80] not-italic">garden</em> where<br />
            music <em className="italic">flourishes</em>
          </h1>
          <p className="text-xl text-[#a3b8a5] leading-9 max-w-[800px]">
            Groove Garden is a space where artists are nurtured, not overlooked. Here, music is cultivated with intention. Supported by community, given the tools it needs to truly flourish.
          </p>
          <ArtistCarousel />
        </div>
      </section>

      {/* ── MANIFESTO ── */}
      <section className="px-12 py-20 bg-[#0d2010] border-t border-b border-[#4ade80]/10">
        <p className="text-xs text-[#4ade80] tracking-wider mb-3">Our manifesto</p>
        <h2 className="font-extrabold text-[clamp(30px,4vw,48px)] leading-[1.15] mb-7">
          <em className="text-[#4ade80] not-italic">Artists</em> are{' '}
          <em className="italic underline decoration-[#4ade80]">not</em>
          <br />disposable content
        </h2>
        <p className="text-sm text-[#a3b8a5] leading-7 max-w-[540px] mb-4">Traditional streaming platforms reduce music to passive consumption. Groove Garden was built to change that.</p>
        <p className="text-sm text-[#a3b8a5] leading-7 max-w-[540px] mb-4">Here, every stream has meaning, every artist is valued, and every listen truly plays a role in the ecosystem.</p>
        <p className="text-sm text-[#a3b8a5] leading-7 max-w-[540px]">We are not chasing volume. We are creating the ballroom between artists and listeners, a garden where community helps determine what truly flourishes.</p>

        <div className="grid grid-cols-2 gap-4 mt-12">
          {[
            { big: '70%', desc: 'Of every subscription goes directly to the artists you support. No hidden intermediaries.' },
            { title: 'Sustainable\nGrowth', desc: 'We reward artists — not viral spikes or disposable content.' },
            { title: 'Direct\nSupport', desc: 'Choose exactly which artists your subscription empowers. Your money. Your decision.' },
            { title: 'Transparent', desc: 'Clear revenue distribution. No black boxes. No manipulation.' },
          ].map((s, i) => (
            <div key={i} className="bg-[#122016] border border-[#4ade80]/10 rounded-2xl p-7">
              {s.big && <span className="block font-extrabold text-[52px] leading-none mb-3">{s.big}</span>}
              {s.title && <h3 className="font-extrabold text-xl leading-tight mb-3 whitespace-pre-line">{s.title}</h3>}
              <p className="text-xs text-[#a3b8a5] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="relative grid grid-cols-2 gap-20 items-center px-12 py-24 overflow-hidden">
        <Blobs />
        <div className="relative z-10">
          <p className="text-xs text-[#4ade80] tracking-wider mb-4">– How it works</p>
          <h2 className="font-extrabold text-[clamp(36px,5vw,64px)] leading-[1.05] mb-6">
            A <em className="text-[#4ade80] not-italic">place</em><br />
            where music<br />
            <em className="italic">grows</em> with<br />
            you
          </h2>
          <p className="text-sm text-[#a3b8a5] mb-2">Not just streaming — an ecosystem.</p>
          <p className="text-sm text-[#a3b8a5] mb-1">– Your attention has weight.</p>
          <p className="text-sm text-[#a3b8a5] mb-1">– Artists are seeds.</p>
          <p className="text-sm text-[#a3b8a5]">– Every listen helps something real grow.</p>
        </div>

        <div className="flex flex-col gap-4 relative z-10">
          {[
            { num: '#1', title: 'Your experience and impact is valuable.', body: 'Discover new artists, listen to songs you like from our human curated playlists. The music you save has an impact and a weight.' },
            { num: '#2', title: 'Your money, directly to your artists', body: 'Choose to pay per song or subscribe monthly. Either way, 70% goes straight to the artist; no intermediaries, no black boxes.' },
            { num: '#3', title: 'See what you love grow.', body: 'Track the impact of your support in real time. See how your listens and contributions help artists grow and reach new audiences.' },
          ].map(s => (
            <div key={s.num} className="bg-[#122016] border border-[#4ade80]/10 rounded-2xl p-6 flex gap-5 hover:bg-[#162a1a] transition-colors">
              <span className="font-extrabold text-3xl text-[#4ade80] min-w-[48px]">{s.num}</span>
              <div>
                <h3 className="font-bold text-[15px] mb-2">{s.title}</h3>
                <p className="text-xs text-[#a3b8a5] leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-12 py-24 bg-[#0d2010] border-t border-[#4ade80]/10">
        <p className="text-xs text-[#4ade80] tracking-wider mb-3">Payment method</p>
        <h2 className="font-extrabold text-[clamp(28px,4vw,44px)] mb-12">
          Two ways to <em className="text-[#4ade80] not-italic">help</em>
        </h2>

        <div className="grid grid-cols-2 border border-[#4ade80]/10 rounded-2xl overflow-hidden">
          {/* Pay per song */}
          <div className="bg-[#122016]">
            <div className="px-8 pt-8">
              <span className="text-[11px] text-[#6b8a6e] uppercase tracking-wider block mb-2">Free Plan</span>
              <h3 className="font-extrabold text-3xl mb-2"><em className="text-[#4ade80] not-italic">Pay</em> per song</h3>
              <p className="text-xs text-[#a3b8a5] leading-relaxed pb-6 border-b border-[#4ade80]/10">No subscription, pay for the music you like and support artists directly.</p>
            </div>
            <div className="px-8 pb-8 pt-7">
              <h4 className="font-extrabold text-2xl leading-tight mb-4">Pay <em className="text-[#4ade80] not-italic">only</em> for<br />what you want.</h4>
              <p className="text-xs text-[#a3b8a5] leading-relaxed mb-5">No subscription model. Just a small, transparent price per song. Buy what you love, own it forever. No gimmicks. No fine print.</p>
              <div className="bg-white/[0.04] border border-[#4ade80]/10 rounded-xl p-4 mb-3 text-xs text-[#a3b8a5] leading-relaxed">
                <strong className="block text-[#f0f7f0] mb-1.5">How are you supporting artists?</strong>
                Every song costs $0.99, then $0.69 goes straight to them; 70%. The remaining $0.30 sustains the platform.
              </div>
              <div className="bg-white/[0.04] border border-[#4ade80]/10 rounded-xl p-4 mb-6 text-xs text-[#a3b8a5] leading-relaxed">
                <strong className="block text-[#f0f7f0] mb-1.5">What do you get?</strong>
                Once you buy it, it is yours. Forever in your library. No DRM. No expiration. High-quality audio, yours to keep offline.
              </div>
              <button onClick={() => router.push('/auth')} className="w-full py-3.5 bg-[#0d2010] border border-[#4ade80]/10 rounded-xl text-[#f0f7f0] font-semibold hover:bg-[#1a3a20] hover:-translate-y-px transition-all cursor-pointer">
                Get started
              </button>
            </div>
          </div>

          {/* Smart subscription */}
          <div className="bg-[#0f2a14] border-l border-[#4ade80]/10">
            <div className="px-8 pt-8">
              <span className="text-[11px] text-[#6b8a6e] uppercase tracking-wider block mb-2">Paid Subscription</span>
              <h3 className="font-extrabold text-3xl mb-2"><em className="text-[#4ade80] not-italic">Smart</em> subscription</h3>
              <p className="text-xs text-[#a3b8a5] leading-relaxed pb-6 border-b border-[#4ade80]/10">The best way to support artists you like, based on how much you listen to them.</p>
            </div>
            <div className="px-8 pb-8 pt-7">
              <p className="text-xs text-[#6b8a6e] mb-3">How much money goes to artists?</p>
              {[
                { icon: '', label: 'Listener buys', sub: '1 Song', amount: '$0.99' },
                { icon: '', label: 'The artist gets', sub: '70%', amount: '$0.69' },
                { icon: ' ', label: 'The remaining money', sub: 'Goes to infrastructure', amount: '$0.30' },
              ].map(({icon,label,sub,amount}) => (
                <div key={label} className="flex items-center gap-3.5 bg-white/[0.04] border border-[#4ade80]/10 rounded-xl px-4 py-3 mb-2">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <div className="text-xs text-[#a3b8a5]">{label}</div>
                    <div className="text-[11px] text-[#6b8a6e] mt-0.5">{sub}</div>
                  </div>
                  <div className="ml-auto font-extrabold text-[15px]">{amount}</div>
                </div>
              ))}

              <div className="flex justify-center my-7">
                <svg viewBox="0 0 120 120" className="w-[120px] h-[120px]">
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#1a3a20" strokeWidth="16"/>
                  {/* 70% of circumference ≈ 289 * 0.7 = 202.3 => offset = 86.7 */}
                  <circle cx="60" cy="60" r="46" fill="none" stroke="#4ade80" strokeWidth="16" strokeDasharray="289" strokeDashoffset="86.7" strokeLinecap="round"/>
                  <text x="60" y="56" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">70%</text>
                  <text x="60" y="72" textAnchor="middle" fill="#a3b8a5" fontSize="8">to artist</text>
                </svg>
              </div>
              <p className="text-center text-[15px] text-[#a3b8a5] mb-6">Goes <em className="text-[#4ade80] not-italic">straight</em> to the artist</p>
              <button onClick={() => router.push('/auth')} className="w-full py-3.5 bg-[#22c55e] text-[#0a1a0f] rounded-xl font-semibold hover:bg-[#4ade80] hover:-translate-y-px transition-all cursor-pointer border-none">
                Get started
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative text-center px-12 py-28 overflow-hidden">
        <Blobs />
        <h2 className="relative z-10 font-extrabold text-[clamp(28px,4vw,48px)] leading-[1.2] mb-10">
          Ready to <em className="text-[#4ade80] not-italic">start</em> supporting<br />
          artists <em className="italic">you</em> love?
        </h2>
        <button
          onClick={() => router.push('/auth')}
          className="relative z-10 bg-[#122016] border border-[#4ade80]/10 text-[#f0f7f0] px-14 py-4 rounded-full text-base font-semibold hover:bg-[#1a3a20] hover:border-[#4ade80] hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Get started
        </button>
      </section>
    </div>
  )
}