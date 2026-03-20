import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../lib/theme';
import { getDatabase, generateId, getLocalDateString } from '../../lib/storage/database';
import { formatCurrency } from '../../lib/utils';

interface UsageOption {
  key: string;
  label: string;
  description: string;
  multiplier: number;
}

const USAGE_TYPES: UsageOption[] = [
  { key: 'organic_social', label: '📱 Organic Social', description: 'Brand\'s own social accounts', multiplier: 0 },
  { key: 'paid_social', label: '💰 Paid Social Ads', description: 'Boosted posts, sponsored ads', multiplier: 0.5 },
  { key: 'whitelisting', label: '🎯 Whitelisting', description: 'Ads run from YOUR account', multiplier: 0.75 },
  { key: 'website', label: '🌐 Website/Blog', description: 'Brand\'s website or landing pages', multiplier: 0.25 },
  { key: 'email', label: '📧 Email Marketing', description: 'Newsletters, promotional emails', multiplier: 0.2 },
  { key: 'print', label: '🖨️ Print/OOH', description: 'Billboards, magazines, packaging', multiplier: 1.0 },
  { key: 'broadcast', label: '📺 TV/Streaming', description: 'Television or streaming platforms', multiplier: 1.5 },
];

const DURATION_OPTIONS: UsageOption[] = [
  { key: '3_months', label: '3 Months', description: '', multiplier: 0.5 },
  { key: '6_months', label: '6 Months', description: '', multiplier: 0.75 },
  { key: '12_months', label: '1 Year', description: '', multiplier: 1.0 },
  { key: '24_months', label: '2 Years', description: '', multiplier: 1.5 },
  { key: 'perpetual', label: 'Perpetual', description: 'Forever', multiplier: 3.0 },
];

const TERRITORY_OPTIONS: UsageOption[] = [
  { key: 'single_country', label: '🏠 Single Country', description: 'One market only', multiplier: 0 },
  { key: 'regional', label: '🌍 Regional', description: 'Multiple countries in region', multiplier: 0.25 },
  { key: 'worldwide', label: '🌏 Worldwide', description: 'Global rights', multiplier: 0.5 },
];

const EXCLUSIVITY_OPTIONS: UsageOption[] = [
  { key: 'none', label: 'None', description: 'No exclusivity', multiplier: 0 },
  { key: '30_days', label: '30 Days', description: '', multiplier: 0.15 },
  { key: '90_days', label: '90 Days', description: '', multiplier: 0.35 },
  { key: '6_months', label: '6 Months', description: '', multiplier: 0.6 },
  { key: '12_months', label: '1 Year', description: '', multiplier: 1.0 },
];

interface CalculationResult {
  baseRate: number;
  usageFee: number;
  totalRate: number;
  breakdown: {
    usageTypes: { label: string; amount: number }[];
    duration: { label: string; amount: number };
    territory: { label: string; amount: number };
    exclusivity: { label: string; amount: number };
  };
}

