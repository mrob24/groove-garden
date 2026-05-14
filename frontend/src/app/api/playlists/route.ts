import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  console.log('🔵 GET /api/playlists - Iniciando')
  
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    
    console.log('🔵 userId recibido:', userId)

    if (!userId) {
      console.log('🔴 Error: No userId')
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    // Prueba 1: Verificar si la tabla playlists existe
    console.log('🔵 Consultando playlists para userId:', userId)
    
    const { data: playlists, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
    
    console.log('🔵 Resultado playlists:', { playlists, error })

    if (error) {
      console.error('🔴 Error en consulta de playlists:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si llegamos aquí, la consulta básica funciona
    console.log(`🔵 Encontradas ${playlists?.length || 0} playlists`)

    // Ahora intentamos obtener los tracks para cada playlist
    const playlistsWithTracks = await Promise.all(
      (playlists || []).map(async (playlist) => {
        console.log(`🔵 Obteniendo tracks para playlist: ${playlist.id} - ${playlist.title}`)
        
        const { data: playlistTracks, error: ptError } = await supabase
          .from('playlist_tracks')
          .select('track_id, position')
          .eq('playlist_id', playlist.id)
        
        if (ptError) {
          console.error(`🔴 Error en playlist_tracks para ${playlist.id}:`, ptError)
          return { ...playlist, tracks: [] }
        }
        
        console.log(`🔵 Encontrados ${playlistTracks?.length || 0} tracks en playlist_tracks`)
        
        if (!playlistTracks || playlistTracks.length === 0) {
          return { ...playlist, tracks: [] }
        }
        
        // Obtener detalles de los tracks
        const trackIds = playlistTracks.map(pt => pt.track_id)
        console.log(`🔵 Buscando tracks con IDs:`, trackIds)
        
        const { data: tracksData, error: tracksError } = await supabase
          .from('tracks')
          .select('id, title, duration_seconds, audio_url, cover_url')
          .in('id', trackIds)
        
        if (tracksError) {
          console.error(`🔴 Error obteniendo tracks:`, tracksError)
          return { ...playlist, tracks: [] }
        }
        
        console.log(`🔵 Encontrados ${tracksData?.length || 0} tracks`)
        
        const tracks = (tracksData || []).map(track => ({
          id: track.id,
          title: track.title,
          artist: 'Unknown Artist', // Temporal
          album: '',
          duration: track.duration_seconds,
          url: track.audio_url,
          cover_url: track.cover_url,
        }))
        
        return {
          ...playlist,
          tracks,
        }
      })
    )

    // Mapear para que el frontend use 'name' en lugar de 'title'
    const response = {
      playlists: playlistsWithTracks.map(p => ({
        id: p.id,
        name: p.title,  // Mapear title a name
        description: p.description,
        user_id: p.user_id,
        created_at: p.created_at,
        is_public: p.is_public,
        tracks: p.tracks || [],
      }))
    }
    
    console.log('✅ GET exitoso, devolviendo:', response.playlists.length, 'playlists')
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('🔴 Error catastrófico en GET:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  console.log('🟢 POST /api/playlists - Iniciando')
  
  try {
    const body = await req.json()
    console.log('🟢 Body recibido:', body)

    // Crear playlist
    if (body.action === 'create' || (!body.action && body.name)) {
      const { user_id, name, description } = body
      
      console.log('🟢 Creando playlist:', { user_id, name, description })
      
      if (!user_id) {
        console.log('🔴 Error: No user_id')
        return NextResponse.json({ error: 'user_id es requerido' }, { status: 400 })
      }
      
      if (!name || name.trim() === '') {
        console.log('🔴 Error: No name')
        return NextResponse.json({ error: 'El nombre de la playlist es requerido' }, { status: 400 })
      }

      console.log('🟢 Insertando en Supabase...')
      const { data, error } = await supabase
        .from('playlists')
        .insert({ 
          user_id, 
          title: name.trim(),
          description: description || null,
          is_public: true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('🔴 Error de Supabase al insertar:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Playlist creada exitosamente:', data)
      return NextResponse.json({ playlist: data }, { status: 201 })
    }

    // Add track to playlist
    if (body.action === 'add_track') {
      const { playlist_id, track_id } = body

      console.log('🟢 Agregando track:', { playlist_id, track_id })

      if (!playlist_id || !track_id) {
        return NextResponse.json({ error: 'playlist_id y track_id son requeridos' }, { status: 400 })
      }

      // Verificar si ya existe
      const { data: existing } = await supabase
        .from('playlist_tracks')
        .select('id')
        .eq('playlist_id', playlist_id)
        .eq('track_id', track_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'La canción ya está en la playlist' }, { status: 400 })
      }

      // Get current max position
      const { data: maxPos } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlist_id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()

      const position = (maxPos?.position ?? -1) + 1

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({ playlist_id, track_id, position })

      if (error) {
        console.error('🔴 Error al agregar track:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Track agregado exitosamente')
      return NextResponse.json({ ok: true }, { status: 201 })
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
  } catch (error: any) {
    console.error('🔴 Error catastrófico en POST:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  console.log('🟡 DELETE /api/playlists - Iniciando')
  
  try {
    const { searchParams } = new URL(req.url)
    const playlistId = searchParams.get('playlist_id')
    const trackId = searchParams.get('track_id')
    const userId = searchParams.get('user_id')

    console.log('🟡 Parámetros:', { playlistId, trackId, userId })

    // Remove track from playlist
    if (playlistId && trackId) {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)
      
      if (error) {
        console.error('🔴 Error removing track:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Track removido')
      return NextResponse.json({ ok: true })
    }

    // Delete entire playlist
    if (playlistId && userId) {
      // Primero eliminar los tracks asociados
      await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)

      // Luego eliminar la playlist
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', userId)
      
      if (error) {
        console.error('🔴 Error deleting playlist:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      console.log('✅ Playlist eliminada')
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'playlist_id required' }, { status: 400 })
  } catch (error: any) {
    console.error('🔴 Error catastrófico en DELETE:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}