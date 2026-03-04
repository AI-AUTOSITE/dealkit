import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../../lib/theme';

const LAST_UPDATED = 'January 18, 2026';

interface Section {
  title: string;
  content: string;
  highlight?: boolean;
}

const SECTIONS: Section[] = [
  {
    title: '🔒 Privacy First',
    content: `DealKit is designed with your privacy as the top priority. Your data stays on YOUR device - we don't collect, store, or transmit any personal information.`,
    highlight: true,
  },
  {
    title: '1. Information We DON\'T Collect',
    content: `DealKit does NOT collect:
• Personal identification information
• Email addresses or contact details
• Location data
• Device identifiers
• Usage analytics or behavior data
• Crash reports with personal data
• Any data from your deals, payments, or contracts`,
  },
  {
    title: '2. Local Data Storage',
    content: `All data you enter into DealKit is stored locally on your device:
• Brand and deal information
• Payment records and schedules
• Rate calculations
• Email drafts
• Contract review results

This data never leaves your device unless you choose to export it manually.`,
  },
  {
    title: '3. No Account Required',
    content: `DealKit does not require:
• Account registration
• Email verification
• Social media login
• Any form of authentication

Simply download and start using the app immediately.`,
  },
  {
    title: '4. No Third-Party Services',
    content: `DealKit does NOT integrate with:
• Analytics services (Google Analytics, Firebase, etc.)
• Advertising networks
• Social media platforms
• Cloud storage services
• Any external APIs that could access your data`,
  },
  {
    title: '5. Data Export & Backup',
    content: `You have full control over your data:
• Export all your data as a JSON file at any time
• Import data when switching devices
• Delete all data by uninstalling the app

The export feature creates a file saved to your device's storage - we never have access to these exports.`,
  },
  {
    title: '6. Push Notifications',
    content: `If you enable payment reminders:
• Notifications are scheduled locally on your device
• No notification data is sent to external servers
• You can disable notifications at any time in Settings

Notification content (due dates, amounts) never leaves your device.`,
  },
  {
    title: '7. App Store Requirements',
    content: `When you download DealKit from the App Store or Google Play:
• Apple/Google may collect standard download analytics
• This is controlled by Apple/Google's privacy policies
• DealKit itself receives no personal data from these platforms`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `DealKit is not directed at children under 13. We do not knowingly collect any information from children. Since we don't collect any personal data at all, children's data cannot be collected.`,
  },
  {
    title: '9. Changes to Privacy Policy',
    content: `We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last Updated" date. We encourage you to review this policy periodically.`,
  },
  {
    title: '10. Your Rights',
    content: `Since all data is stored locally on your device, you have complete control:
• Access: View all your data anytime in the app
• Export: Download all your data using the export feature
• Delete: Remove all data by uninstalling the app
• Portability: Move your data between devices using export/import`,
  },
  {
    title: '11. Contact Us',
    content: `If you have questions about this Privacy Policy, please contact us through:
• The App Store listing
• Leave a review with your question

We're committed to protecting your privacy and will respond to any concerns.`,
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={[styles.updateBadge, { backgroundColor: colors.successLight + '30' }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.success} />
          <Text style={[styles.updateText, { color: colors.success }]}>
            Last Updated: {LAST_UPDATED}
          </Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View
            key={index}
            style={[
              styles.sectionCard, 
              { backgroundColor: section.highlight ? colors.successLight + '20' : colors.card }
            ]}
          >
            <Text style={[
              styles.sectionTitle, 
              { color: section.highlight ? colors.success : colors.text }
            ]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primaryLight + '20' }]}>
          <Text style={[styles.summaryTitle, { color: colors.primary }]}>
            📋 TL;DR Summary
          </Text>
          <Text style={[styles.summaryContent, { color: colors.text }]}>
            • Your data stays on YOUR device{'\n'}
            • We collect NOTHING{'\n'}
            • No accounts, no tracking, no ads{'\n'}
            • Export your data anytime{'\n'}
            • Delete everything by uninstalling
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Your privacy matters to us. 🛡️
          </Text>
        </View>
      </ScrollView>

      {/* Floating Close */}
      <TouchableOpacity
        style={[styles.floatingClose, { backgroundColor: colors.card }, shadows.lg]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
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
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  updateText: { fontSize: fontSize.xs, fontWeight: '500' },
  sectionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  sectionContent: { fontSize: fontSize.sm, lineHeight: 22 },
  summaryCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  summaryContent: { fontSize: fontSize.sm, lineHeight: 24 },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: { fontSize: fontSize.sm },
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
