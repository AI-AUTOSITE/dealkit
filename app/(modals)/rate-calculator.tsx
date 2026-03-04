import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../lib/theme';
import { Platform as PlatformType, ContentType, Niche } from '../../types';
import { formatCurrency, formatNumber } from '../../lib/utils';

const PLATFORMS: { key: PlatformType; label: string; icon: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'tiktok', label: 'TikTok', icon: 'musical-notes' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { key: 'twitter', label: 'Twitter', icon: 'logo-twitter' },
];

const CONTENT_TYPES: Record<PlatformType, { key: ContentType; label: string; baseMultiplier: number }[]> = {
  instagram: [
    { key: 'reel', label: 'Reel', baseMultiplier: 1.0 },
    { key: 'static_post', label: 'Static Post', baseMultiplier: 0.6 },
    { key: 'carousel', label: 'Carousel', baseMultiplier: 0.8 },
    { key: 'story_set', label: 'Story ×3', baseMultiplier: 0.4 },
  ],
  tiktok: [
    { key: 'tiktok_60s', label: 'Video (60s)', baseMultiplier: 0.8 },
    { key: 'tiktok_3min', label: 'Video (1-3min)', baseMultiplier: 1.2 },
  ],
  youtube: [
    { key: 'youtube_shorts', label: 'Shorts', baseMultiplier: 0.5 },
    { key: 'youtube_dedicated', label: 'Dedicated (5-10min)', baseMultiplier: 3.0 },
    { key: 'youtube_integration', label: 'Integration (60s)', baseMultiplier: 1.5 },
  ],
  twitter: [
    { key: 'thread', label: 'Thread', baseMultiplier: 0.5 },
    { key: 'single_post', label: 'Single Post', baseMultiplier: 0.3 },
  ],
};

const NICHES: { key: Niche; label: string; multiplier: number }[] = [
  { key: 'finance', label: '💰 Finance', multiplier: 1.8 },
  { key: 'crypto', label: '🪙 Crypto', multiplier: 1.7 },
  { key: 'tech', label: '💻 Tech', multiplier: 1.5 },
  { key: 'legal', label: '⚖️ Legal', multiplier: 1.6 },
  { key: 'healthcare', label: '🏥 Healthcare', multiplier: 1.5 },
  { key: 'real_estate', label: '🏠 Real Estate', multiplier: 1.4 },
  { key: 'fashion', label: '👗 Fashion', multiplier: 1.1 },
  { key: 'beauty', label: '💄 Beauty', multiplier: 1.2 },
  { key: 'fitness', label: '💪 Fitness', multiplier: 1.0 },
  { key: 'food', label: '🍔 Food', multiplier: 0.9 },
  { key: 'travel', label: '✈️ Travel', multiplier: 1.1 },
  { key: 'gaming', label: '🎮 Gaming', multiplier: 1.0 },
  { key: 'lifestyle', label: '🌟 Lifestyle', multiplier: 1.0 },
  { key: 'parenting', label: '👶 Parenting', multiplier: 1.1 },
  { key: 'pets', label: '🐕 Pets', multiplier: 0.9 },
  { key: 'education', label: '📚 Education', multiplier: 1.2 },
];

interface CalculationResult {
  min: number;
  max: number;
  breakdown: {
    baseRate: number;
    nicheAdjustment: number;
    engagementAdjustment: number;
    contentTypeAdjustment: number;
  };
}

