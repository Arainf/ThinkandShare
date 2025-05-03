import { supabase } from '@/config/supabaseClient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Setting() {
	const router = useRouter();

	const handleLogout = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) {
				Alert.alert('Error', 'Failed to log out. Please try again.');
			} else {
				// Redirect to the login screen after successful logout
				router.push('/');
			}
		} catch (err) {
			console.error('Logout error:', err);
			Alert.alert('Error', 'An unexpected error occurred.');
		}
	};

	const handleProfile = async () => {
		try {
			router.push('/profile');
		} catch (err) {
			console.error('Profile navigation error:', err);
			Alert.alert('Error', 'An unexpected error occurred.');
		}
	};

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>

				<View style={styles.menuContainer}>
					<TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
						<Ionicons name="person-circle-outline" size={24} color="#374151" />
						<Text style={styles.menuText}>Profile</Text>
					</TouchableOpacity>

					<TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
						<Ionicons name="log-out-outline" size={24} color="#ef4444" />
						<Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f9f9f9',
	},
	container: {
		flex: 1,
		padding: 20,
	},
	headerText: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#374151',
		marginBottom: 20,
	},
	menuContainer: {
		marginTop: 20,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 15,
		paddingHorizontal: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	menuText: {
		fontSize: 18,
		color: '#374151',
		marginLeft: 10,
	},
	logoutText: {
		color: '#ef4444',
		fontWeight: 'bold',
	},
});
