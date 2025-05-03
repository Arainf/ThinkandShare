import { DATA } from '@/assets/dummyData/notification'; // Import the sample data
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';

export default function Notification() {
  const renderNotification = ({ item }: { item: any }) => (
    <View style={styles.notificationCard}>
      <Image source={{ uri: item.image }} style={styles.notificationImage} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          <Text style={styles.notificationAuthor}>{item.author}</Text> {item.content}
        </Text>
        <Text style={styles.notificationDate}>{item.date}</Text>
      </View>
      <View style={styles.notificationActions}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#374151" />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>New</Text>
      <FlatList
        data={DATA.slice(0, 2)} // Display the first 2 items as "New"
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <Text style={styles.sectionHeader}>Earlier</Text>
      <FlatList
        data={DATA.slice(2)} // Display the rest as "Earlier"
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginVertical: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    color: '#374151',
  },
  notificationAuthor: {
    fontWeight: 'bold',
  },
  notificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  notificationActions: {
    padding: 8,
  },
});