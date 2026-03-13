import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

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

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Insert into users table
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      auth_id: data.user?.id,
      email,
      username: name,
      password_hash: hashedPassword,
      plan_type: 'free' // or default
    })

  if (insertError) {
    console.error('Error inserting user:', insertError)
    return NextResponse.json({ error: 'Error creando usuario' }, { status: 500 })
  }

  return NextResponse.json({ token: data.session?.access_token }, { status: 201 })
}