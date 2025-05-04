// followService.ts
import { supabase } from '@/config/supabaseClient'

export interface FollowStats {
  followersCount: number
  followingCount: number
  isFollowing: boolean
}

// Follow a user
export async function followUser(followerId: string, followedId: string): Promise<boolean> {
  // Don't allow users to follow themselves
  if (followerId === followedId) {
    console.error('Users cannot follow themselves')
    return false
  }

  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      followed_id: followedId
    })

  if (error) {
    console.error('Error following user:', error)
    return false
  }

  return true
}

// Unfollow a user
export async function unfollowUser(followerId: string, followedId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .match({
      follower_id: followerId,
      followed_id: followedId
    })

  if (error) {
    console.error('Error unfollowing user:', error)
    return false
  }

  return true
}

// Check if user is following another user
export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .match({
      follower_id: followerId,
      followed_id: followedId
    })
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 means no rows returned, which is fine
    console.error('Error checking follow status:', error)
  }

  return !!data
}

// Get follows stats for a user
export async function getFollowStats(userId: string, currentUserId?: string): Promise<FollowStats> {
  // Get followers count
  const { count: followersCount, error: followersError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followed_id', userId)

  if (followersError) {
    console.error('Error fetching followers count:', followersError)
  }

  // Get following count
  const { count: followingCount, error: followingError } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)

  if (followingError) {
    console.error('Error fetching following count:', followingError)
  }

  // Check if current user is following this user
  let isFollowingStatus = false
  if (currentUserId && currentUserId !== userId) {
    isFollowingStatus = await isFollowing(currentUserId, userId)
  }

  return {
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    isFollowing: isFollowingStatus
  }
}

// Get followers of a user
export async function getFollowers(userId: string, limit = 20, offset = 0): Promise<any[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower_id,
      profiles:follower_id (
        id,
        full_name,
        display_name,
        profile_image
      )
    `)
    .eq('followed_id', userId)
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching followers:', error)
    return []
  }

  return data.map((item: any) => item.profiles)
}

// Get users that a user is following
export async function getFollowing(userId: string, limit = 20, offset = 0): Promise<any[]> {
  const { data, error } = await supabase
    .from('follows')
    .select(`
      followed_id,
      profiles:followed_id (
        id,
        full_name,
        display_name,
        profile_image
      )
    `)
    .eq('follower_id', userId)
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching following:', error)
    return []
  }

  return data.map((item: any) => item.profiles)
}