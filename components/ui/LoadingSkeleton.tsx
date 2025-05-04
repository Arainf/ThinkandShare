import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

const LoadingSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Profile Image Skeleton */}
      <Svg height="50" width="50" style={styles.profileSkeleton}>
        <Rect x="0" y="0" width="50" height="50" rx="25" fill="#E0E0E0" />
      </Svg>

      {/* Text Skeleton */}
      <View style={styles.textContainer}>
        <Svg height="20" width="150">
          <Rect x="0" y="0" width="150" height="20" rx="4" fill="#E0E0E0" />
        </Svg>
        <Svg height="15" width="100" style={styles.subTextSkeleton}>
          <Rect x="0" y="0" width="100" height="15" rx="4" fill="#E0E0E0" />
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 10,
  },
  profileSkeleton: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  subTextSkeleton: {
    marginTop: 5,
  },
});

export default LoadingSkeleton;