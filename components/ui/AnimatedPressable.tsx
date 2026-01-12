// components/ui/AnimatedPressable.tsx
import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { hapticLight } from '@/lib/haptics';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  haptic?: boolean;
}

export function AnimatedPressable({
  children,
  style,
  scaleValue = 0.97,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (event: any) => {
    scale.value = withSpring(scaleValue, {
      damping: 15,
      stiffness: 400,
    });
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
    onPressOut?.(event);
  };

  const handlePress = (event: any) => {
    if (haptic) {
      hapticLight();
    }
    onPress?.(event);
  };

  return (
    <AnimatedPressableComponent
      style={[animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      {...props}
    >
      {children}
    </AnimatedPressableComponent>
  );
}