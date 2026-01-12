// app/(modals)/deal/[id].tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, fontSize, shadows } from '../../../lib/theme';
import { useDeals } from '@/lib/hooks';
import { Deal, DealStage } from '@/types';

const STAGES: { key: DealStage; label: string; icon: string }[] = [
  { key: 'pitched', label: 'Pitched', icon: 'paper-plane-outline' },
  { key: 'negotiating', label: 'Negotiating', icon: 'chatbubbles-outline' },
  { key: 'contracted', label: 'Contracted', icon: 'document-text-outline' },
  { key: 'in_progress', label: 'In Progress', icon: 'construct-outline' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-outline' },
  { key: 'invoiced', label: 'Invoiced', icon: 'receipt-outline' },
  { key: 'paid', label: 'Paid', icon: 'checkmark-circle-outline' },
];

export default function DealDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deals, loadDeals, editDeal, moveDealToStage, removeDeal } = useDeals();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  // Load deal
  useEffect(() => {
    const found = deals.find(d => d.id === id);
    if (found) {
      setDeal(found);
    }
    setLoading(false);
  }, [id, deals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDeadline = (dueDate?: string) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dueDate);
    if (isNaN(deadline.getTime())) return null;
    return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCurrentStageIndex = () => {
    if (!deal) return 0;
    return STAGES.findIndex(s => s.key === deal.stage);
  };

  const handleStageChange = async (newStage: DealStage) => {
    if (!deal) return;
    await moveDealToStage(deal.id, newStage);
    setDeal({ ...deal, stage: newStage });
  };

  const handleDelete = () => {
    if (!deal) return;
    
    Alert.alert(
      'Delete Deal',
      'Are you sure you want to delete this deal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeDeal(deal.id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Deal</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Deal not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStageIndex = getCurrentStageIndex();
  const daysLeft = getDaysUntilDeadline(deal.dueDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Deal Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={22} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.brandName, { color: colors.text }]}>
            {deal.brandName}
          </Text>
          <Text style={[styles.title, { color: colors.textSecondary }]}>
            {deal.title}
          </Text>
          <Text style={[styles.value, { color: colors.primary }]}>
            {formatCurrency(deal.value)}
          </Text>
          
          {deal.dueDate && (
            <View style={styles.deadlineRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.deadline, { color: colors.textMuted }]}>
                Due: {formatDate(deal.dueDate)}
                {daysLeft !== null && (
                  <Text style={{ color: daysLeft < 0 ? colors.error : daysLeft <= 7 ? colors.warning : colors.textMuted }}>
                    {' '}({daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`})
                  </Text>
                )}
              </Text>
            </View>
          )}
          
          {deal.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {deal.description}
            </Text>
          )}
        </View>

        {/* Stage Progress */}
        <View style={[styles.stageCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Progress</Text>
          
          <View style={styles.stageContainer}>
            {STAGES.map((stage, index) => {
              const isCompleted = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              
              return (
                <TouchableOpacity
                  key={stage.key}
                  style={styles.stageItem}
                  onPress={() => handleStageChange(stage.key)}
                >
                  <View
                    style={[
                      styles.stageDot,
                      {
                        backgroundColor: isCompleted ? colors.primary : colors.border,
                        borderColor: isCurrent ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isCompleted && (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stageLabel,
                      {
                        color: isCompleted ? colors.primary : colors.textMuted,
                        fontWeight: isCurrent ? '600' : '400',
                      },
                    ]}
                  >
                    {stage.label}
                  </Text>
                  {index < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageLine,
                        {
                          backgroundColor: index < currentStageIndex ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            {deal.stage !== 'paid' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => handleStageChange('paid')}
              >
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.actionText, { color: colors.success }]}>
                  Mark as Paid
                </Text>
              </TouchableOpacity>
            )}
            
            {currentStageIndex < STAGES.length - 1 && deal.stage !== 'paid' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary + '20' }]}
                onPress={() => handleStageChange(STAGES[currentStageIndex + 1].key)}
              >
                <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Move to {STAGES[currentStageIndex + 1].label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.detailsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Created</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(deal.createdAt)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Last Updated</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {formatDate(deal.updatedAt)}
            </Text>
          </View>
          
          {deal.deliverables && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Deliverables</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {deal.deliverables}
              </Text>
            </View>
          )}
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: fontSize.md,
    marginTop: spacing.md,
  },
  infoCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  brandName: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  deadline: {
    fontSize: fontSize.sm,
  },
  description: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  stageCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  stageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stageItem: {
    alignItems: 'center',
    width: '25%',
    marginBottom: spacing.md,
  },
  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 4,
  },
  stageLabel: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  stageLine: {
    position: 'absolute',
    top: 12,
    left: '75%',
    width: '50%',
    height: 2,
  },
  actionsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  actionButtons: {
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  detailsCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    fontSize: fontSize.sm,
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
});