export default function UsageCalculatorScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [baseRate, setBaseRate] = useState(500);
  const [selectedUsageTypes, setSelectedUsageTypes] = useState<Set<string>>(new Set(['organic_social']));
  const [duration, setDuration] = useState('12_months');
  const [territory, setTerritory] = useState('single_country');
  const [exclusivity, setExclusivity] = useState('none');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const toggleUsageType = (key: string) => {
    setSelectedUsageTypes(prev => {
      const next = new Set(prev);
      if (key === 'organic_social') {
        // Organic social is always included
        return next;
      }
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setResult(null);
  };

  const calculateUsage = async () => {
    setCalculating(true);

    try {
      // Calculate usage type fees
      let usageTypeFee = 0;
      const usageTypeBreakdown: { label: string; amount: number }[] = [];
      
      for (const typeKey of selectedUsageTypes) {
        const type = USAGE_TYPES.find(t => t.key === typeKey);
        if (type && type.multiplier > 0) {
          const amount = baseRate * type.multiplier;
          usageTypeFee += amount;
          usageTypeBreakdown.push({ label: type.label, amount });
        }
      }

      // Duration multiplier
      const durationOption = DURATION_OPTIONS.find(d => d.key === duration)!;
      const durationFee = baseRate * durationOption.multiplier;

      // Territory fee
      const territoryOption = TERRITORY_OPTIONS.find(t => t.key === territory)!;
      const territoryFee = baseRate * territoryOption.multiplier;

      // Exclusivity fee
      const exclusivityOption = EXCLUSIVITY_OPTIONS.find(e => e.key === exclusivity)!;
      const exclusivityFee = baseRate * exclusivityOption.multiplier;

      // Total
      const usageFee = usageTypeFee + durationFee + territoryFee + exclusivityFee;
      const totalRate = baseRate + usageFee;

      setResult({
        baseRate,
        usageFee,
        totalRate: Math.round(totalRate),
        breakdown: {
          usageTypes: usageTypeBreakdown,
          duration: { label: durationOption.label, amount: durationFee },
          territory: { label: territoryOption.label, amount: territoryFee },
          exclusivity: { label: exclusivityOption.label, amount: exclusivityFee },
        },
      });

      // Save calculation history
      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO usage_calculations (id, base_rate, usage_types, duration, territory, exclusivity, total_fee, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          baseRate,
          Array.from(selectedUsageTypes).join(','),
          duration,
          territory,
          exclusivity,
          totalRate,
          getLocalDateString(),
        ]
      );
    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const adjustBaseRate = (amount: number) => {
    setBaseRate(prev => Math.max(100, prev + amount));
    setResult(null);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Usage Rights Calculator
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          📊 Calculate Usage Fees
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find out what to charge for extended usage rights.
        </Text>

        {/* Base Rate */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Base Rate (Content Creation)
          </Text>
          <View style={[styles.rateAdjuster, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.adjustButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => adjustBaseRate(-100)}
            >
              <Ionicons name="remove" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.rateInputContainer}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.rateInput, { color: colors.text }]}
                value={baseRate.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num) && num >= 0) {
                    setBaseRate(num);
                  } else if (text === '') {
                    setBaseRate(0);
                  }
                }}
                keyboardType="numeric"
                selectTextOnFocus
              />
            </View>
            <TouchableOpacity
              style={[styles.adjustButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => adjustBaseRate(100)}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Usage Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Where will content be used?
          </Text>
          {USAGE_TYPES.map(type => (
            <TouchableOpacity
              key={type.key}
              style={[styles.optionCard, { backgroundColor: colors.card }]}
              onPress={() => toggleUsageType(type.key)}
              activeOpacity={0.7}
              disabled={type.key === 'organic_social'}
            >
              <View style={styles.optionLeft}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {type.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {type.description}
                </Text>
              </View>
              <Switch
                value={selectedUsageTypes.has(type.key)}
                onValueChange={() => toggleUsageType(type.key)}
                disabled={type.key === 'organic_social'}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            For how long?
          </Text>
          <View style={styles.chipGrid}>
            {DURATION_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card },
                  duration === opt.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => { setDuration(opt.key); setResult(null); }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: duration === opt.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Territory */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Where will it be used?
          </Text>
          <View style={styles.chipGrid}>
            {TERRITORY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card },
                  territory === opt.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => { setTerritory(opt.key); setResult(null); }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: territory === opt.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exclusivity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Exclusivity period?
          </Text>
          <View style={styles.chipGrid}>
            {EXCLUSIVITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  { backgroundColor: colors.card },
                  exclusivity === opt.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => { setExclusivity(opt.key); setResult(null); }}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: exclusivity === opt.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calculateButton, { backgroundColor: colors.primary }]}
          onPress={calculateUsage}
          disabled={calculating}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator" size={20} color="#FFFFFF" />
          <Text style={styles.calculateButtonText}>
            {calculating ? 'Calculating...' : 'Calculate Total'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.resultCard, { backgroundColor: colors.successLight }]}
          >
            <Text style={[styles.resultLabel, { color: colors.success }]}>
              Recommended Total Rate
            </Text>
            <Text style={[styles.resultValue, { color: colors.success }]}>
              {formatCurrency(result.totalRate)}
            </Text>

            <View style={[styles.breakdown, { borderTopColor: colors.success + '30' }]}>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                  Base Rate (Content Creation)
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(result.baseRate)}
                </Text>
              </View>

              {result.breakdown.usageTypes.map((item, i) => (
                <View key={i} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.success }]}>
                    +{formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}

              {result.breakdown.duration.amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Duration ({result.breakdown.duration.label})
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.success }]}>
                    +{formatCurrency(result.breakdown.duration.amount)}
                  </Text>
                </View>
              )}

              {result.breakdown.territory.amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Territory ({result.breakdown.territory.label})
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.success }]}>
                    +{formatCurrency(result.breakdown.territory.amount)}
                  </Text>
                </View>
              )}

              {result.breakdown.exclusivity.amount > 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Exclusivity ({result.breakdown.exclusivity.label})
                  </Text>
                  <Text style={[styles.breakdownValue, { color: colors.success }]}>
                    +{formatCurrency(result.breakdown.exclusivity.amount)}
                  </Text>
                </View>
              )}

              <View style={[styles.breakdownTotal, { borderTopColor: colors.success + '30' }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  Usage Fee
                </Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>
                  +{formatCurrency(result.usageFee)}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.floatingClose, { backgroundColor: colors.card }, shadows.lg]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '600' },
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },
  title: { fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.md, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  rateAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rateValue: { fontSize: fontSize.xxl, fontWeight: '700' },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginRight: 4,
  },
  rateInput: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  optionLeft: { flex: 1 },
  optionLabel: { fontSize: fontSize.md, fontWeight: '500' },
  optionDesc: { fontSize: fontSize.sm, marginTop: 2 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  chipText: { fontSize: fontSize.sm, fontWeight: '500' },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  calculateButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
  resultCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  resultLabel: { fontSize: fontSize.sm, fontWeight: '500' },
  resultValue: { fontSize: fontSize.xxxl, fontWeight: '700', marginTop: spacing.xs },
  breakdown: {
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  breakdownLabel: { fontSize: fontSize.sm },
  breakdownValue: { fontSize: fontSize.sm, fontWeight: '600' },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: fontSize.md, fontWeight: '600' },
  totalValue: { fontSize: fontSize.md, fontWeight: '700' },
  floatingClose: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