export default function RateCalculatorScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [platform, setPlatform] = useState<PlatformType>('instagram');
  const [contentType, setContentType] = useState<ContentType>('reel');
  const [followers, setFollowers] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [niche, setNiche] = useState<Niche>('lifestyle');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateRate = async () => {
    const followersNum = parseInt(followers.replace(/,/g, ''));
    if (!followersNum || followersNum <= 0) {
      Alert.alert('Required', 'Please enter your follower count.');
      return;
    }

    setCalculating(true);

    try {
      // Base rate calculation: $10-25 per 1K followers (varies by platform)
      const platformRates: Record<PlatformType, number> = {
        instagram: 15,
        tiktok: 12,
        youtube: 20,
        twitter: 8,
      };

      const baseRatePer1K = platformRates[platform];
      const baseRate = (followersNum / 1000) * baseRatePer1K;

      // Content type multiplier
      const contentTypeInfo = CONTENT_TYPES[platform].find(c => c.key === contentType);
      const contentMultiplier = contentTypeInfo?.baseMultiplier || 1.0;

      // Niche multiplier
      const nicheInfo = NICHES.find(n => n.key === niche);
      const nicheMultiplier = nicheInfo?.multiplier || 1.0;

      // Engagement adjustment (if provided)
      let engagementMultiplier = 1.0;
      const engRate = parseFloat(engagementRate);
      if (engRate > 0) {
        if (engRate >= 6) engagementMultiplier = 1.3;
        else if (engRate >= 4) engagementMultiplier = 1.15;
        else if (engRate >= 2) engagementMultiplier = 1.0;
        else engagementMultiplier = 0.85;
      }

      // Calculate final rate
      const calculatedRate = baseRate * contentMultiplier * nicheMultiplier * engagementMultiplier;
      
      // Min/Max range (±20%)
      const minRate = Math.round(calculatedRate * 0.8);
      const maxRate = Math.round(calculatedRate * 1.2);

      const breakdown = {
        baseRate: Math.round(baseRate),
        nicheAdjustment: Math.round(baseRate * (nicheMultiplier - 1)),
        engagementAdjustment: Math.round(baseRate * nicheMultiplier * (engagementMultiplier - 1)),
        contentTypeAdjustment: Math.round(baseRate * (contentMultiplier - 1)),
      };

      setResult({ min: minRate, max: maxRate, breakdown });

    } catch (error) {
      console.error('Calculation error:', error);
      Alert.alert('Error', 'Failed to calculate rate. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleCopyRate = () => {
    if (result) {
      const text = `My rate: ${formatCurrency(result.min)} - ${formatCurrency(result.max)}`;
      Alert.alert('Copied!', text);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Rate Calculator
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>
          💰 Calculate Your Rate
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Find the right price for your content.
        </Text>

        {/* Platform Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Platform</Text>
          <View style={styles.platformGrid}>
            {PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.platformCard,
                  { backgroundColor: colors.card },
                  platform === p.key && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                onPress={() => {
                  setPlatform(p.key);
                  setContentType(CONTENT_TYPES[p.key][0].key);
                  setResult(null);
                }}
              >
                <Ionicons
                  name={p.icon as any}
                  size={24}
                  color={platform === p.key ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.platformLabel,
                    { color: platform === p.key ? colors.primary : colors.text },
                  ]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Type */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Content Type</Text>
          <View style={styles.contentTypeGrid}>
            {CONTENT_TYPES[platform].map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[
                  styles.contentTypeChip,
                  { backgroundColor: colors.card },
                  contentType === c.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setContentType(c.key);
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.contentTypeText,
                    { color: contentType === c.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Followers */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Followers <Text style={{ color: colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g., 45000"
            placeholderTextColor={colors.textMuted}
            value={followers}
            onChangeText={(text) => {
              setFollowers(text);
              setResult(null);
            }}
            keyboardType="numeric"
          />
        </View>

        {/* Engagement Rate (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>
            Engagement Rate (%) <Text style={{ color: colors.textMuted }}>Optional</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="e.g., 4.2"
            placeholderTextColor={colors.textMuted}
            value={engagementRate}
            onChangeText={(text) => {
              setEngagementRate(text);
              setResult(null);
            }}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Niche */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Niche</Text>
          <View style={styles.nicheGrid}>
            {NICHES.map((n) => (
              <TouchableOpacity
                key={n.key}
                style={[
                  styles.nicheChip,
                  { backgroundColor: colors.card },
                  niche === n.key && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setNiche(n.key);
                  setResult(null);
                }}
              >
                <Text
                  style={[
                    styles.nicheText,
                    { color: niche === n.key ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {n.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[styles.calculateButton, { backgroundColor: colors.primary }]}
          onPress={calculateRate}
          disabled={calculating}
          activeOpacity={0.8}
        >
          <Ionicons name="calculator" size={20} color="#FFFFFF" />
          <Text style={styles.calculateButtonText}>
            {calculating ? 'Calculating...' : 'Calculate Rate'}
          </Text>
        </TouchableOpacity>

        {/* Result */}
        {result && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[styles.resultCard, { backgroundColor: colors.successLight }]}
          >
            <Text style={[styles.resultLabel, { color: colors.success }]}>
              Your Recommended Rate
            </Text>
            <Text style={[styles.resultValue, { color: colors.success }]}>
              {formatCurrency(result.min)} - {formatCurrency(result.max)}
            </Text>

            {/* Breakdown */}
            <View style={[styles.breakdown, { borderTopColor: colors.success + '30' }]}>
              <Text style={[styles.breakdownTitle, { color: colors.success }]}>
                Breakdown:
              </Text>
              <View style={styles.breakdownRow}>
                <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                  Base Rate ({formatNumber(parseInt(followers.replace(/,/g, '')))} followers)
                </Text>
                <Text style={[styles.breakdownValue, { color: colors.text }]}>
                  {formatCurrency(result.breakdown.baseRate)}
                </Text>
              </View>
              {result.breakdown.contentTypeAdjustment !== 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Content Type Adjustment
                  </Text>
                  <Text style={[styles.breakdownValue, { color: result.breakdown.contentTypeAdjustment > 0 ? colors.success : colors.error }]}>
                    {result.breakdown.contentTypeAdjustment > 0 ? '+' : ''}{formatCurrency(result.breakdown.contentTypeAdjustment)}
                  </Text>
                </View>
              )}
              {result.breakdown.nicheAdjustment !== 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Niche Adjustment
                  </Text>
                  <Text style={[styles.breakdownValue, { color: result.breakdown.nicheAdjustment > 0 ? colors.success : colors.error }]}>
                    {result.breakdown.nicheAdjustment > 0 ? '+' : ''}{formatCurrency(result.breakdown.nicheAdjustment)}
                  </Text>
                </View>
              )}
              {result.breakdown.engagementAdjustment !== 0 && (
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    Engagement Bonus
                  </Text>
                  <Text style={[styles.breakdownValue, { color: result.breakdown.engagementAdjustment > 0 ? colors.success : colors.error }]}>
                    {result.breakdown.engagementAdjustment > 0 ? '+' : ''}{formatCurrency(result.breakdown.engagementAdjustment)}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.copyButton, { borderColor: colors.success }]}
              onPress={handleCopyRate}
            >
              <Ionicons name="copy-outline" size={16} color={colors.success} />
              <Text style={[styles.copyButtonText, { color: colors.success }]}>
                Copy Rate
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Close Button */}
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
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  platformGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  platformCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  platformLabel: { fontSize: fontSize.xs, fontWeight: '500' },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  contentTypeChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  contentTypeText: { fontSize: fontSize.sm, fontWeight: '500' },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  nicheChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  nicheText: { fontSize: fontSize.sm },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
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
  breakdownTitle: { fontSize: fontSize.sm, fontWeight: '600', marginBottom: spacing.sm },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  breakdownLabel: { fontSize: fontSize.sm },
  breakdownValue: { fontSize: fontSize.sm, fontWeight: '600' },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  copyButtonText: { fontSize: fontSize.sm, fontWeight: '500' },
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
