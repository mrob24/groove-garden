import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: traer liked tracks del usuario
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('library')
    .select('track_id')
    .eq('user_id', user_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const likedTrackIds = data.map((item: any) => item.track_id)
  return NextResponse.json({ likedTrackIds }, { status: 200 })
}

// POST: dar like a un track
export async function POST(req: NextRequest) {
  const { user_id, track_id } = await req.json()

  if (!user_id || !track_id) {
    return NextResponse.json({ error: 'user_id y track_id requeridos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('library')
    .insert({ user_id, track_id })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

// DELETE: quitar like
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  const track_id = searchParams.get('track_id')

  if (!user_id || !track_id) {
    return NextResponse.json({ error: 'user_id y track_id requeridos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('library')
    .delete()
    .eq('user_id', user_id)
    .eq('track_id', track_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}