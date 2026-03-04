import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../../lib/theme';

const LAST_UPDATED = 'January 18, 2026';

interface Section {
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Acceptance of Terms',
    content: `By downloading, installing, or using DealKit ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App.`,
  },
  {
    title: '2. Description of Service',
    content: `DealKit is a personal organization tool designed for content creators to:
• Track brand deals and collaborations
• Manage payment schedules and reminders
• Calculate suggested rates
• Review contract terms
• Draft professional emails

The App is intended for personal use and does not constitute professional legal, financial, or business advice.`,
  },
  {
    title: '3. User Accounts',
    content: `DealKit does not require account registration. All your data is stored locally on your device. You are responsible for:
• Maintaining the security of your device
• Backing up your data using the export feature
• Any data entered into the App`,
  },
  {
    title: '4. Data Storage & Privacy',
    content: `Your data is stored exclusively on your device. DealKit:
• Does NOT collect personal information
• Does NOT transmit data to external servers
• Does NOT require an internet connection for core features
• Does NOT use analytics or tracking

For complete details, please review our Privacy Policy.`,
  },
  {
    title: '5. Intellectual Property',
    content: `The App, including its design, features, and content, is owned by the developer and protected by copyright laws. You may not:
• Copy, modify, or distribute the App
• Reverse engineer or decompile the App
• Use the App for commercial redistribution`,
  },
  {
    title: '6. Disclaimer of Warranties',
    content: `The App is provided "AS IS" without warranties of any kind. We do not guarantee that:
• The rate calculations are accurate for your specific situation
• The contract review feature identifies all potential issues
• The App will be error-free or uninterrupted

Always consult with qualified professionals for legal, financial, or business decisions.`,
  },
  {
    title: '7. Limitation of Liability',
    content: `To the maximum extent permitted by law, we shall not be liable for:
• Any indirect, incidental, or consequential damages
• Loss of data or business opportunities
• Decisions made based on App calculations or suggestions
• Any damages arising from use or inability to use the App`,
  },
  {
    title: '8. User Responsibilities',
    content: `You agree to:
• Use the App only for lawful purposes
• Not use the App to store illegal or harmful content
• Back up your data regularly
• Report any bugs or issues you encounter`,
  },
  {
    title: '9. Changes to Terms',
    content: `We may update these Terms of Service from time to time. Continued use of the App after changes constitutes acceptance of the new terms. We recommend reviewing these terms periodically.`,
  },
  {
    title: '10. Termination',
    content: `You may stop using the App at any time by uninstalling it from your device. All locally stored data will be removed when the App is uninstalled.`,
  },
  {
    title: '11. Governing Law',
    content: `These terms are governed by the laws of Japan. Any disputes shall be resolved in the courts of Japan.`,
  },
  {
    title: '12. Contact',
    content: `For questions about these Terms of Service, please contact us through the App Store listing or leave a review with your question.`,
  },
];

export default function TermsScreen() {
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
          Terms of Service
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={[styles.updateBadge, { backgroundColor: colors.primaryLight + '30' }]}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.updateText, { color: colors.primary }]}>
            Last Updated: {LAST_UPDATED}
          </Text>
        </View>

        {/* Introduction */}
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Please read these Terms of Service carefully before using DealKit. By using the App, you agree to these terms.
        </Text>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View
            key={index}
            style={[styles.sectionCard, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {section.content}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Thank you for using DealKit! 💼
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
  intro: { fontSize: fontSize.md, marginBottom: spacing.lg, lineHeight: 22 },
  sectionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  sectionContent: { fontSize: fontSize.sm, lineHeight: 22 },
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
