// lib/animations.tsx
// Shared animation utilities - subtle, one-time-only animations
import React, { useRef, useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

// Global tracker - prevents re-animation on tab switch
const animatedScreens = new Set<string>();

/**
 * Fade-in + slight slide up for list items (first load only)
 */
export function useFadeInUp(index: number = 0, screenKey: string = 'default') {
  const hasAnimated = useRef(animatedScreens.has(screenKey));
  const opacity = useRef(new Animated.Value(hasAnimated.current ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(hasAnimated.current ? 0 : 10)).current;

  useEffect(() => {
    if (hasAnimated.current) return;

    const delay = Math.min(index * 50, 250);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start(() => {
      animatedScreens.add(screenKey);
    });
  }, []);

  return { opacity, translateY };
}

/**
 * FAB - no animation, always visible
 */
export function useFabBounce() {
  const scale = useRef(new Animated.Value(1)).current;
  return { scale };
}

/**
 * Count-up animation for numbers (only on value change)
 */
export function useCountUp(target: number, duration: number = 600): number {
  const [display, setDisplay] = useState(target);
  const animValue = useRef(new Animated.Value(0)).current;
  const prevTarget = useRef(target);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip animation on first render (prevents flash from 0)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(target);
      prevTarget.current = target;
      return;
    }

    // Only animate if value actually changed
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    animValue.setValue(0);
    const listener = animValue.addListener(({ value }) => {
      setDisplay(Math.round(value * target));
    });

    Animated.timing(animValue, {
      toValue: 1,
      duration: target === 0 ? 0 : duration,
      useNativeDriver: false,
      easing: Easing.out(Easing.ease),
    }).start();

    return () => animValue.removeListener(listener);
  }, [target]);

  return display;
}

/**
 * Animated FlatList item wrapper (one-time animation)
 */
export function AnimatedListItem({
  children,
  index,
  screenKey = 'list',
}: {
  children: React.ReactNode;
  index: number;
  screenKey?: string;
}) {
  const { opacity, translateY } = useFadeInUp(index, screenKey);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
