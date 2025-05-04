
import DefaultHeader from '@/components/header/deafultHeader'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useMemo, useState } from 'react'
import {
	Image,
	SafeAreaView,
	StyleSheet,
	Text,
	TouchableOpacity,
	useColorScheme,
	View
} from 'react-native'
import { supabase } from '../config/supabaseClient'

WebBrowser.maybeCompleteAuthSession()

export default function Index() {
	const colorScheme = useColorScheme()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(true) // Add loading state

	// Google OAuth configuration
	

	// Check session on app launch
	useEffect(() => {
		const checkSession = async () => {
			const {data: session} = await supabase.auth.getSession()

			if (session?.session) {
				// If a session exists, redirect to the Feed screen
				router.replace('/(feed)')
			} else {
				// If no session exists, show the login/register screen
				// router.push('/')
				setIsLoading(false)
			}
		}

		checkSession()
	}, [])

	// Handle Google OAuth response
	

	

	// Select theme dynamically
	const theme = useMemo(() => (colorScheme === 'light' ? styles.light : styles.dark), [colorScheme])
	const googleLogo =
		colorScheme === 'light'
			? require('../assets/icons/white-google-brands.png')
			: require('../assets/icons/dark-google-brands.png')



	return (
		<SafeAreaView style={{flex: 1}}>
			<DefaultHeader/>
			<View style={theme.container}>
				<View style={theme.textContainer}>
					<Text style={theme.header}>It's time to learn new things!</Text>
				</View>

				<View style={theme.buttonContainer}>
					<TouchableOpacity
						style={theme.button}
						>
						<Image style={theme.buttonLogo} source={googleLogo} />
						<Text style={theme.buttonText}>Continue with Google</Text>
					</TouchableOpacity>

					<View style={theme.separatorContainer}>
						<View style={theme.separatorLine} />
						<Text style={theme.separatorText}>or</Text>
						<View style={theme.separatorLine} />
					</View>

					<TouchableOpacity onPress={() => router.push('/register')} style={theme.button}>
						<Text style={theme.buttonText}>Create account</Text>
					</TouchableOpacity>

					<Text style={theme.agreement}>
						By signing up, you agree to our <Text style={theme.link}>Terms</Text>,{' '}
						<Text style={theme.link}>Privacy Policy</Text>, and{' '}
						<Text style={theme.link}>Cookie Use</Text>.
					</Text>
				</View>

				<View style={theme.footer}>
					<Text style={theme.text}>
						Already have an account?{' '}
						<Text onPress={() => router.push('/login')} style={theme.link}>
							Log In
						</Text>
					</Text>
				</View>
			</View>
		</SafeAreaView>
	)
}

// ======== Styles ======== //
const baseStyles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		width: '100%',
		justifyContent: 'center'
	},
	textContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 3,
		paddingHorizontal: '8%'
	},
	header: {
		fontFamily: 'nunitoExtraBold',
		fontSize: 35
	},
	buttonContainer: {
		flex: 1,
		alignItems: 'center',
		width: '100%',
		gap: 10,
		marginBottom: -20
	},
	button: {
		flexDirection: 'row',
		gap: 10,
		width: '85%',
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
		paddingVertical: 10,
		elevation: 8
	},
	buttonText: {
		fontSize: 14,
		fontFamily: 'nunitoBold'
	},
	buttonLogo: {
		width: 20,
		height: 21
	},
	separatorContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 35
	},
	separatorLine: {
		width: 120,
		height: 2
	},
	separatorText: {
		marginHorizontal: 10
	},
	text: {
		width: '80%',
		fontFamily: 'nunitoRegular',
		fontSize: 13
	},
	link: {
		fontFamily: 'nunitoBold'
	},
	agreement: {
		fontSize: 10,
		width: '80%',
		fontFamily: 'nunitoRegular'
	},
	footer: {
		flex: 0.5,
		alignContent: 'center',
		justifyContent: 'center',
		alignItems: 'flex-start',
		width: '100%',
		paddingLeft: '9%'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	}
})

// ======= Light & Dark Theme ======= //
const styles = {
	light: StyleSheet.create({
		...baseStyles,
		container: {...baseStyles.container, backgroundColor: '#fff'},
		header: {...baseStyles.header, color: '#374151'},
		button: {...baseStyles.button, backgroundColor: '#3b82f6'},
		buttonText: {...baseStyles.buttonText, color: '#000'},
		separatorLine: {...baseStyles.separatorLine, backgroundColor: '#8E8E8E'},
		separatorText: {...baseStyles.separatorText, color: '#8E8E8E'},
		text: {...baseStyles.text, color: '#2A3547'},
		link: {...baseStyles.link, color: '#009DFF'}
	}),
	dark: StyleSheet.create({
		...baseStyles,
		container: {...baseStyles.container, backgroundColor: '#111827'},
		header: {...baseStyles.header, color: '#F9FAFB'},
		button: {...baseStyles.button, backgroundColor: '#8B5CF6'},
		buttonText: {...baseStyles.buttonText, color: '#F9FAFB'},
		separatorLine: {...baseStyles.separatorLine, backgroundColor: '#2A3547'},
		separatorText: {...baseStyles.separatorText, color: '#2A3547'},
		text: {...baseStyles.text, color: '#b4b4b4'},
		link: {...baseStyles.link, color: '#8B5CF6'}
	})
}
