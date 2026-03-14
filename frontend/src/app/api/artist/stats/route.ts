import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const artist_id = req.headers.get('x-artist-id')
  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Primero traer los track_ids del artista
  const { data: artistTracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('artist_id', artist_id)

  const trackIds = artistTracks?.map((t: any) => t.id) || []

  if (trackIds.length === 0) {
    return NextResponse.json({ total_plays: 0, total_likes: 0, avg_completion: 0 }, { status: 200 })
  }

  // Total de reproducciones
  const { data: listenData } = await supabase
    .from('listen_events')
    .select('track_id, completion_rate')
    .in('track_id', trackIds)

  // Total de likes (library)
  const { data: likeData } = await supabase
    .from('library')
    .select('track_id')
    .in('track_id', trackIds)

  return NextResponse.json({
    total_plays: listenData?.length || 0,
    total_likes: likeData?.length || 0,
    avg_completion: listenData?.length
      ? (listenData.reduce((a: number, e: any) => a + e.completion_rate, 0) / listenData.length * 100).toFixed(1)
      : 0,
  }, { status: 200 })
}