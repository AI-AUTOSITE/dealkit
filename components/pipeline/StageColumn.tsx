// components/pipeline/StageColumn.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text } from '@/components/ui';
import { DealCard } from './DealCard';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Deal } from '@/types';
import { PipelineStage } from '@/constants/stages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = SCREEN_WIDTH - 32; // Full width minus padding

interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  onDealPress: (deal: Deal) => void;
}

export function StageColumn({ stage, deals, onDealPress }: StageColumnProps) {
  const { isDark } = useTheme();

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  };

  return (
    <View style={[styles.column, { width: COLUMN_WIDTH }]}>
      {/* Column Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.dark100 : colors.neutral50,
            borderColor: isDark ? colors.neutral800 : colors.neutral200,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.stageDot, { backgroundColor: stage.color }]} />
          <Text variant="headingSm">{stage.name}</Text>
          <View
            style={[
              styles.countBadge,
              { backgroundColor: isDark ? colors.neutral800 : colors.neutral200 },
            ]}
          >
            <Text variant="label" color="secondary">
              {deals.length}
            </Text>
          </View>
        </View>
        <Text variant="bodyMd" color="secondary">
          {formatCurrency(totalValue)}
        </Text>
      </View>

      {/* Cards */}
      <ScrollView
        style={styles.cardList}
        contentContainerStyle={styles.cardListContent}
        showsVerticalScrollIndicator={false}
      >
        {deals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyMd" color="tertiary">
              No deals
            </Text>
          </View>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onPress={() => onDealPress(deal)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardList: {
    flex: 1,
  },
  cardListContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
});