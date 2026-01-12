// components/pipeline/DealCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, StatusBadge } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Deal } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface DealCardProps {
  deal: Deal;
  onPress: () => void;
}

export function DealCard({ deal, onPress }: DealCardProps) {
  const { isDark } = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysInStage = () => {
    const updated = new Date(deal.updatedAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysInStage = getDaysInStage();
  const isStale = daysInStage > 7;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      delayPressIn={75}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.dark100 : colors.white,
          borderColor: isDark ? colors.neutral800 : colors.neutral200,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandInfo}>
          <View
            style={[
              styles.brandAvatar,
              { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
            ]}
          >
            <Text variant="label">{deal.brandName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text variant="headingSm" numberOfLines={1} style={styles.brandName}>
            {deal.brandName}
          </Text>
        </View>
        <Text variant="headingMd">{formatCurrency(deal.value)}</Text>
      </View>

      {/* Title */}
      <Text variant="bodyMd" color="secondary" numberOfLines={1}>
        {deal.title}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.metaRow}>
          <Ionicons
            name="time-outline"
            size={14}
            color={isStale ? colors.warning500 : (isDark ? colors.neutral500 : colors.neutral400)}
          />
          <Text
            variant="caption"
            color={isStale ? undefined : 'tertiary'}
            style={isStale ? { color: colors.warning500 } : undefined}
          >
            {daysInStage}d in stage
          </Text>
        </View>

        {deal.dueDate && (
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={isDark ? colors.neutral500 : colors.neutral400}
            />
            <Text variant="caption" color="tertiary">
              {new Date(deal.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  brandAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandName: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});