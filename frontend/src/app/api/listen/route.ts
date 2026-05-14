import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { user_id, track_id } = await req.json()

  if (!user_id || !track_id) {
    return NextResponse.json({ error: 'user_id y track_id son requeridos' }, { status: 400 })
  }

  const { error } = await supabase
    .from('listen_events')
    .insert({ 
      user_id, 
      track_id,
      created_at: new Date().toISOString()
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}