// components/ui/Text.tsx
import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';

type TextVariant =
  | 'display'
  | 'headingXl'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'caption'
  | 'label';

type TextColor = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'error' | 'success';

interface TextProps {
  children: React.ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  style?: TextStyle;
  numberOfLines?: number;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  display: { fontSize: 32, fontWeight: '600', lineHeight: 40 },
  headingXl: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  headingLg: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  headingMd: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  headingSm: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
  bodyLg: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  bodySm: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '500', lineHeight: 16, letterSpacing: 0.5 },
};

export function Text({
  children,
  variant = 'bodyMd',
  color = 'primary',
  style,
  numberOfLines,
}: TextProps) {
  const { isDark } = useTheme();

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return isDark ? colors.neutral100 : colors.neutral950;
      case 'secondary':
        return isDark ? colors.neutral400 : colors.neutral600;
      case 'tertiary':
        return isDark ? colors.neutral500 : colors.neutral400;
      case 'inverse':
        return isDark ? colors.neutral950 : colors.neutral100;
      case 'error':
        return colors.error500;
      case 'success':
        return colors.success500;
      default:
        return isDark ? colors.neutral100 : colors.neutral950;
    }
  };

  return (
    <RNText
      style={[variantStyles[variant], { color: getColor() }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}