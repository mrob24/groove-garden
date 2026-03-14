import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Esperar un momento para que el trigger cree el usuario
  await new Promise(resolve => setTimeout(resolve, 500))

  // Traer el usuario de public.users
  const { data: userData } = await supabase
    .from('users')
    .select('id, username, email, plan_type')
    .eq('auth_id', data.user?.id)
    .single()

  return NextResponse.json({
    token: data.session?.access_token,
    user: { ...userData, artist_id: null }
  }, { status: 201 })
}