"use client"

import { useState, useEffect, useRef } from 'react'

const artists = [
  {
    id: 1,
    name: 'BLK ODDYSY',
    genre: 'Alternative R&B',
    placeholder: '/images/BlkOddysy.jpg',
  },
  {
    id: 2,
    name: 'Flwr Chyld',
    genre: 'Neo Soul',
    placeholder: '/images/FlwrChyld.jpg',
  },
  {
    id: 3,
    name: 'Benny Sings',
    genre: 'Indie Pop',
    placeholder: '/images/BennySings.jpg',
  },
  {
    id: 4,
    name: 'Biig Piig',
    genre: 'Trip-Pop',
    placeholder: '/images/BiigPiig.jpg',
  },
  {
    id: 5,
    name: 'Chon',
    genre: 'Progressive Rock',
    placeholder: '/images/Chon.jpg',
  },
  {
    id: 6,
    name: 'Ginger Root',
    genre: 'Elevator Soul',
    placeholder: '/images/GingerRoot.jpg',
  },
  {
    id: 7,
    name: 'Magdalena Bay',
    genre: 'Synth-Pop',
    placeholder: '/images/MagdalenaBay.jpg',
  },
  {
    id: 8,
    name: 'Navy Blue',
    genre: 'Hip-Hop',
    placeholder: '/images/NavyBlue.jpg',
  },
  {
    id: 9,
    name: 'Obongjayar',
    genre: 'Afrobeat/Soul',
    placeholder: '/images/Obongjayar.jpg',
  },
]

const loopedArtists = [...artists, ...artists, ...artists, ...artists, ...artists, ...artists, ...artists, ...artists, ...artists]

const CARD_WIDTH = 260
const GAP = 16
const SPEED = 0.5

// Calculate card distance from center for sophisticated fade
const calculateCardOpacity = (dist, maxDist) => {
  const normalized = Math.min(dist / maxDist, 1)
  return 1 - normalized * 0.8 // Fades from 1 to 0.2
}

export default function ArtistCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef(null)
  const animFrameRef = useRef(null)
  const pausedRef = useRef(false)
  const posRef = useRef(0)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const startPos = artists.length * (CARD_WIDTH + GAP)
    posRef.current = startPos
    container.scrollLeft = startPos

    const tick = () => {
      if (!pausedRef.current) {
        posRef.current += SPEED
        container.scrollLeft = posRef.current

        const maxPos = artists.length * 2 * (CARD_WIDTH + GAP)
        if (posRef.current >= maxPos) {
          posRef.current = artists.length * (CARD_WIDTH + GAP)
          container.scrollLeft = posRef.current
        }

        const containerCenter = container.scrollLeft + container.offsetWidth / 2
        const cards = container.querySelectorAll('[data-card]')
        let closest = 0
        let minDist = Infinity
        cards.forEach((card, i) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2
          const dist = Math.abs(containerCenter - cardCenter)
          if (dist < minDist) {
            minDist = dist
            closest = i % artists.length
          }
        })
        setActiveIndex(closest)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  return (
    <div className="w-full h-max mt-10 mb-8 relative">
      {/* Track */}
      <div
        ref={scrollRef}
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
        className="flex h-[280px] overflow-x-hidden"
        style={{
          gap: `${GAP}px`,
          scrollbarWidth: 'none',
          paddingTop: '15px',
          paddingBottom: '15px',
          maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        }}
      >
        {loopedArtists.map((artist, i) => {
          const isActive = i % artists.length === activeIndex
          return (
            <div
              key={`${artist.id}-${i}`}
              data-card
              className="relative rounded-2xl overflow-hidden flex-shrink-0 border border-white/10"
              style={{
                width: `${CARD_WIDTH}px`,
                transform: isActive 
                  ? 'scale(1.04) translateY(-6px)' 
                  : 'scale(0.95) translateY(0px)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                filter: isActive 
                  ? 'brightness(1.05) saturate(1.1)' 
                  : 'brightness(0.6) saturate(0.7)',
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <img
                src={artist.placeholder}
                alt={artist.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div
                className="absolute bottom-0 left-0 right-0 p-4"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? 'translateY(0px)' : 'translateY(16px)',
                  transition: 'opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                <p className="font-extrabold text-base text-white tracking-wide">{artist.name}</p>
                <p className="text-xs text-[#4ade80] mt-1 uppercase tracking-widest font-medium">{artist.genre}</p>
              </div>
            </div>
          )
        })}
      </div>


    </div>
  )
}