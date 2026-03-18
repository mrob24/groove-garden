import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_tracks (
        track_id,
        position,
        tracks (
          id,
          title,
          duration_seconds,
          audio_url,
          artists ( display_name ),
          albums ( title, cover_url )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normalise tracks inside each playlist to match the Track interface
  const normalised = (playlists || []).map((pl: any) => ({
    ...pl,
    tracks: (pl.playlist_tracks || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((pt: any) => ({
        id: pt.tracks.id,
        title: pt.tracks.title,
        artist: pt.tracks.artists?.display_name || 'Unknown',
        album: pt.tracks.albums?.title || '',
        duration: pt.tracks.duration_seconds,
        url: pt.tracks.audio_url || '',
        cover_url: pt.tracks.albums?.cover_url || null,
      })),
  }))

  return NextResponse.json({ playlists: normalised })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Create playlist
  if (body.action === 'create' || (!body.action && body.name)) {
    const { user_id, name, description } = body
    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id, name, description })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ playlist: data }, { status: 201 })
  }

  // Add track to playlist
  if (body.action === 'add_track') {
    const { playlist_id, track_id } = body

    // Get current max position
    const { data: existing } = await supabase
      .from('playlist_tracks')
      .select('position')
      .eq('playlist_id', playlist_id)
      .order('position', { ascending: false })
      .limit(1)

    const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0

    const { error } = await supabase
      .from('playlist_tracks')
      .insert({ playlist_id, track_id, position })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const playlistId = searchParams.get('playlist_id')
  const trackId    = searchParams.get('track_id')
  const userId     = searchParams.get('user_id')

  // Remove track from playlist
  if (playlistId && trackId) {
    const { error } = await supabase
      .from('playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Delete entire playlist
  if (playlistId && userId) {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'playlist_id required' }, { status: 400 })
}