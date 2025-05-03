import DefaultHeader from '@/components/header/deafultHeader'
import Header from '@/components/header/header'
import { useFonts } from 'expo-font'
import { Stack, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useMemo, useState } from 'react'
import { InteractionManager, Modal, StyleSheet, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
	const [loading, setLoading] = useState(false)
	const segments = useSegments() || []

	const [fontsLoaded, fontError] = useFonts({
		nunitoExtraBold: require('../assets/fonts/Nunito/static/Nunito-ExtraBold.ttf'),
		nunitoBold: require('../assets/fonts/Nunito/static/Nunito-Bold.ttf'),
		nunitoRegular: require('../assets/fonts/Nunito/static/Nunito-Regular.ttf')
	})

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync()
		}
	}, [fontsLoaded])

	useEffect(() => {
		if (segments[0] === '(feed)') {
			setLoading(false)
			return
		}

		setLoading(true)
		const interaction = InteractionManager.runAfterInteractions(() => {
			setLoading(false)
		})

		return () => interaction.cancel()
	}, [segments])

	useEffect(() => {
		if (!loading) {
			SplashScreen.hideAsync()
		}
	}, [loading])

	const headerComponent = useMemo(() => {
		if (segments[0] === '(feed)') return null
		if (segments[0] === '(auth)') {
			return <DefaultHeader /> // Ensure DefaultHeader is used for (auth)
		}
		if (segments[0] === 'noteposting') {
			return <Header createPost={true} />
		}
		return <DefaultHeader />
	}, [segments])

	if (!fontsLoaded) return null
	if (fontError) {
		console.error('Font loading error:', fontError)
		return null
	}

	return (

		<SafeAreaProvider>
			{/* Loading Modal */}
			{loading && (
				<Modal visible={loading} animationType="fade" transparent>
					<View style={styles.modalContainer}>

					</View>
				</Modal>
			)}
			{/* Main Stack */}
			{segments[0] !== 'profile' && (segments[0] === '(auth)' || segments[0] === '(feed)') ? (
				// ✅ Use SafeAreaView normally
				<SafeAreaView style={styles.mainContainer}>
					<Stack
						screenOptions={{
							animation: 'fade',
							header: () => headerComponent
						}}
					/>
				</SafeAreaView>
				
			) : (
				// ❌ No SafeAreaView for profiles
				<View style={styles.mainContainer}>
					<Stack
						screenOptions={{
							animation: 'fade',
							header: () => null // no header for profile
						}}
					/>
				</View>
			)}
		</SafeAreaProvider>
  
	)
}

const styles = StyleSheet.create({
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1000 // Added zIndex to ensure visibility
	},
	mainContainer: {
		flex: 1,
		zIndex: 1 // Lower zIndex to avoid overlapping the Modal
	}
})
