import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('📊 /api/listen received:', body)
    
    const { 
      user_id, 
      track_id, 
      duration_listened, 
      track_duration, 
      completion_rate, 
      source 
    } = body
    
    // Validar datos requeridos
    if (!user_id || !track_id) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, track_id' },
        { status: 400 }
      )
    }
    
    // Calcular completion_rate si no vino
    const finalCompletionRate = completion_rate || 
      (duration_listened / track_duration) || 
      0
    
    // Guardar en Supabase
    const { data, error } = await supabase
      .from('listen_events')
      .insert({
        user_id,
        track_id,
        duration_listened: duration_listened || 0,
        track_duration: track_duration || 0,
        completion_rate: finalCompletionRate,
        source: source || 'player',
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Listen event saved:', data)
    return NextResponse.json({ success: true, data })
    
  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}