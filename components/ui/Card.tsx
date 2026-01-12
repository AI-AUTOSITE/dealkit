// components/ui/Card.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  elevated?: boolean;
}

export function Card({
  children,
  onPress,
  style,
  padding = 16,
  elevated = false,
}: CardProps) {
  const { isDark } = useTheme();

  const backgroundColor = isDark ? colors.dark100 : colors.white;
  const borderColor = isDark ? colors.neutral800 : colors.neutral200;

  const cardStyle: ViewStyle = {
    backgroundColor,
    borderColor,
    borderWidth: 1,
    borderRadius: 12,
    padding,
    ...(elevated && {
      shadowColor: isDark ? '#000' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}

const styles = StyleSheet.create({});