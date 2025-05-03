import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
   ActivityIndicator,
   Alert,
   KeyboardAvoidingView,
   Platform,
   ScrollView,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   useColorScheme,
   View
} from 'react-native'
import { supabase } from '../../../config/supabaseClient'

export default function Login() {
	const colorScheme = useColorScheme()
	const router = useRouter()
	const [isloading, setIsLoading] = useState(false)

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const handleLogin = async () => {
		setIsLoading(true)
		const {data, error} = await supabase.auth.signInWithPassword({
			email,
			password
		})

		if (error) {
			Alert.alert('Login Failed', error.message)
		} else {
			const user = data.user // Get the logged-in user's details

			// Fetch the user's profile to check if it's their first login
			const {data: profile, error: profileError} = await supabase
				.from('profiles') // Replace with your table name
				.select('is_first_login')
				.eq('id', user.id) // Match the user_id with the logged-in user's ID
				.single()

			if (profileError) {
				console.error('Error fetching profile:', profileError)
				Alert.alert('Error', 'Could not fetch user profile.')
			} else {
				if (profile.is_first_login) {
					setIsLoading(false)
					// Redirect to the profile-card route if it's the user's first login
					router.push('/profile-card')
				} else {
					// Redirect to the feed route otherwise
					router.replace('/(feed)')
				}
			}
		}
	}
	const theme = colorScheme === 'light' ? styles.light : styles.dark
	const buttonBackgroundColor = useMemo(() => {
		const baseColor = colorScheme === 'light' ? '#3b82f6' : '#8B5CF6'
		return isloading ? (colorScheme === 'light' ? '#93c5fd' : '#a78bfa') : baseColor // Lighter color when disabled/loading
	}, [colorScheme, isloading])

	return (
		<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
				<View style={theme.container}>
					<View style={theme.textContainer}>
						<Text style={theme.header}>Welcome Back!</Text>
						<Text style={theme.subheader}>Log in to your account</Text>
					</View>

					<View style={theme.credentialsContainer}>
						<View>
							<Text style={theme.label}>Email</Text>
							<View style={theme.inputWithPrefixContainer}>
								<TextInput
									style={theme.textInputPrefixed}
									placeholder="e.g thinkshare@email.com"
									placeholderTextColor="#8E8E8E"
									autoCapitalize="none"
									value={email}
									onChangeText={setEmail}
								/>
							</View>
						</View>

						<View>
							<Text style={theme.label}>Password</Text>
							<View style={theme.inputWithPrefixContainer}>
								<TextInput
									style={theme.textInputPrefixed}
									placeholder="Password"
									placeholderTextColor="#8E8E8E"
									secureTextEntry={true}
									autoCapitalize="none"
									value={password}
									onChangeText={setPassword}
								/>
							</View>
						</View>
					</View>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'center',
							margin: 20
						}}>
						<View style={[theme.textLayout]}>
							<Text style={theme.text}>Don't have an account? </Text>
							<Text
								onPress={() => router.push('/register')}
								style={theme.link}>
								Sign up here
							</Text>
						</View>
						<TouchableOpacity
							onPress={handleLogin}
							style={[
								theme.button,
								{
									backgroundColor: buttonBackgroundColor
								}
							]}
							disabled={isloading}>
							{isloading ? (
								<ActivityIndicator size="small" color={'black'} />
							) : (
								<Text style={[theme.buttonText]}>Login</Text>
							)}
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

// Add your styles here (same as before)
// ======== Styles ======== //
const baseStyles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'flex-start',
		width: '100%',
		justifyContent: 'center',
		gap: 40
	},
	textContainer: {
		marginHorizontal: '8%',
		marginTop: 10,
		alignItems: 'flex-start',
		justifyContent: 'flex-start'
	},
	header: {
		fontFamily: 'nunitoExtraBold',
		fontSize: 35
	},
	textLayout: {
		flexDirection: 'column',
		alignItems: 'flex-start',
		height: 50,
		width: 250
	},
	subheader: {
		fontFamily: 'nunitoBold',
		fontSize: 18
	},
	credentialsContainer: {
		flex: 1,
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		width: '100%',
		paddingHorizontal: '8%'
	},
	textInputContainer: {
		width: '100%',
		gap: 20
	},
	textInput: {
		fontSize: 16,
		marginBottom: 10,
		paddingBottom: 10,
		borderBottomColor: '#8E8E8E',
		borderBottomWidth: 2,
		width: '100%'
	},
	label: {
		fontFamily: 'nunitoBold',
		fontSize: 14,
		marginVertical: 6
	},
	// Style for the View containing the '@' and the TextInput
	inputWithPrefixContainer: {
		flexDirection: 'row',
		alignItems: 'center', // Vertically align '@' and input
		borderBottomWidth: 1, // Apply border to the container
		width: '100%',
		paddingVertical: Platform.OS === 'ios' ? 10 : 8 // Consistent padding
	},
	// Style for the '@' Text
	prefixText: {
		fontFamily: 'nunitoRegular', // Match input font style
		fontSize: 16,
		marginRight: 4 // Space between '@' and the actual input
	},
	// Style for the TextInput when used with a prefix
	textInputPrefixed: {
		flex: 1, // Take remaining space in the row
		fontSize: 16,
		fontFamily: 'nunitoRegular', // Match input font style
		paddingVertical: 0 // Remove default padding if container handles it
		// No border here - the container has it
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
		width: 'auto',
		minWidth: '30%',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
		elevation: 8,
		paddingHorizontal: 20
	},
	buttonText: {
		fontSize: 14,
		fontFamily: 'nunitoBold'
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
		flexDirection: 'row',
		alignContent: 'center',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		paddingHorizontal: '9%'
	}
})

// ======= Light & Dark Theme ======= //
const styles = {
	light: StyleSheet.create({
		...baseStyles,
		container: {...baseStyles.container, backgroundColor: '#fff'},
		header: {...baseStyles.header, color: '#374151'},
		subheader: {...baseStyles.subheader, color: '#374151'},
		button: {...baseStyles.button, backgroundColor: '#3b82f6'},
		buttonText: {...baseStyles.buttonText, color: '#000'},
		separatorLine: {
			...baseStyles.separatorLine,
			backgroundColor: '#8E8E8E'
		},
		separatorText: {
			...baseStyles.separatorText,
			color: '#8E8E8E'
		},
		label: {...baseStyles.label, color: '#2A3547'},
		text: {...baseStyles.text, color: '#2A3547'},
		link: {...baseStyles.link, color: '#009DFF'},
		textInputPrefixed: {
			...baseStyles.textInputPrefixed,
			color: '#111827'
		}
	}),
	dark: StyleSheet.create({
		...baseStyles,
		container: {
			...baseStyles.container,
			backgroundColor: '#111827'
		},
		header: {...baseStyles.header, color: '#F9FAFB'},
		subheader: {...baseStyles.subheader, color: '#F9FAFB'},
		button: {...baseStyles.button, backgroundColor: '#8B5CF6'},
		buttonText: {...baseStyles.buttonText, color: '#F9FAFB'},
		separatorLine: {
			...baseStyles.separatorLine,
			backgroundColor: '#2A3547'
		},
		separatorText: {
			...baseStyles.separatorText,
			color: '#2A3547'
		},
		label: {...baseStyles.label, color: '#b4b4b4'},
		text: {...baseStyles.text, color: '#b4b4b4'},
		link: {...baseStyles.link, color: '#8B5CF6'},
		textInputPrefixed: {
			...baseStyles.textInputPrefixed,
			color: '#F9FAFB'
		}
	})
}
