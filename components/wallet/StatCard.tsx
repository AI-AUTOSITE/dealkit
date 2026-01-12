// components/wallet/StatCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  prefix?: string;
}

export function StatCard({ label, value, color, prefix = '$' }: StatCardProps) {
  const { isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark100 : colors.white,
          borderColor: isDark ? colors.neutral800 : colors.neutral200,
        },
      ]}
    >
      <Text variant="caption" color="secondary">
        {label}
      </Text>
      <Text
        variant="headingLg"
        style={{ color: color || (isDark ? colors.neutral100 : colors.neutral900), marginTop: 4 }}
      >
        {prefix}{value.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});