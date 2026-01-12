// components/ui/StatusBadge.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { DealStage } from '@/types';
import { PIPELINE_STAGES } from '@/constants/stages';

interface StatusBadgeProps {
  stage: DealStage;
  size?: 'sm' | 'md';
}

export function StatusBadge({ stage, size = 'md' }: StatusBadgeProps) {
  const { isDark } = useTheme();
  const stageInfo = PIPELINE_STAGES.find(s => s.id === stage);
  
  if (!stageInfo) return null;

  const backgroundColor = `${stageInfo.color}${isDark ? '30' : '20'}`;
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 2 : 4,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: stageInfo.color,
            width: size === 'sm' ? 6 : 8,
            height: size === 'sm' ? 6 : 8,
          },
        ]}
      />
      <Text
        variant={size === 'sm' ? 'label' : 'caption'}
        style={{ color: stageInfo.color, marginLeft: 6 }}
      >
        {stageInfo.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
  },
  dot: {
    borderRadius: 9999,
  },
});