import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
  }

  // Get all listen events for this user
  const { data: history, error: historyError } = await supabase
    .from('listen_events')
    .select('track_id, created_at')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 })
  }

  if (!history || history.length === 0) {
    return NextResponse.json({
      totalPlayTime: 0,
      topGenre: 'None',
      listeningStreak: 0,
      totalArtists: 0
    }, { status: 200 })
  }

  // Get unique track IDs
  const trackIds = [...new Set(history.map((h: any) => h.track_id))]

  // Fetch track details including artist and duration
  const { data: tracksData, error: tracksError } = await supabase
    .from('tracks')
    .select(`
      id,
      duration_seconds,
      artists (
        display_name,
        genre
      )
    `)
    .in('id', trackIds)

  if (tracksError) {
    return NextResponse.json({ error: tracksError.message }, { status: 500 })
  }

  // Create maps
  const trackDurationMap: Record<string, number> = {}
  const trackArtistMap: Record<string, string> = {}
  const trackGenreMap: Record<string, string> = {}
  
  tracksData?.forEach((t: any) => {
    trackDurationMap[t.id] = t.duration_seconds
    trackArtistMap[t.id] = t.artists?.display_name || 'Unknown'
    trackGenreMap[t.id] = t.artists?.genre || null
  })

  // Calculate total play time (in hours)
  const totalSeconds = history.reduce((sum: number, h: any) => {
    return sum + (trackDurationMap[h.track_id] || 0)
  }, 0)
  const totalPlayTime = Math.round(totalSeconds / 3600 * 10) / 10 // Round to 1 decimal

  // Count unique artists
  const uniqueArtists = new Set(history.map((h: any) => trackArtistMap[h.track_id]))
  const totalArtists = uniqueArtists.size

  // Calculate listening streak (consecutive days with at least one listen)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (let i = 0; i < 30; i++) { // Max 30 day streak check
    const hasListen = history.some((h: any) => {
      const listenDate = new Date(h.created_at)
      listenDate.setHours(0, 0, 0, 0)
      return listenDate.getTime() === currentDate.getTime()
    })
    
    if (hasListen) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  // Determine top genre from listened tracks
  const genreCounts: Record<string, number> = {}
  history.forEach((h: any) => {
    const genre = trackGenreMap[h.track_id]
    if (genre) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    }
  })
  
  let topGenre = 'Various'
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])
  if (sortedGenres.length > 0) {
    topGenre = sortedGenres[0][0]
  }

  return NextResponse.json({
    totalPlayTime,
    topGenre,
    listeningStreak: streak,
    totalArtists
  }, { status: 200 })
}
