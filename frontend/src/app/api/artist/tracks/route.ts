import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { title, album_id, duration_seconds, audio_url, price } = await req.json()
  const artist_id = req.headers.get('x-artist-id')

  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!title || !duration_seconds) return NextResponse.json({ error: 'Título y duración son requeridos' }, { status: 400 })

  const { data, error } = await supabase
    .from('tracks')
    .insert({ title, album_id: album_id || null, artist_id, duration_seconds, audio_url, price })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ track_id: data.id }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const artist_id = req.headers.get('x-artist-id')
  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('tracks')
    .select('id, title, duration_seconds, audio_url, price, created_at, albums(title)')
    .eq('artist_id', artist_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ tracks: data }, { status: 200 })
}