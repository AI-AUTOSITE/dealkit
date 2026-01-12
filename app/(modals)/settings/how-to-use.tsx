import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../../lib/theme';

interface GuideSection {
  emoji: string;
  title: string;
  steps: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    emoji: '💼',
    title: 'Track Your Deals',
    steps: [
      'Tap the + button on the Deals tab to add a new deal',
      'Fill in the brand name, platform, and rate',
      'Set the content type and deadline',
      'Your deal will appear in the list - tap to edit',
    ],
  },
  {
    emoji: '💰',
    title: 'Manage Payments',
    steps: [
      'Go to the Payments tab',
      'Tap + to add a new payment',
      'Enter the brand, amount, and invoice date',
      'Choose payment terms (Net-15, Net-30, etc.)',
      'When paid, tap "Mark as Paid"',
    ],
  },
  {
    emoji: '🔔',
    title: 'Payment Reminders',
    steps: [
      'Enable notifications in Settings',
      'Get reminded 7, 3, and 1 day before due date',
      'Get alerted the day after if payment is overdue',
      'Reminders automatically cancel when marked paid',
    ],
  },
  {
    emoji: '🧮',
    title: 'Rate Calculator',
    steps: [
      'Go to Tools tab → Rate Calculator',
      'Select your platform (Instagram, TikTok, etc.)',
      'Enter your follower count',
      'Add engagement rate for bonus calculation',
      'Select your niche for premium multipliers',
      'Get your recommended rate range!',
    ],
  },
  {
    emoji: '📧',
    title: 'Email Builder',
    steps: [
      'Go to Tools tab → Email Builder',
      'Choose a template category (Negotiation, Payment, etc.)',
      'Select the specific template you need',
      'Fill in the required fields',
      'Choose your tone (Friendly, Professional, Firm)',
      'Create and copy your email!',
    ],
  },
  {
    emoji: '📋',
    title: 'Contract Review',
    steps: [
      'Go to Tools tab → Contract Review',
      'Paste your contract text',
      'Tap "Analyze Contract"',
      'Review the score and red flags',
      'Tap each issue for suggestions',
    ],
  },
  {
    emoji: '📊',
    title: 'Usage Calculator',
    steps: [
      'Go to Tools tab → Usage Calculator',
      'Set your base rate for content creation',
      'Select where content will be used',
      'Choose the usage duration',
      'Select territory and exclusivity',
      'Get your recommended total rate!',
    ],
  },
  {
    emoji: '💾',
    title: 'Backup Your Data',
    steps: [
      'Go to Settings → Export Data (Premium)',
      'Your data is saved as a JSON file',
      'Store it in iCloud, Google Drive, etc.',
      'To restore, use Settings → Import Data',
    ],
  },
];

export default function HowToUseScreen() {
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
          How to Use
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          DealKit helps you manage your creator business. Here's how to get started:
        </Text>

        {GUIDE_SECTIONS.map((section, index) => (
          <View
            key={index}
            style={[styles.sectionCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEmoji}>{section.emoji}</Text>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {section.title}
              </Text>
            </View>
            <View style={styles.stepsList}>
              {section.steps.map((step, stepIndex) => (
                <View key={stepIndex} style={styles.stepRow}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{stepIndex + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primaryLight + '20' }]}>
          <Text style={[styles.tipsTitle, { color: colors.primary }]}>
            💡 Pro Tips
          </Text>
          <Text style={[styles.tipsText, { color: colors.text }]}>
            • Use the Rate Calculator before every negotiation{'\n'}
            • Check contracts with Contract Review before signing{'\n'}
            • Export your data regularly as a backup{'\n'}
            • Upgrade to Premium for unlimited Pro tool usage
          </Text>
        </View>

        {/* Support */}
        <View style={[styles.supportCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.supportTitle, { color: colors.text }]}>
            Need Help?
          </Text>
          <Text style={[styles.supportText, { color: colors.textSecondary }]}>
            Send us feedback from Settings → Send Feedback
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
  intro: { fontSize: fontSize.md, marginBottom: spacing.lg, lineHeight: 22 },
  sectionCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionEmoji: { fontSize: 24, marginRight: spacing.sm },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600' },
  stepsList: { gap: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  stepNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  stepText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
  tipsCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  tipsTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  tipsText: { fontSize: fontSize.sm, lineHeight: 22 },
  supportCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  supportTitle: { fontSize: fontSize.md, fontWeight: '600' },
  supportText: { fontSize: fontSize.sm, marginTop: spacing.xs },
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
