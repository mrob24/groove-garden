import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  }

  const { data: playlists, error } = await supabase
    .from('playlists')
    .select(`
      *,
      playlist_tracks (
        track_id,
        position,
        tracks (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ playlists })
}

export async function POST(req: NextRequest) {
  const { user_id, name, description } = await req.json()

  const { data, error } = await supabase
    .from('playlists')
    .insert({
      user_id,
      name,
      description
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ playlist: data }, { status: 201 })
}