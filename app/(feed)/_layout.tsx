import Header from '@/components/header/header'
import { Stack } from 'expo-router'

export default function FeedLayout() {
	return (
		<Stack
			screenOptions={{
				header: () => <Header />,
				animation: 'fade' // Use the custom header
			}}>
			<Stack.Screen name="index" />
			<Stack.Screen name="notification" />
			<Stack.Screen name="profile" />
			<Stack.Screen name="noteposting" />
		</Stack>
	)
}
