"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        .nav-wordmark { font-family: 'Cormorant Garamond', serif; }
        .nav-link {
          position: relative;
          color: #7a9e7d;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.3s ease;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: #4ade80;
          transition: width 0.3s ease;
        }
        .nav-link:hover { color: #f0f7f0; }
        .nav-link:hover::after { width: 100%; }
      `}</style>

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-5"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,26,15,0.95) 0%, rgba(10,26,15,0) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 no-underline group">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none" style={{ transition: 'transform 0.4s ease' }}
            className="group-hover:rotate-12">
            <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
            <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10 22 C10 22, 8 21, 7 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M18 22 C18 22, 20 21, 21 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="nav-wordmark font-semibold text-[15px] tracking-[0.25em] text-[#f0f7f0] uppercase">
            Groove Garden
          </span>
        </Link>

        {/* Links */}
        <div className="flex gap-10">
          <a href="#how-it-works" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push('/auth')}
          className="relative group overflow-hidden px-6 py-2.5 rounded-full text-[11px] tracking-[0.15em] uppercase font-medium cursor-pointer border-none"
          style={{
            background: 'linear-gradient(135deg, #22c55e, #4ade80)',
            color: '#0a1a0f',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 20px rgba(74,222,128,0.2)',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 32px rgba(74,222,128,0.45)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(74,222,128,0.2)'}
        >
          <span className="relative z-10">Get started</span>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }} />
        </button>
      </nav>
    </>
  )
}