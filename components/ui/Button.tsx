// components/ui/Button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { isDark } = useTheme();

  const getBackgroundColor = (): string => {
    if (disabled) return isDark ? colors.neutral800 : colors.neutral200;
    
    switch (variant) {
      case 'primary':
        return isDark ? colors.primary400 : colors.primary600;
      case 'secondary':
        return isDark ? colors.dark50 : colors.neutral100;
      case 'ghost':
        return 'transparent';
      case 'destructive':
        return colors.error500;
      default:
        return colors.primary500;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return isDark ? colors.neutral600 : colors.neutral400;
    
    switch (variant) {
      case 'primary':
        return colors.white;
      case 'secondary':
        return isDark ? colors.primary400 : colors.primary600;
      case 'ghost':
        return isDark ? colors.primary400 : colors.primary600;
      case 'destructive':
        return colors.white;
      default:
        return colors.white;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'secondary') {
      return isDark ? colors.neutral700 : colors.neutral300;
    }
    return 'transparent';
  };

  const getHeight = (): number => {
    switch (size) {
      case 'sm': return 36;
      case 'md': return 44;
      case 'lg': return 52;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm': return 14;
      case 'md': return 16;
      case 'lg': return 18;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'secondary' ? 1 : 0,
          height: getHeight(),
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: getFontSize(),
            },
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  text: {
    fontWeight: '600',
  },
});