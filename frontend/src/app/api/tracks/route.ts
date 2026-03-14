import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('tracks')
    .select(`
      id,
      title,
      duration_seconds,
      audio_url,
      is_featured,
      albums (
        cover_url,
        title
      ),
      artists (
        display_name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const tracks = data.map((track: any) => ({
    id: track.id,
    title: track.title,
    artist: track.artists?.display_name || 'Unknown artist',
    album: track.albums?.title || '',
    duration: track.duration_seconds,
    url: track.audio_url || '',
    cover_url: track.albums?.cover_url || null,
    is_featured: track.is_featured || false,
  }))

  return NextResponse.json({ tracks }, { status: 200 })
}