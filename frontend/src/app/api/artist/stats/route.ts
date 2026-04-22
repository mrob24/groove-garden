import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const artist_id = req.headers.get('x-artist-id')
  if (!artist_id) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Get track IDs for this artist
  const { data: artistTracks } = await supabase
    .from('tracks')
    .select('id')
    .eq('artist_id', artist_id)

  const trackIds = artistTracks?.map((t: any) => t.id) || []

  if (trackIds.length === 0) {
    return NextResponse.json({ 
      total_plays: 0, 
      total_likes: 0, 
      avg_completion: 0,
      monthly_listeners: 0,
      monthly_listeners_growth: 0,
      likes_growth: 0,
      weekly_growth: 0,
      revenue: 0
    }, { status: 200 })
  }

  // All listen data for calculations
  const { data: listenData } = await supabase
    .from('listen_events')
    .select('track_id, completion_rate, user_id, created_at')
    .in('track_id', trackIds)

  // Total likes from library
  const { data: likeData } = await supabase
    .from('library')
    .select('track_id, created_at')
    .in('track_id', trackIds)

  // Monthly listeners: distinct users who listened in last 30 days
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date(thirtyDaysAgo)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30)
  
  // Current month listeners
  const { data: currentMonthListeners } = await supabase
    .from('listen_events')
    .select('user_id')
    .in('track_id', trackIds)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  // Previous month listeners
  const { data: prevMonthListenersData } = await supabase
    .from('listen_events')
    .select('user_id')
    .in('track_id', trackIds)
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())
  
   const currentMonthListenersCount = new Set(currentMonthListeners?.map((l: any) => l.user_id) || []).size
   const prevMonthListeners = new Set(prevMonthListenersData?.map((l: any) => l.user_id) || []).size
  
   let monthly_listeners_growth = 0
   if (prevMonthListeners > 0) {
     monthly_listeners_growth = ((currentMonthListenersCount - prevMonthListeners) / prevMonthListeners) * 100
   } else if (currentMonthListenersCount > 0) {
     monthly_listeners_growth = 100
   }

  // Weekly growth: compare last 7 days vs previous 7 days
  const last7Days = new Date(now)
  last7Days.setDate(last7Days.getDate() - 7)
  const previous7Days = new Date(last7Days)
  previous7Days.setDate(previous7Days.getDate() - 7)

  const { data: lastWeekData } = await supabase
    .from('listen_events')
    .select('track_id')
    .in('track_id', trackIds)
    .gte('created_at', last7Days.toISOString())
    .lte('created_at', now.toISOString())

  const { data: prevWeekData } = await supabase
    .from('listen_events')
    .select('track_id')
    .in('track_id', trackIds)
    .gte('created_at', previous7Days.toISOString())
    .lte('created_at', last7Days.toISOString())

  const lastWeekPlays = lastWeekData?.length || 0
  const prevWeekPlays = prevWeekData?.length || 0
  
  let weekly_growth = 0
  if (prevWeekPlays > 0) {
    weekly_growth = ((lastWeekPlays - prevWeekPlays) / prevWeekPlays) * 100
  } else if (lastWeekPlays > 0) {
    weekly_growth = 100
  }

  // Likes growth: compare last 30 days vs previous 30 days
  const { data: currentMonthLikes } = await supabase
    .from('library')
    .select('track_id')
    .in('track_id', trackIds)
    .gte('created_at', thirtyDaysAgo.toISOString())
  
  const { data: prevMonthLikes } = await supabase
    .from('library')
    .select('track_id')
    .in('track_id', trackIds)
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString())
  
  const currentMonthLikesCount = currentMonthLikes?.length || 0
  const prevMonthLikesCount = prevMonthLikes?.length || 0
  
  let likes_growth = 0
  if (prevMonthLikesCount > 0) {
    likes_growth = ((currentMonthLikesCount - prevMonthLikesCount) / prevMonthLikesCount) * 100
  } else if (currentMonthLikesCount > 0) {
    likes_growth = 100
  }

  return NextResponse.json({
    total_plays: listenData?.length || 0,
    total_likes: likeData?.length || 0,
    avg_completion: listenData?.length
      ? (listenData.reduce((a: number, e: any) => a + e.completion_rate, 0) / listenData.length * 100).toFixed(1)
      : 0,
    monthly_listeners: currentMonthListenersCount,
    monthly_listeners_growth: Math.round(monthly_listeners_growth * 10) / 10,
    likes_growth: Math.round(likes_growth * 10) / 10,
    weekly_growth: Math.round(weekly_growth * 10) / 10,
    revenue: 0 // Revenue tracking not yet implemented
  }, { status: 200 })
}