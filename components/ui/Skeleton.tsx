// components/ui/Skeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}: SkeletonProps) {
  const { isDark } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmer.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH]
    );
    return {
      transform: [{ translateX }],
    };
  });

  const backgroundColor = isDark ? colors.dark100 : colors.neutral200;
  const shimmerColor = isDark ? colors.dark50 : colors.neutral100;

  return (
    <View
      style={[
        styles.container,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Preset Skeletons
export function SkeletonCard() {
  const { isDark } = useTheme();
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: isDark ? colors.dark100 : colors.white },
      ]}
    >
      <View style={styles.cardHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={16} borderRadius={4} />
          <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton width="100%" height={12} borderRadius={4} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
    </View>
  );
}

export function SkeletonDealCard() {
  const { isDark } = useTheme();
  
  return (
    <View
      style={[
        styles.dealCard,
        { backgroundColor: isDark ? colors.dark100 : colors.white },
      ]}
    >
      <Skeleton width="70%" height={14} borderRadius={4} />
      <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <View style={styles.dealCardFooter}>
        <Skeleton width={60} height={20} borderRadius={4} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  dealCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: 160,
  },
  dealCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  list: {
    padding: 16,
  },
});