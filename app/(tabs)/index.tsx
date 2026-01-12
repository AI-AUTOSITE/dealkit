// app/(tabs)/index.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, fontSize, shadows } from '../../lib/theme';
import { useDeals } from '@/lib/hooks';
import { Deal, DealStage } from '@/types';

type FilterStatus = 'all' | 'active' | 'completed' | 'pending';

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
];

// Map stages to status categories
const getStatusFromStage = (stage: DealStage): 'active' | 'completed' | 'pending' => {
  switch (stage) {
    case 'paid':
      return 'completed';
    case 'pitched':
    case 'negotiating':
      return 'pending';
    default:
      return 'active';
  }
};

// Stage progression for progress dots
const PROGRESS_STAGES: DealStage[] = ['pitched', 'negotiating', 'contracted', 'in_progress', 'delivered'];

export default function DealsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { deals, loading, loadDeals, totalValue } = useDeals();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Reload when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadDeals();
    }, [loadDeals])
  );

  // Calculate stats
  const activeDeals = deals.filter(d => getStatusFromStage(d.stage) === 'active').length;
  const completedDeals = deals.filter(d => d.stage === 'paid').length;
  const earnedValue = deals
    .filter(d => d.stage === 'paid')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  // Filter deals
  const filteredDeals = filter === 'all' 
    ? deals 
    : deals.filter(d => getStatusFromStage(d.stage) === filter);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDeals();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (stage: DealStage) => {
    const status = getStatusFromStage(stage);
    switch (status) {
      case 'active': return colors.success;
      case 'completed': return colors.primary;
      case 'pending': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getDaysUntilDeadline = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(dueDate);
    if (isNaN(deadlineDate.getTime())) return null;
    const diff = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDeadline = (dueDate?: string) => {
    if (!dueDate) return 'No deadline';
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) return 'No deadline';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getProgressIndex = (stage: DealStage) => {
    return PROGRESS_STAGES.indexOf(stage);
  };

  const renderDealCard = ({ item }: { item: Deal }) => {
    const daysLeft = getDaysUntilDeadline(item.dueDate);
    const progressIndex = getProgressIndex(item.stage);
    
    return (
      <TouchableOpacity
        style={[styles.dealCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/(modals)/deal/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.dealHeader}>
          <View style={styles.dealInfo}>
            <Text style={[styles.brandName, { color: colors.text }]}>
              {item.brandName}
            </Text>
            <Text style={[styles.campaignName, { color: colors.textSecondary }]}>
              {item.title}
            </Text>
            <View style={styles.dealMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  Due: {formatDeadline(item.dueDate)}
                  {daysLeft !== null && ` (${daysLeft} days)`}
                </Text>
              </View>
              {item.description && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {item.description.split('•')[0]?.trim() || item.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.dealRight}>
            <Text style={[styles.rate, { color: colors.text }]}>
              {formatCurrency(item.value || 0)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </View>
        
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {PROGRESS_STAGES.map((stage, index) => (
            <View
              key={stage}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= progressIndex 
                    ? colors.primary 
                    : colors.border,
                },
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Quick Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{activeDeals}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Active</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>{completedDeals}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completed</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(earnedValue)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Earned</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {STATUS_FILTERS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.filterTab,
              filter === item.key && { backgroundColor: colors.primary },
            ]}
            onPress={() => setFilter(item.key)}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === item.key ? '#FFFFFF' : colors.textMuted },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Deals List */}
      <FlatList
        data={filteredDeals}
        renderItem={renderDealCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {filter === 'all' ? 'No deals yet' : `No ${filter} deals`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              Tap + to add your first deal
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(modals)/add-deal')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  statsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  filterText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  dealCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dealInfo: {
    flex: 1,
  },
  brandName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  campaignName: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  dealMeta: {
    marginTop: spacing.sm,
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
  },
  dealRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  rate: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
