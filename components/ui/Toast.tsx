// components/ui/Toast.tsx
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { colors } from '@/design-tokens/primitives/colors';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const TOAST_CONFIG: Record<ToastType, { color: string; icon: string }> = {
  success: { color: colors.success500, icon: 'checkmark-circle' },
  error: { color: colors.error500, icon: 'alert-circle' },
  info: { color: colors.info500, icon: 'information-circle' },
  warning: { color: colors.warning500, icon: 'warning' },
};

export function Toast({
  message,
  type = 'success',
  visible,
  onHide,
  duration = 2500,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const config = TOAST_CONFIG[type];

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (visible) {
      // Show toast
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });

      // Auto hide after duration
      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(-100, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 });
        
        // Call onHide after animation completes
        setTimeout(onHide, 350);
      }, duration);
    } else {
      // Reset immediately when hidden
      translateY.value = -100;
      opacity.value = 0;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [visible, duration, onHide]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  // Always render, let opacity handle visibility
  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 10, backgroundColor: config.color },
        animatedStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Ionicons name={config.icon as any} size={20} color={colors.white} />
      <Text variant="bodyMd" style={styles.message}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  message: {
    color: colors.white,
    marginLeft: 10,
    flex: 1,
  },
});