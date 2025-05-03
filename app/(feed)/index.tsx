import PostElement from '@/components/ui/postElement'
import ProfileCardsElement from '@/components/ui/profileCardsElement'
import { FeedType, fetchNotes, Note } from '@/config/notesService'
import { supabase } from '@/config/supabaseClient'
import { Link, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
	ActivityIndicator,
	FlatList,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from 'react-native'

export default function Feed() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullname] = useState('')
  const [profileImg, setProfileImage] = useState('')
  const [initials, setInitials] = useState('')
  const [notes, setNotes] = useState<Note[]>([]) // State to store notes

  interface Profile {
    id: string
    full_name: string
    portrait_banner?: string
    profile_image?: string
  }

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [userId, setUserId] = useState('')

  function getInitials(fullName: string): string {
    if (!fullName) return ''

    const names = fullName.trim().split(/\s+/)
    const initials = names.slice(0, 2).map((name) => name[0].toUpperCase())
    return initials.join('')
  }

  // Fetch all profiles data
  const fetchProfilesData = async () => {
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session) {
      router.push('/login')
      return
    }

    try {
      const userId = session.session.user.id

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, portrait_banner, profile_image')
        .neq('id', userId)

      if (error) {
        console.error('Error fetching profiles data:', error)
      } else {
        setProfiles(data)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserData = async () => {
    const { data: session } = await supabase.auth.getSession()

    if (!session?.session) {
      router.push('/login')
      return
    }

    try {
      const userId = session.session.user.id

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, profile_image')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
      } else {
        setInitials(getInitials(data.display_name))
        setDisplayName(data.display_name)
        setFullname(data.full_name)
        setProfileImage(data.profile_image)
        setUserId(data.id)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notes for main feed
  const fetchMainFeedNotes = async () => {
    try {
      const notes = await fetchNotes({
        feedType: FeedType.MAIN,
        limit: 20
      })
      setNotes(notes)
    } catch (err) {
      console.error('Error fetching notes:', err)
    }
  }

  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      try {
        await Promise.all([
          fetchProfilesData(),
          fetchUserData(),
          fetchMainFeedNotes()
        ])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllData()
  }, [refreshKey])

  const handleUploadComplete = () => {
    setRefreshKey((prevKey) => prevKey + 1)
  }

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      fetchProfilesData(),
      fetchUserData(),
      fetchMainFeedNotes()
    ])
    setRefreshing(false)
    handleUploadComplete()
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  return (
    <FlatList
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Link
                href={{
                  pathname: '/profile/[id]',
                  params: { id: userId }
                }}>
                {profileImg ? (
                  <Image
                    style={styles.profileContainer}
                    source={{
                      uri: `${profileImg}?t=${Date.now()}`
                    }}
                  />
                ) : (
                  <View style={styles.profileContainer}>
                    <Text style={styles.profileText}>
                      {initials}
                    </Text>
                  </View>
                )}
              </Link>
              <View style={styles.textContainer}>
                <Text style={styles.textHeader}>{fullName}</Text>
                <Text style={styles.textSubheader}>@{displayName}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.replace('/(feed)/noteposting')}>
              <Image source={require('@/assets/icons/addNote.png')} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={profiles}
            renderItem={({ item }) => (
              <ProfileCardsElement ProfileCards={item} id={item.id} />
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.authorContainer}
            showsHorizontalScrollIndicator={false}
            horizontal={true}
          />
        </>
      }
      data={notes}
      renderItem={({ item }) => <PostElement note={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={true}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 50 }}>
          <Text style={{ fontSize: 20, color: '#999' }}>No posts yet.</Text>
        </View>
      }
    />
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    gap: 2,
    minHeight: '100%'
  },
  authorContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    overflow: 'visible',
    backgroundColor: '#fff',
    minWidth: '100%',
    marginTop: 3
  },
  header: {
    flexDirection: 'row',
    top: 1,
    zIndex: 1,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 90
  },
  textAuthor: {
    fontFamily: 'nunitoExtraBold',
    marginVertical: 10,
    marginStart: 15
  },
  profileContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  textContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignContent: 'center'
  },
  textHeader: {
    fontFamily: 'nunitoBold',
    fontSize: 14
  },
  textSubheader: {
    fontFamily: 'nunitoRegular',
    fontStyle: 'italic',
    color: '#585757',
    fontSize: 12
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    backgroundColor: 'blue'
  }
})