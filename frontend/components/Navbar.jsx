"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-[18px] bg-[#0a1a0f]/85 backdrop-blur-md border-b border-[#4ade80]/10">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M14 4 C14 4, 10 8, 10 13 C10 16.3, 12 18.5, 14 19 C16 18.5, 18 16.3, 18 13 C18 8, 14 4, 14 4Z" fill="#4ade80"/>
          <path d="M14 19 L14 25" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 22 C10 22, 8 21, 7 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M18 22 C18 22, 20 21, 21 19" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-extrabold text-[11px] tracking-widest leading-tight whitespace-pre text-[#f0f7f0]">
          {'GROOVE\nGARDEN'}
        </span>
      </Link>

      <div className="flex gap-9">
        <a href="#how-it-works" className="text-sm text-[#a3b8a5] hover:text-[#f0f7f0] transition-colors">How does it work?</a>
        <a href="#pricing" className="text-sm text-[#a3b8a5] hover:text-[#f0f7f0] transition-colors">Pricing</a>
      </div>

      <button
        onClick={() => router.push('/auth')}
        className="bg-[#22c55e] text-[#0a1a0f] px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#4ade80] hover:-translate-y-px transition-all cursor-pointer border-none"
      >
        Get started
      </button>
    </nav>
  )
}