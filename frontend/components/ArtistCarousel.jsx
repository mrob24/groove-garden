"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'

const artists = [
  {
    id: 1,
    name: 'Asha Voss',
    genre: 'Neo Soul',
    // Reemplazá esto con tu imagen real: src: '/artists/asha.jpg'
    placeholder: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
  },
  {
    id: 2,
    name: 'The Marble Band',
    genre: 'Indie Folk',
    placeholder: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=600&q=80',
  },
  {
    id: 3,
    name: 'Lena Skye',
    genre: 'Dream Pop',
    placeholder: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
  },
]

export default function ArtistCarousel() {
  const [active, setActive] = useState(1) // empieza en el del medio

  useEffect(() => {
    const interval = setInterval(() => setActive(prev => (prev + 1) % artists.length), 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full mt-10 mb-8">
      {/* Carrusel */}
      <div className="flex gap-3 h-[260px] w-full">
        {artists.map((artist, i) => (
          <div
            key={artist.id}
            onClick={() => setActive(i)}
            style={{ flex: i === active ? 2.2 : 1 }}
            className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-in-out border border-[#4ade80]/10 min-w-0"
          >
            {/* Foto */}
            <img
              src={artist.placeholder}
              alt={artist.name}
              className="w-full h-full object-cover"
            />

            {/* Overlay oscuro siempre */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Overlay más oscuro cuando NO está activo */}
            <div className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${i === active ? 'opacity-0' : 'opacity-100'}`} />

            {/* Info del artista — solo visible cuando está activo */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-all duration-300 ${i === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
              <p className="font-extrabold text-sm text-white leading-tight">{artist.name}</p>
              <p className="text-xs text-[#4ade80] mt-0.5">{artist.genre}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {artists.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full border-none cursor-pointer p-0 transition-all duration-300
              ${i === active ? 'w-5 bg-[#4ade80]' : 'w-1.5 bg-[#6b8a6e]'}`}
          />
        ))}
      </div>
    </div>
  )
}