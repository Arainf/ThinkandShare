import Entypo from '@expo/vector-icons/Entypo'
import { useRouter } from 'expo-router'
import { memo, useCallback, useMemo, useState } from 'react'
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

// ======== Define Form Component OUTSIDE Register ========
type FormProps = {
	step: number
	name: string
	setName: (value: string) => void
	email: string
	setEmail: (value: string) => void
	password: string
	setPassword: (value: string) => void
	theme: any
	textColor: string
	isLoading: any
	textError: string
	eyeOpener: boolean
	setEyeToggle: (value: boolean) => void
	confirmPassword: string
	setConfirmPassword: (value: string) => void
}

const Form = memo(
	({
		step,
		name,
		setName,
		email,
		setEmail,
		password,
		setPassword,
		theme,
		textColor,
		isLoading,
		textError,
		eyeOpener,
		setEyeToggle,
		confirmPassword,
		setConfirmPassword
	}: FormProps) => {
		if (step === 0) {
			return (
				<>
					<View style={theme.textContainer}>
						<Text style={theme.header}>@your name that will make your legacy</Text>
					</View>

					<View style={theme.credentialsContainer}>
						<View style={theme.textInputContainer}>
							<View>
								<Text style={theme.label}>Username</Text>
								{/* Container for the prefix and input */}
								<View style={theme.inputWithPrefixContainer}>
									<Text style={theme.prefixText}>@</Text>
									<TextInput
										style={theme.textInputPrefixed} // Use specific style
										placeholder="yourname" // Placeholder without "@"
										placeholderTextColor={textColor}
										autoCapitalize="none"
										value={name} // Value is just the name, no "@"
										onChangeText={setName}
										editable={!isLoading} // Disable input while checking
									/>
								</View>
								<Text
									style={{
										fontFamily: 'nunitoBold',
										color: 'red',
										fontSize: 12,
										marginVertical: 10
									}}>
									{textError}
								</Text>
							</View>
						</View>
					</View>
				</>
			)
		} else if (step === 1) {
			return (
				<>
					<View style={theme.textContainer}>
						<Text style={theme.header}>Let's make sure your account is safe</Text>
					</View>

					<View style={theme.credentialsContainer}>
						<View style={theme.inputWithPrefixContainer}>
							<View>
								<Text style={theme.label}>Email</Text>
								<TextInput
									style={theme.textInputPrefixed}
									placeholder="e.g thinkshare@email.com"
									placeholderTextColor={textColor}
									autoCapitalize="none"
									value={email}
									onChangeText={setEmail} // Pass down the setter
									keyboardType="email-address" // Good practice for email
								/>
							</View>
						</View>

						<View>
							<Text style={theme.label}>Password</Text>
							<View style={theme.inputWithPrefixContainer}>
								<TextInput
									style={theme.textInputPrefixed}
									placeholder="&#183;&#183;&#183;&#183;&#183;&#183;&#183;&#183;&#183;"
									placeholderTextColor={textColor}
									autoCapitalize="none"
									secureTextEntry={eyeOpener}
									value={password}
									onChangeText={setPassword} // Pass down the setter
								/>
								<TouchableOpacity
									onPress={() => setEyeToggle(!eyeOpener)}>
									{eyeOpener ? (
										<Entypo
											name="eye"
											size={24}
											color="black"
										/>
									) : (
										<Entypo
											name="eye-with-line"
											size={24}
											color="black"
										/>
									)}
								</TouchableOpacity>
							</View>
						</View>

						{/* You need a SEPARATE state for the confirmation password */}
						<View>
							<Text style={theme.label}>Confirm Password</Text>
							<View style={theme.inputWithPrefixContainer}>
								<TextInput
									style={theme.textInputPrefixed}
									placeholder="&#183;&#183;&#183;&#183;&#183;&#183;&#183;&#183;&#183;"
									placeholderTextColor={textColor}
									autoCapitalize="none"
									secureTextEntry={eyeOpener}
									value={confirmPassword} // Needs its own state
									onChangeText={setConfirmPassword} // Needs its own state setter
								/>
								<TouchableOpacity
									onPress={() => setEyeToggle(!eyeOpener)}>
									{eyeOpener ? (
										<Entypo
											name="eye"
											size={24}
											color="black"
										/>
									) : (
										<Entypo
											name="eye-with-line"
											size={24}
											color="black"
										/>
									)}
								</TouchableOpacity>
							</View>
						</View>
						{/* Note: Your original code reused the 'password' state for Confirm Password,
                which wouldn't allow proper confirmation logic. You'll need separate state for that. */}
					</View>
				</>
			)
		}
		return null // Return null or some fallback if step is unexpected
	}
)

