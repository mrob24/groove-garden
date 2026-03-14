import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  // Traer datos del usuario incluyendo artist_id si existe
  const { data: userData } = await supabase
    .from('users')
    .select('id, username, email, plan_type')
    .eq('auth_id', data.user.id)
    .single()

  // Buscar si el usuario es artista
  const { data: artistData } = await supabase
    .from('artists')
    .select('id')
    .eq('user_id', userData?.id)
    .single()

  return NextResponse.json({
    token: data.session?.access_token,
    user: {
      ...userData,
      artist_id: artistData?.id || null
    }
  }, { status: 200 })
}