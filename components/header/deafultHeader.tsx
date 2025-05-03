import { Ionicons } from '@expo/vector-icons'
import { useRouter, useSegments } from 'expo-router'
import { useMemo } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

export default function DefaultHeader() {
	const colorScheme = useColorScheme()
	const router = useRouter()
	const segments = useSegments()

	const themeProvider = colorScheme === 'light' ? stylesLightMode : stylesDarkMode
	const thinksharelogoIcon = useMemo(() => {
		return colorScheme === 'light'
			? require('@/assets/icons/white-mode-3x.png')
			: require('@/assets/icons/dark-mode-3x.png')
	}, [colorScheme])

	const isRoot = segments.length === 0 || (segments.length === 1 && !segments[0])

	return (
		<View style={[themeProvider.container]}>
			{/* Back Button */}
			{!isRoot && (
				<TouchableOpacity onPress={() => router.replace('/')} style={themeProvider.backButton}>
					<Ionicons
						name="arrow-back"
						size={24}
						color={colorScheme === 'light' ? '#000' : '#F9FAFB'}
					/>
					<Text style={themeProvider.backText}>Back</Text>
				</TouchableOpacity>
			)}
			{/* Logo */}
			<View style={{width: '100%', justifyContent: 'center'}}>
				<Image style={[themeProvider.imageLogo]} source={thinksharelogoIcon} />
			</View>
		</View>
	)
}

const stylesLightMode = StyleSheet.create({
	container: {
		height: 80,
		width: '100%',
		backgroundColor: '#fff',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start', // Center the logo
		paddingHorizontal: 15
	},
	imageLogo: {
		height: 60,
		width: 60,
		resizeMode: 'contain',
		alignSelf: 'center'
	},
	backButton: {
		left: 20,
		position: 'absolute',
		paddingVertical: 10,
		flexDirection: 'row',
		alignItems: 'center'
	},
	backText: {
		fontSize: 16,
		color: '#000',
		marginLeft: 5
	}
})

const stylesDarkMode = StyleSheet.create({
	...stylesLightMode,
	container: {
		...stylesLightMode.container,
		backgroundColor: '#111827'
	},
	backText: {
		fontSize: 16,
		color: '#F9FAFB',
		marginLeft: 5
	}
})