export default function Register() {
	const colorScheme = useColorScheme()
	const router = useRouter()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [name, setName] = useState('')
	const [step, setStep] = useState(0)
	const [buttonText, setButtonText] = useState('Next')
	const [isLoading, setIsLoading] = useState(false)
	const [textError, setTextError] = useState('')
	const [eyeToggle, setEyeToggle] = useState(true)

	// --- Username Check Function ---
	const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
		if (!usernameToCheck || usernameToCheck.trim().length < 3) {
			Alert.alert('Invalid Username', 'Username must be at least 3 characters long.')
			return false
		}
		setIsLoading(true)
		try {
			// Call the database function
			const {data, error} = await supabase.rpc('check_username_exists', {
				username_to_check: usernameToCheck.trim()
			})

			if (error) {
				console.error('RPC username check error:', error)
				Alert.alert('Error', 'Could not check username. Please try again.')
				return false
			}

			// The function returns 'true' if the username exists
			if (data === true) {
				setTextError(
					`The username "@${usernameToCheck.trim()}" is already taken. Please choose another.`
				)
				return false // Indicate username is taken
			}

			return true // Indicate username is available (data was false)
		} catch (err) {
			console.error('Error calling RPC function:', err)
			Alert.alert('Error', 'An unexpected error occurred while checking the username.')
			return false
		} finally {
			setIsLoading(false)
		}
	}, [])

	// --- Handle Registration Logic ---
	const handleRegister = async () => {
		if (isLoading) return // Don't do anything if already loading

		// === Step 0: Check Username ===
		if (step === 0) {
			const isAvailable = await checkUsernameAvailability(name)
			if (isAvailable) {
				setStep(1)
				setButtonText('Create Account') // Changed button text
			}
			// If not available, alerts are handled within checkUsernameAvailability
		}
		// === Step 1: Create Account ===
		else if (step === 1) {
			if (!email.trim() || !password.trim()) {
				Alert.alert('Missing Info', 'Please enter email and password.')
				return
			}
			// Add password confirmation check here if you implement it

			setIsLoading(true) // Set loading for account creation
			try {
				const {data, error} = await supabase.auth.signUp({
					email: email.trim(),
					password: password, // Let Supabase handle password validation/trimming
					options: {
						data: {
							// Store the username WITHOUT the "@"
							// This assumes 'full_name' is where you want to store it initially
							// Often, you'll have a trigger setup in Supabase to copy this to a 'profiles' table
							full_name: name.trim()
							// You might prefer a 'username' field if your setup uses that in options.data
							// username: name.trim()
						}
					}
				})

				if (password !== confirmPassword) {
					Alert.alert("Password don't match")
				} else {
					if (error) {
						Alert.alert('Registration Failed', error.message)
					} else if (data.user) {
						// Check if email confirmation is required
						const confirmationRequired =
							data.user.identities &&
							data.user.identities.length > 0 &&
							!data.user.email_confirmed_at

						Alert.alert(
							'Success!',
							`Account created successfully! ${
								confirmationRequired
									? 'Please check your email to verify your account.'
									: ''
							}`
						)
						// It's often better to go to a "Check your email" screen or back to login
						// instead of directly logging them in if confirmation is needed.
						router.push('/login')
					} else {
						// Handle unexpected case where there's no error but no user data
						Alert.alert(
							'Registration Issue',
							'Account may have been created, but verification is needed or an issue occurred.'
						)
						router.push('/login')
					}
				}
			} catch (err) {
				console.error('Sign up error:', err)
				Alert.alert('Error', 'An unexpected error occurred during sign up.')
			} finally {
				setIsLoading(false) // Clear loading state
			}
		}
	}

	// --- Theming ---
	const theme = useMemo(() => (colorScheme === 'light' ? styles.light : styles.dark), [colorScheme])
	const textColor = useMemo(() => (colorScheme === 'light' ? '#2A3547' : '#b4b4b4'), [colorScheme])
	const buttonBackgroundColor = useMemo(() => {
		const baseColor = colorScheme === 'light' ? '#3b82f6' : '#8B5CF6'
		return isLoading ? (colorScheme === 'light' ? '#93c5fd' : '#a78bfa') : baseColor // Lighter color when disabled/loading
	}, [colorScheme, isLoading])
	const buttonTextColor = useMemo(() => (colorScheme === 'light' ? '#FFFFFF' : '#F9FAFB'), [colorScheme])

	return (
		<KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
				<View style={theme.container}>
					<Form
						step={step}
						name={name}
						setName={setName}
						email={email}
						setEmail={setEmail}
						password={password}
						setPassword={setPassword}
						theme={theme} // Pass whole theme object
						textColor={textColor}
						isLoading={isLoading}
						textError={textError}
						eyeOpener={eyeToggle}
						setEyeToggle={setEyeToggle}
						confirmPassword={confirmPassword}
						setConfirmPassword={setConfirmPassword}
					/>

					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'center',
							margin: 20
						}}>
						<View style={theme.textLayout}>
							<Text style={theme.text}>Already have an account? </Text>
							<Text onPress={() => router.push('/login')} style={theme.link}>
								Login here
							</Text>
						</View>

						<TouchableOpacity
							onPress={handleRegister}
							style={[
								theme.button,
								{
									backgroundColor: buttonBackgroundColor
								}
							]} // Dynamic background
							disabled={isLoading} // Disable button when loading
						>
							{isLoading ? (
								<ActivityIndicator
									size="small"
									color={buttonTextColor}
								/>
							) : (
								<Text
									style={[
										theme.buttonText,
										{
											color: buttonTextColor
										}
									]}>
									{buttonText}
								</Text>
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
		fontSize: 30
	},
	subheader: {
		fontFamily: 'nunitoBold',
		fontSize: 18
	},
	label: {
		fontFamily: 'nunitoBold',
		fontSize: 14,
		marginVertical: 6
	},
	credentialsContainer: {
		flex: 1,
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		width: '100%',
		paddingHorizontal: '8%'
	},
	textInputContainer: {
		flexDirection: 'column',
		width: '100%',
		gap: 10,
		justifyContent: 'space-between'
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
	textLayout: {
		flexDirection: 'column',
		alignItems: 'flex-start',
		height: 50,
		width: 250
	},
	textInput: {
		fontSize: 16,
		marginBottom: 10,
		borderBottomColor: '#8E8E8E',
		borderWidth: 2,
		width: '100%',
		padding: 7,
		borderRadius: 5
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
	buttonLogo: {
		width: 20,
		height: 20
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
		text: {...baseStyles.text, color: '#2A3547'},
		link: {...baseStyles.link, color: '#009DFF'},
		label: {...baseStyles.label, color: '#2A3547'},
		textInput: {...baseStyles.textInput, color: '#2A3547'},
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
		text: {...baseStyles.text, color: '#b4b4b4'},
		link: {...baseStyles.link, color: '#8B5CF6'},
		label: {...baseStyles.label, color: '#b4b4b4'},
		textInput: {...baseStyles.textInput, color: '#b4b4b4'},
		textInputPrefixed: {
			...baseStyles.textInputPrefixed,
			color: '#F9FAFB'
		}
	})
}
