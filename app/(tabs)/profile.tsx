// app/(tabs)/profile.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { getDatabase } from '@/lib/database';
import { UserProfile } from '@/types';

// App version
const APP_VERSION = '1.0.0';

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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.neutral50 },
      ]}
      edges={['top']}
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
    </SafeAreaView>
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
});