import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../lib/theme';
import { getDatabase } from '../../lib/database';
import { 
  getProducts, 
  purchaseProduct, 
  restorePurchases,
  simulatePurchase,
  PRODUCT_IDS,
  Product,
} from '../../lib/purchases';

const FEATURES = [
  {
    icon: 'infinite',
    title: 'Unlimited Pro Tools',
    description: 'No monthly limits on Contract Review, Rate Calculator, Email Builder, and Usage Calculator',
  },
  {
    icon: 'document-text',
    title: 'Contract Review',
    description: 'Analyze unlimited contracts with all 15+ red flag detections',
  },
  {
    icon: 'calculator',
    title: 'Rate Calculator',
    description: 'Calculate rates with premium niche multipliers',
  },
  {
    icon: 'mail',
    title: 'Email Builder',
    description: 'Access all 14 professional email templates',
  },
  {
    icon: 'cloud-upload',
    title: 'Data Export',
    description: 'Backup and export all your deals and payments',
  },
  {
    icon: 'star',
    title: 'Priority Support',
    description: 'Get help faster when you need it',
  },
];

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    type: string | null;
    expiryDate: string | null;
  }>({ type: null, expiryDate: null });

  const loadData = useCallback(async () => {
    try {
      // Check current premium status
      const db = getDatabase();
      const status = await db.getFirstAsync<{
        is_premium: number;
        subscription_type: string | null;
        expiry_date: string | null;
      }>('SELECT is_premium, subscription_type, expiry_date FROM premium_status WHERE id = 1');
      
      setIsPremium(status?.is_premium === 1);
      setSubscriptionInfo({
        type: status?.subscription_type || null,
        expiryDate: status?.expiry_date || null,
      });

      // Load products
      const loadedProducts = await getProducts();
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePurchase = async (productId: string) => {
    setPurchasing(productId);
    
    try {
      // In development, use simulated purchase
      if (__DEV__) {
        const result = await simulatePurchase(productId);
        if (result.success) {
          Alert.alert('Success! 🎉', result.message, [
            { text: 'OK', onPress: () => {
              loadData();
              router.back();
            }}
          ]);
        } else {
          Alert.alert('Error', result.message);
        }
      } else {
        // Production purchase
        const result = await purchaseProduct(productId);
        if (result.success) {
          // Purchase initiated - listener will handle the rest
          // Show success after a delay to allow processing
          setTimeout(() => {
            loadData();
          }, 2000);
        } else {
          Alert.alert('Purchase Failed', result.message);
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    
    try {
      if (__DEV__) {
        Alert.alert('Development Mode', 'Restore is simulated in development.');
        setRestoring(false);
        return;
      }
      
      const result = await restorePurchases();
      
      if (result.success) {
        Alert.alert('Success! 🎉', result.message, [
          { text: 'OK', onPress: () => {
            loadData();
            router.back();
          }}
        ]);
      } else {
        Alert.alert('Restore Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p.productId === productId);
    return product?.price || '...';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If already premium, show status
  if (isPremium) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Premium Status
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeIn}
            style={[styles.statusCard, { backgroundColor: colors.success }]}
          >
            <Text style={styles.statusEmoji}>✨</Text>
            <Text style={styles.statusTitle}>You're Premium!</Text>
            <Text style={styles.statusSubtitle}>
              All features are unlocked
            </Text>
          </Animated.View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                Plan
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {subscriptionInfo.type === 'lifetime' ? 'Lifetime' :
                 subscriptionInfo.type === 'yearly' ? 'Yearly' : 'Monthly'}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {subscriptionInfo.type === 'lifetime' ? 'Expires' : 'Renews'}
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {subscriptionInfo.type === 'lifetime' ? 'Never' : 
                 formatExpiryDate(subscriptionInfo.expiryDate)}
              </Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Your Premium Features
          </Text>

          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(index * 50)}
              style={[styles.featureRow, { backgroundColor: colors.card }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name={feature.icon as any} size={20} color={colors.success} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                  {feature.description}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </Animated.View>
          ))}

          <Text style={[styles.thankYou, { color: colors.textMuted }]}>
            Thank you for supporting DealKit! 💜
          </Text>
        </ScrollView>

        <TouchableOpacity
          style={[styles.floatingClose, { backgroundColor: colors.card }, shadows.lg]}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  // Not premium - show upgrade options
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Upgrade to Premium
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View 
          entering={FadeIn}
          style={[styles.hero, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.heroEmoji}>👑</Text>
          <Text style={styles.heroTitle}>DealKit Premium</Text>
          <Text style={styles.heroSubtitle}>
            Unlock your full earning potential
          </Text>
        </Animated.View>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          ✨ What You Get
        </Text>

        {FEATURES.map((feature, index) => (
          <Animated.View
            key={feature.title}
            entering={FadeInDown.delay(index * 50)}
            style={[styles.featureRow, { backgroundColor: colors.card }]}
          >
            <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name={feature.icon as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Pricing Options */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.lg }]}>
          💰 Choose Your Plan
        </Text>

        {/* Monthly - Coming Soon */}
        <TouchableOpacity
          style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }]}
          onPress={() => Alert.alert('Coming Soon! 🚀', 'Monthly subscription will be available when the app launches on the App Store.')}
          activeOpacity={0.7}
        >
          <View style={[styles.comingSoonBadge, { backgroundColor: colors.neutral500 }]}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
          <View style={styles.pricingLeft}>
            <Text style={[styles.pricingName, { color: colors.textSecondary }]}>Monthly</Text>
            <Text style={[styles.pricingDetail, { color: colors.textMuted }]}>
              Billed monthly, cancel anytime
            </Text>
          </View>
          <View style={styles.pricingRight}>
            <Text style={[styles.pricingPrice, { color: colors.textMuted }]}>
              $4.99/mo
            </Text>
          </View>
        </TouchableOpacity>

        {/* Yearly - Coming Soon */}
        <TouchableOpacity
          style={[
            styles.pricingCard, 
            { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }
          ]}
          onPress={() => Alert.alert('Coming Soon! 🚀', 'Yearly subscription will be available when the app launches on the App Store.')}
          activeOpacity={0.7}
        >
          <View style={[styles.comingSoonBadge, { backgroundColor: colors.neutral500 }]}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
          <View style={styles.pricingLeft}>
            <Text style={[styles.pricingName, { color: colors.textSecondary }]}>Yearly</Text>
            <Text style={[styles.pricingDetail, { color: colors.textMuted }]}>
              Save 50%! Billed annually
            </Text>
          </View>
          <View style={styles.pricingRight}>
            <Text style={[styles.pricingPrice, { color: colors.textMuted }]}>
              $29.99/yr
            </Text>
          </View>
        </TouchableOpacity>

        {/* Lifetime - Coming Soon */}
        <TouchableOpacity
          style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.5 }]}
          onPress={() => Alert.alert('Coming Soon! 🚀', 'Lifetime purchase will be available when the app launches on the App Store.')}
          activeOpacity={0.7}
        >
          <View style={[styles.comingSoonBadge, { backgroundColor: colors.neutral500 }]}>
            <Text style={styles.comingSoonText}>COMING SOON</Text>
          </View>
          <View style={styles.pricingLeft}>
            <Text style={[styles.pricingName, { color: colors.textSecondary }]}>Lifetime</Text>
            <Text style={[styles.pricingDetail, { color: colors.textMuted }]}>
              Pay once, own forever
            </Text>
          </View>
          <View style={styles.pricingRight}>
            <Text style={[styles.pricingPrice, { color: colors.textMuted }]}>
              $79.99
            </Text>
          </View>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.restoreText, { color: colors.primary }]}>
              Restore Purchase
            </Text>
          )}
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. 
          Manage subscriptions in your App Store settings.
        </Text>

        {__DEV__ && (
          <View style={[styles.devNote, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="bug" size={16} color={colors.warning} />
            <Text style={[styles.devNoteText, { color: colors.warning }]}>
              Development mode: Purchases are simulated
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.floatingClose, { backgroundColor: colors.card }, shadows.lg]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
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
  
  // Hero
  hero: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },

  // Status (Premium users)
  statusCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statusEmoji: { fontSize: 48 },
  statusTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.sm,
  },
  statusSubtitle: {
    fontSize: fontSize.md,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: spacing.xs,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: { fontSize: fontSize.md },
  infoValue: { fontSize: fontSize.md, fontWeight: '600' },
  divider: { height: 1 },

  // Section
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
  },

  // Features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureText: { flex: 1 },
  featureTitle: { fontSize: fontSize.md, fontWeight: '600' },
  featureDescription: { fontSize: fontSize.sm, marginTop: 2 },

  // Pricing
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    position: 'relative',
    overflow: 'visible',
  },
  pricingCardHighlight: {
    borderWidth: 0,
  },
  pricingLeft: { flex: 1 },
  pricingRight: { marginLeft: spacing.md },
  pricingName: { fontSize: fontSize.lg, fontWeight: '600' },
  pricingDetail: { fontSize: fontSize.sm, marginTop: 2 },
  pricingPrice: { fontSize: fontSize.lg, fontWeight: '700' },
  
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lifetimeBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  lifetimeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  restoreText: { fontSize: fontSize.md, fontWeight: '500' },

  // Disclaimer
  disclaimer: {
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  thankYou: {
    fontSize: fontSize.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  // Dev note
  devNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  devNoteText: { fontSize: fontSize.sm, fontWeight: '500' },

  // Floating close
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
