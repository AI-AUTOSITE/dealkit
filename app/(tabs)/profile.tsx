// app/(tabs)/profile.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { useToast } from '@/lib/toast';
import { exportData, importData, clearAllData } from '@/lib/backup';
import { 
  areNotificationsEnabled, 
  setNotificationsEnabled,
  sendTestNotification 
} from '@/lib/notifications';
import { useDeals, useInvoices } from '@/lib/hooks';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from '@/lib/storage/database';
import { UserProfile } from '@/types';

// App version
const APP_VERSION = '1.1.0';

interface SettingItemProps {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isDark: boolean;
  loading?: boolean;
  destructive?: boolean;
}

function SettingItem({ 
  icon, 
  label, 
  value, 
  onPress, 
  rightElement, 
  isDark, 
  loading,
  destructive 
}: SettingItemProps) {
  const content = (
    <View
      style={[
        styles.settingItem,
        { backgroundColor: isDark ? colors.dark100 : colors.white },
      ]}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDark ? colors.dark50 : colors.neutral100 },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={destructive ? colors.error500 : (isDark ? colors.neutral400 : colors.neutral600)}
          />
        </View>
        <Text 
          variant="bodyMd"
          style={destructive ? { color: colors.error500 } : undefined}
        >
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {loading && <ActivityIndicator size="small" color={colors.primary500} style={{ marginRight: 8 }} />}
        {value && !loading && (
          <Text variant="bodySm" color="secondary" style={{ marginRight: 8 }}>
            {value}
          </Text>
        )}
        {rightElement}
        {onPress && !rightElement && !loading && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isDark ? colors.neutral600 : colors.neutral400}
          />
        )}
      </View>
    </View>
  );

  if (onPress && !loading) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

