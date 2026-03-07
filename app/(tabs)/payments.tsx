// app/(tabs)/payments.tsx
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, fontSize, shadows } from '../../lib/theme';
import { useInvoices } from '@/lib/hooks';
import { Invoice, InvoiceStatus } from '@/types';
import { onDealPaid } from '@/lib/review';
import { AnimatedListItem, useFabBounce } from '@/lib/animations';

type FilterStatus = 'all' | 'pending' | 'due_soon' | 'paid' | 'overdue';

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'due_soon', label: 'Due Soon' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
];

// Helper to get local date string
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { invoices, loading, loadInvoices, editInvoice } = useInvoices();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Animations
  const { scale: fabScale } = useFabBounce();

  // Reload when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  // Calculate stats
  const today = getLocalDateString();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysStr = getLocalDateString(threeDaysFromNow);

  // Filter and calculate
  const pendingInvoices = invoices.filter(inv => 
    (inv.status === 'sent' || inv.status === 'draft') && 
    (!inv.dueDate || inv.dueDate >= threeDaysStr)
  );
  const dueSoonInvoices = invoices.filter(inv => 
    (inv.status === 'sent' || inv.status === 'draft') && 
    inv.dueDate && inv.dueDate >= today && inv.dueDate < threeDaysStr
  );
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'overdue' || 
    ((inv.status === 'sent' || inv.status === 'draft') && inv.dueDate && inv.dueDate < today)
  );
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');

  const stats = {
    pending: pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    dueSoon: dueSoonInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    overdue: overdueInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    paid: paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0),
    pendingCount: pendingInvoices.length,
    dueSoonCount: dueSoonInvoices.length,
    overdueCount: overdueInvoices.length,
    paidCount: paidInvoices.length,
  };

  // Map Invoice status to filter status
  const getFilterStatus = (invoice: Invoice): FilterStatus => {
    if (invoice.status === 'paid') return 'paid';
    if (invoice.status === 'overdue') return 'overdue';
    if (invoice.dueDate && invoice.dueDate < today) return 'overdue';
    if (invoice.dueDate && invoice.dueDate >= today && invoice.dueDate < threeDaysStr) return 'due_soon';
    return 'pending';
  };

  // Filter invoices
  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => getFilterStatus(inv) === filter);

  // Sort by due date
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvoices();
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

  const getStatusIcon = (invoice: Invoice) => {
    const status = getFilterStatus(invoice);
    switch (status) {
      case 'pending': return 'time-outline';
      case 'paid': return 'checkmark-circle';
      case 'overdue': return 'alert-circle';
      default: return 'help-circle-outline';
    }
  };

  const getStatusColor = (invoice: Invoice) => {
    const status = getFilterStatus(invoice);
    switch (status) {
      case 'pending': return colors.textMuted;
      case 'paid': return colors.success;
      case 'overdue': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getDaysInfo = (invoice: Invoice) => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    if (!invoice.dueDate) {
      return { text: 'No due date', color: colors.textSecondary };
    }

    const dueDate = new Date(invoice.dueDate);
    const diff = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (invoice.status === 'paid') {
      if (invoice.paidDate) {
        const paidDate = new Date(invoice.paidDate);
        const lateDays = Math.ceil((paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (lateDays > 0) {
          return { text: `Paid (${lateDays} days late)`, color: colors.textSecondary };
        }
      }
      return { text: 'Paid on time ✨', color: colors.success };
    }

    if (diff < 0) {
      const overdueDays = Math.abs(diff);
      return { text: `${overdueDays} days late`, color: colors.error };
    }

    if (diff === 0) {
      return { text: 'Due today!', color: colors.error };
    }
    if (diff <= 3) {
      return { text: `${diff} days left`, color: colors.warning };
    }
    return { text: `${diff} days left`, color: colors.textSecondary };
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return 'No due date';
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleMarkPaid = async (invoice: Invoice) => {
    try {
      await editInvoice(invoice.id, {
        status: 'paid',
        paidDate: getLocalDateString(),
        paidAmount: invoice.amount,
      });
      // Trigger review prompt check (non-blocking)
      onDealPaid();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
    }
  };

  const renderPaymentCard = ({ item, index }: { item: Invoice; index: number }) => {
    const daysInfo = getDaysInfo(item);
    const filterStatus = getFilterStatus(item);
    const isNeedsAttention = filterStatus === 'overdue' || daysInfo.color === colors.warning;

    return (
      <AnimatedListItem index={index} screenKey="payments">
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/(modals)/payment/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Ionicons
              name={getStatusIcon(item) as any}
              size={24}
              color={getStatusColor(item)}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.brandName, { color: colors.text }]}>
              {item.brandName}
            </Text>
            <Text style={[styles.campaignName, { color: colors.textSecondary }]}>
              {item.description || 'Payment'}
            </Text>
            <Text style={[styles.dueDate, { color: colors.textMuted }]}>
              Due: {formatDueDate(item.dueDate)}
            </Text>
          </View>
          <View style={styles.cardRight}>
            <Text style={[styles.amount, { color: colors.text }]}>
              {formatCurrency(item.amount || 0)}
            </Text>
            <Text style={[styles.daysInfo, { color: daysInfo.color }]}>
              {daysInfo.text}
            </Text>
          </View>
        </View>
        
        {/* Quick Actions for pending/overdue */}
        {filterStatus !== 'paid' && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
              onPress={() => handleMarkPaid(item)}
            >
              <Ionicons name="checkmark" size={16} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.success }]}>
                Mark Paid
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Stats Card - Compact 1-row */}
      <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {formatCurrency(stats.pending)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Pending</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {formatCurrency(stats.dueSoon)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Soon</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {formatCurrency(stats.overdue)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Overdue</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(stats.paid)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Paid</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
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
      </ScrollView>

      {/* Payments List */}
      <FlatList
        data={sortedInvoices}
        renderItem={renderPaymentCard}
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
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="wallet" size={32} color={colors.success} />
            </View>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {filter === 'all' ? 'Track Your Income' : `No ${filter} payments`}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
              {filter === 'all'
                ? 'Never miss a payment again.\nAdd invoices and track when brands pay you.'
                : 'Payments will appear here when their status matches this filter.'}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(modals)/add-invoice')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.emptyButtonText}>Add Payment</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* FAB */}
      <Animated.View style={[styles.fab, { backgroundColor: colors.primary, transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={() => router.push('/(modals)/add-invoice')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
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
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
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
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  filterScroll: {
    flexGrow: 0,
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingRight: spacing.xl,
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
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLeft: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  cardContent: {
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
  dueDate: {
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  daysInfo: {
    fontSize: fontSize.sm,
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: 6,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: fontSize.md,
    fontWeight: '600',
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
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
