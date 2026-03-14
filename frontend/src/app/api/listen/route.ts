import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { user_id, track_id, duration_listened, track_duration, source } = await req.json()

  if (!user_id || !track_id || !duration_listened || !track_duration || !source) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const completion_rate = Math.min(duration_listened / track_duration, 1)

  const { error } = await supabase
    .from('listen_events')
    .insert({ user_id, track_id, duration_listened, track_duration, completion_rate, source })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}