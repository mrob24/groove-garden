import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { display_name, bio, genre, country } = await req.json()

  const user = req.headers.get('x-user-id')
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  if (!display_name || !genre) {
    return NextResponse.json({ error: 'Nombre artístico y género son requeridos' }, { status: 400 })
  }

  // Verificar que el usuario existe en public.users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user)
    .single()

  if (userError || !userData) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Verificar que no sea artista ya
  const { data: existing } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', user)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ya eres artista', artist_id: existing.id }, { status: 200 })
  }

  const { data, error } = await supabase
    .from('artists')
    .insert({ user_id: user, display_name, bio, genre, country })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ artist_id: data.id }, { status: 201 })
}