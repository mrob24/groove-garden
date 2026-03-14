import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { title, cover_url, release_date } = await req.json()
  const artist_id = req.headers.get('x-artist-id')

  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!title) return NextResponse.json({ error: 'Título requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('albums')
    .insert({ title, artist_id, cover_url, release_date: release_date || null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ album_id: data.id }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const artist_id = req.headers.get('x-artist-id')
  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('albums')
    .select('id, title, cover_url, release_date, created_at')
    .eq('artist_id', artist_id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ albums: data }, { status: 200 })
}