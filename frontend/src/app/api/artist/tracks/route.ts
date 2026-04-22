import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { title, album_id, duration_seconds, audio_url, price, lyrics, lyrics_type } = await req.json()
  const artist_id = req.headers.get('x-artist-id')

  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!title || !duration_seconds) return NextResponse.json({ error: 'Título y duración son requeridos' }, { status: 400 })

  const { data, error } = await supabase
    .from('tracks')
    .insert({
      title,
      album_id: album_id || null,
      artist_id,
      duration_seconds,
      audio_url,
      price,
      lyrics: lyrics || null,
      lyrics_type: lyrics_type || 'plain',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ track_id: data.id }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const { track_id, lyrics, lyrics_type } = await req.json()
  const artist_id = req.headers.get('x-artist-id')

  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!track_id) return NextResponse.json({ error: 'track_id requerido' }, { status: 400 })

  // Verify the track belongs to this artist
  const { data: existing, error: checkError } = await supabase
    .from('tracks')
    .select('id')
    .eq('id', track_id)
    .eq('artist_id', artist_id)
    .single()

  if (checkError || !existing) {
    return NextResponse.json({ error: 'Track no encontrado o no autorizado' }, { status: 404 })
  }

  const { error } = await supabase
    .from('tracks')
    .update({ lyrics: lyrics || null, lyrics_type: lyrics_type || 'plain' })
    .eq('id', track_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function GET(req: NextRequest) {
  const artist_id = req.headers.get('x-artist-id')
  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('tracks')
    .select('id, title, duration_seconds, audio_url, price, created_at, lyrics, lyrics_type, albums(title, cover_url)')
    .eq('artist_id', artist_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all track IDs
  const trackIds = data.map((t: any) => t.id)

  // Fetch play counts from listen_events
  const { data: listenData } = await supabase
    .from('listen_events')
    .select('track_id')
    .in('track_id', trackIds)

  // Fetch like counts from library
  const { data: likeData } = await supabase
    .from('library')
    .select('track_id')
    .in('track_id', trackIds)

  // Count plays per track
  const playCounts: Record<string, number> = {}
  listenData?.forEach((l: any) => {
    playCounts[l.track_id] = (playCounts[l.track_id] || 0) + 1
  })

  // Count likes per track
  const likeCounts: Record<string, number> = {}
  likeData?.forEach((l: any) => {
    likeCounts[l.track_id] = (likeCounts[l.track_id] || 0) + 1
  })

  // Enrich tracks with counts
  const tracks = data.map((track: any) => ({
    id: track.id,
    title: track.title,
    duration_seconds: track.duration_seconds,
    audio_url: track.audio_url,
    price: track.price,
    cover_url: track.albums?.cover_url || null,
    lyrics: track.lyrics || null,
    lyrics_type: track.lyrics_type || 'plain',
    album: track.albums?.title || null,
    created_at: track.created_at,
    play_count: playCounts[track.id] || 0,
    like_count: likeCounts[track.id] || 0
  }))

  return NextResponse.json({ tracks }, { status: 200 })
}