export default function ProfileScreen() {
  const { isDark, setTheme } = useTheme();
  const { showToast } = useToast();
  
  // Use the same hooks as other screens - this ensures consistency
  const { deals, loading: dealsLoading, loadDeals } = useDeals();
  const { invoices, loading: invoicesLoading, loadInvoices } = useInvoices();
  
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Calculate stats from hooks data
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const pendingDealsValue = deals
    .filter(d => d.stage !== 'paid')
    .reduce((sum, d) => sum + (d.value || 0), 0);
  const pendingInvoicesValue = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const pendingValue = pendingDealsValue + pendingInvoicesValue;
  
  const statsLoading = dealsLoading || invoicesLoading;
  
  // Dashboard computations
  const dashboardData = useMemo(() => {
    // Monthly earnings (last 6 months)
    const now = new Date();
    const months: { label: string; earned: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const earned = invoices
        .filter(inv => inv.status === 'paid' && inv.paidDate?.startsWith(yearMonth))
        .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);
      months.push({ label: monthStr, earned });
    }
    const maxEarned = Math.max(...months.map(m => m.earned), 1);

    // Total earned from paid invoices
    const totalEarned = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.paidAmount || inv.amount || 0), 0);

    // Completed deals count
    const completedDeals = deals.filter(d => d.stage === 'paid').length;

    // Average deal value (paid deals only)
    const paidDeals = deals.filter(d => d.stage === 'paid');
    const avgDealValue = paidDeals.length > 0
      ? paidDeals.reduce((sum, d) => sum + (d.value || 0), 0) / paidDeals.length
      : 0;

    // Top brands by earned amount
    const brandMap = new Map<string, number>();
    invoices
      .filter(inv => inv.status === 'paid')
      .forEach(inv => {
        const current = brandMap.get(inv.brandName) || 0;
        brandMap.set(inv.brandName, current + (inv.paidAmount || inv.amount || 0));
      });
    const topBrands = Array.from(brandMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount }));

    // Deal stage distribution
    const stageCount = new Map<string, number>();
    deals.forEach(d => {
      const current = stageCount.get(d.stage) || 0;
      stageCount.set(d.stage, current + 1);
    });
    const stageLabels: Record<string, string> = {
      pitched: 'Pitched',
      negotiating: 'Negotiating',
      contracted: 'Contracted',
      in_progress: 'In Progress',
      delivered: 'Delivered',
      invoiced: 'Invoiced',
      paid: 'Paid',
    };
    const stageColors: Record<string, string> = {
      pitched: colors.neutral400,
      negotiating: colors.warning500,
      contracted: colors.primary500,
      in_progress: '#3B82F6',
      delivered: '#8B5CF6',
      invoiced: '#F97316',
      paid: colors.success500,
    };
    const stages = Array.from(stageCount.entries())
      .map(([stage, count]) => ({
        stage,
        label: stageLabels[stage] || stage,
        count,
        color: stageColors[stage] || colors.neutral400,
      }));

    return { months, maxEarned, totalEarned, completedDeals, avgDealValue, topBrands, stages };
  }, [deals, invoices]);
  
  // Load user profile from database
  const loadProfile = useCallback(async () => {
    try {
      const db = getDatabase();
      const profile = await db.getFirstAsync<UserProfile>(
        'SELECT * FROM user_profile WHERE id = 1'
      );
      setUserProfile(profile || null);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);
  
  // Reload data when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('[Profile] Screen focused, reloading data...');
      loadDeals();
      loadInvoices();
      loadProfile();
    }, [loadDeals, loadInvoices, loadProfile])
  );

  // Load notification setting on mount
  useEffect(() => {
    async function loadNotificationSetting() {
      const enabled = await areNotificationsEnabled();
      setNotificationsEnabledState(enabled);
    }
    loadNotificationSetting();
  }, []);

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleNotificationToggle = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabledState(newValue);
    await setNotificationsEnabled(newValue);
    showToast(
      newValue ? 'Notifications enabled' : 'Notifications disabled',
      'success'
    );
  };

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      showToast('Enable notifications first', 'warning');
      return;
    }
    await sendTestNotification();
    showToast('Test notification sent!', 'success');
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const success = await exportData();
      if (success) {
        showToast('Data exported successfully!', 'success');
      } else {
        showToast('Export failed', 'error');
      }
    } catch (err) {
      showToast('Export failed', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'This will replace all your current data with the imported data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            setImporting(true);
            try {
              const result = await importData();
              if (result.success) {
                showToast(result.message, 'success');
              } else {
                showToast(result.message, 'error');
              }
            } catch (err) {
              showToast('Import failed', 'error');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your Deals, Payments, Brands, and Messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              // Reload data to update UI
              await loadDeals();
              await loadInvoices();
              showToast('All data cleared', 'success');
            } else {
              showToast('Failed to clear data', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.neutral50 },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card - Tappable to edit */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            { backgroundColor: isDark ? colors.dark100 : colors.white },
          ]}
          onPress={() => router.push('/(modals)/settings/profile')}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.primary500 }]}>
            <Text variant="headingXl" style={{ color: colors.white }}>
              {userProfile?.display_name ? userProfile.display_name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text variant="headingLg" style={{ marginTop: 12 }}>
                {userProfile?.display_name || 'Your Name'}
              </Text>
              <Ionicons 
                name="pencil" 
                size={16} 
                color={isDark ? colors.neutral500 : colors.neutral400} 
                style={{ marginLeft: 8, marginTop: 14 }}
              />
            </View>
            <Text variant="bodyMd" color="secondary">
              {userProfile?.handle ? `@${userProfile.handle}` : 'Tap to edit profile'}
            </Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="headingLg" style={{ color: colors.primary500 }}>
                {totalDeals}
              </Text>
              <Text variant="bodySm" color="secondary">
                Deals
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: isDark ? colors.neutral700 : colors.neutral200 },
              ]}
            />
            <View style={styles.statItem}>
              <Text variant="headingLg" style={{ color: colors.success500 }}>
                ${totalValue.toLocaleString()}
              </Text>
              <Text variant="bodySm" color="secondary">
                Total Value
              </Text>
            </View>
            <View
              style={[
                styles.statDivider,
                { backgroundColor: isDark ? colors.neutral700 : colors.neutral200 },
              ]}
            />
            <View style={styles.statItem}>
              <Text variant="headingLg" style={{ color: colors.warning500 }}>
                ${pendingValue.toLocaleString()}
              </Text>
              <Text variant="bodySm" color="secondary">
                Pending
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Dashboard Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            DASHBOARD
          </Text>

          {/* Summary Cards */}
          <View style={styles.dashGrid}>
            <View style={[styles.dashCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
              <Ionicons name="cash-outline" size={20} color={colors.success500} />
              <Text variant="headingMd" style={{ color: colors.success500, marginTop: 4 }}>
                ${dashboardData.totalEarned.toLocaleString()}
              </Text>
              <Text variant="bodySm" color="secondary">Total Earned</Text>
            </View>
            <View style={[styles.dashCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
              <Ionicons name="trending-up-outline" size={20} color={colors.primary500} />
              <Text variant="headingMd" style={{ color: colors.primary500, marginTop: 4 }}>
                ${Math.round(dashboardData.avgDealValue).toLocaleString()}
              </Text>
              <Text variant="bodySm" color="secondary">Avg Deal</Text>
            </View>
            <View style={[styles.dashCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
              <Ionicons name="checkmark-done-outline" size={20} color={'#8B5CF6'} />
              <Text variant="headingMd" style={{ color: '#8B5CF6', marginTop: 4 }}>
                {dashboardData.completedDeals}
              </Text>
              <Text variant="bodySm" color="secondary">Completed</Text>
            </View>
          </View>

          {/* Monthly Earnings Chart */}
          <View style={[styles.chartCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
            <Text variant="headingSm" style={{ marginBottom: 16 }}>
              Monthly Earnings
            </Text>
            <View style={styles.chartContainer}>
              {dashboardData.months.map((month, index) => (
                <View key={index} style={styles.chartBarCol}>
                  <View style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: month.earned > 0
                            ? `${Math.max((month.earned / dashboardData.maxEarned) * 100, 5)}%`
                            : 4,
                          backgroundColor: month.earned > 0 ? colors.primary500 : (isDark ? colors.neutral700 : colors.neutral200),
                          borderRadius: 4,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="bodySm" color="secondary" style={styles.chartLabel}>
                    {month.label}
                  </Text>
                  {month.earned > 0 && (
                    <Text style={[styles.chartValue, { color: isDark ? colors.neutral300 : colors.neutral600 }]}>
                      ${month.earned >= 1000 ? `${(month.earned / 1000).toFixed(1)}k` : month.earned}
                    </Text>
                  )}
                </View>
              ))}
            </View>
            {dashboardData.months.every(m => m.earned === 0) && (
              <Text variant="bodySm" color="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
                Mark payments as paid to see your earnings here
              </Text>
            )}
          </View>

          {/* Deal Pipeline */}
          {dashboardData.stages.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
              <Text variant="headingSm" style={{ marginBottom: 12 }}>
                Deal Pipeline
              </Text>
              {dashboardData.stages.map((item, index) => (
                <View key={item.stage} style={styles.pipelineRow}>
                  <View style={[styles.pipelineDot, { backgroundColor: item.color }]} />
                  <Text variant="bodyMd" style={{ flex: 1 }}>{item.label}</Text>
                  <Text variant="headingSm" style={{ color: item.color }}>{item.count}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Brands */}
          {dashboardData.topBrands.length > 0 && (
            <View style={[styles.chartCard, { backgroundColor: isDark ? colors.dark100 : colors.white }]}>
              <Text variant="headingSm" style={{ marginBottom: 12 }}>
                Top Brands
              </Text>
              {dashboardData.topBrands.map((brand, index) => (
                <View key={brand.name} style={styles.pipelineRow}>
                  <Text variant="headingSm" style={{ color: colors.primary500, marginRight: 10, width: 20 }}>
                    {index + 1}
                  </Text>
                  <Text variant="bodyMd" style={{ flex: 1 }}>{brand.name}</Text>
                  <Text variant="headingSm" style={{ color: colors.success500 }}>
                    ${brand.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            APPEARANCE
          </Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon="moon-outline"
              label="Dark Mode"
              isDark={isDark}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleThemeToggle}
                  trackColor={{ 
                    false: colors.neutral300, 
                    true: colors.primary500 
                  }}
                  thumbColor={colors.white}
                />
              }
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            NOTIFICATIONS
          </Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon="notifications-outline"
              label="Push Notifications"
              isDark={isDark}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ 
                    false: colors.neutral300, 
                    true: colors.primary500 
                  }}
                  thumbColor={colors.white}
                />
              }
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="paper-plane-outline"
              label="Send Test Notification"
              isDark={isDark}
              onPress={handleTestNotification}
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            DATA
          </Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon="cloud-upload-outline"
              label="Export Data"
              isDark={isDark}
              onPress={handleExportData}
              loading={exporting}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="cloud-download-outline"
              label="Import Data"
              isDark={isDark}
              onPress={handleImportData}
              loading={importing}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="trash-outline"
              label="Clear All Data"
              isDark={isDark}
              onPress={handleClearData}
              destructive
            />
          </View>
        </View>

        {/* Tools Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            TOOLS
          </Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon="calculator-outline"
              label="Rate Calculator"
              isDark={isDark}
              onPress={() => router.push('/(modals)/rate-calculator')}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="mail-outline"
              label="Email Builder"
              isDark={isDark}
              onPress={() => router.push('/(modals)/email-assistant')}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="document-text-outline"
              label="Contract Review"
              isDark={isDark}
              onPress={() => router.push('/(modals)/contract-review')}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="pricetag-outline"
              label="Usage Calculator"
              isDark={isDark}
              onPress={() => router.push('/(modals)/usage-calculator')}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text variant="headingSm" color="secondary" style={styles.sectionTitle}>
            ABOUT
          </Text>
          <View style={styles.settingGroup}>
            <SettingItem
              icon="information-circle-outline"
              label="Version"
              value={APP_VERSION}
              isDark={isDark}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="document-text-outline"
              label="Terms of Service"
              isDark={isDark}
              onPress={() => router.push('/(modals)/settings/terms')}
            />
            <View
              style={[
                styles.separator,
                { backgroundColor: isDark ? colors.neutral800 : colors.neutral100 },
              ]}
            />
            <SettingItem
              icon="shield-checkmark-outline"
              label="Privacy Policy"
              isDark={isDark}
              onPress={() => router.push('/(modals)/settings/privacy')}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="bodySm" color="secondary">
            Made with ❤️ for creators
          </Text>
          <Text variant="bodySm" color="secondary" style={{ marginTop: 4 }}>
            DealKit v{APP_VERSION}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  profileCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  settingGroup: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  // Dashboard styles
  dashGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
    marginBottom: 10,
  },
  dashCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    width: '100%',
    height: 90,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    minWidth: 16,
  },
  chartLabel: {
    marginTop: 6,
    fontSize: 11,
  },
  chartValue: {
    fontSize: 10,
    marginTop: 2,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pipelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
});