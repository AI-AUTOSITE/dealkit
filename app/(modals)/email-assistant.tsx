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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../lib/theme';
import { EmailTemplate, EmailTone } from '../../types';

interface TemplateInfo {
  key: EmailTemplate;
  label: string;
  category: string;
  icon: string;
  fields: string[];
}

const TEMPLATES: TemplateInfo[] = [
  // Negotiation
  { key: 'negotiation_rate_quote', label: 'Rate Quote', category: 'Negotiation', icon: 'cash', fields: ['brand_name', 'contact_name', 'rate', 'content_type'] },
  { key: 'negotiation_counter_offer', label: 'Counter Offer', category: 'Negotiation', icon: 'trending-up', fields: ['brand_name', 'contact_name', 'their_rate', 'my_rate', 'reason'] },
  { key: 'negotiation_decline', label: 'Polite Decline', category: 'Negotiation', icon: 'hand-left', fields: ['brand_name', 'contact_name', 'reason'] },
  // Payment
  { key: 'payment_pre_due', label: 'Pre-Due Reminder', category: 'Payment', icon: 'time', fields: ['brand_name', 'contact_name', 'amount', 'due_date'] },
  { key: 'payment_day_1', label: 'Day 1 Overdue', category: 'Payment', icon: 'alert', fields: ['brand_name', 'contact_name', 'amount', 'invoice_date'] },
  { key: 'payment_day_7', label: 'Day 7 Overdue', category: 'Payment', icon: 'alert-circle', fields: ['brand_name', 'contact_name', 'amount', 'invoice_date'] },
  { key: 'payment_day_14', label: 'Day 14 Overdue', category: 'Payment', icon: 'warning', fields: ['brand_name', 'contact_name', 'amount', 'invoice_date'] },
  { key: 'payment_day_30', label: 'Day 30 Overdue', category: 'Payment', icon: 'flame', fields: ['brand_name', 'contact_name', 'amount', 'invoice_date'] },
  // Business
  { key: 'business_confirmation', label: 'Deal Confirmation', category: 'Business', icon: 'checkmark-circle', fields: ['brand_name', 'contact_name', 'campaign_name', 'deliverables', 'deadline'] },
  { key: 'business_delivery', label: 'Content Delivery', category: 'Business', icon: 'paper-plane', fields: ['brand_name', 'contact_name', 'content_type'] },
  { key: 'business_thank_you', label: 'Thank You', category: 'Business', icon: 'heart', fields: ['brand_name', 'contact_name'] },
  // Relationship
  { key: 'relationship_checkin', label: 'Check-in', category: 'Relationship', icon: 'chatbubble', fields: ['brand_name', 'contact_name', 'last_project'] },
  { key: 'relationship_recollab', label: 'Re-collaboration', category: 'Relationship', icon: 'refresh', fields: ['brand_name', 'contact_name', 'idea'] },
];

const TONES: { key: EmailTone; label: string; emoji: string }[] = [
  { key: 'friendly', label: 'Friendly', emoji: '😊' },
  { key: 'professional', label: 'Professional', emoji: '💼' },
  { key: 'firm', label: 'Firm', emoji: '💪' },
];

const EMAIL_TEMPLATES: Record<EmailTemplate, (data: Record<string, string>, tone: EmailTone) => { subject: string; body: string }> = {
  negotiation_rate_quote: (data, tone) => ({
    subject: `Rate Quote - ${data.content_type || 'Content'} Collaboration`,
    body: tone === 'friendly' 
      ? `Hi ${data.contact_name || 'there'},\n\nThanks so much for reaching out about this collaboration! I'm excited about the opportunity to work with ${data.brand_name}.\n\nFor a ${data.content_type || 'content piece'}, my rate is ${data.rate}. This includes content creation, one round of revisions, and usage for your organic social channels.\n\nLet me know if you'd like to discuss further!\n\nBest,\n[Your Name]`
      : tone === 'professional'
      ? `Dear ${data.contact_name || 'Team'},\n\nThank you for your interest in collaborating with me. I appreciate ${data.brand_name}'s outreach.\n\nMy rate for a ${data.content_type || 'content piece'} is ${data.rate}. This includes content creation, one revision round, and organic social usage rights.\n\nPlease let me know if you have any questions.\n\nBest regards,\n[Your Name]`
      : `Hi ${data.contact_name || 'there'},\n\nThank you for reaching out. My rate for a ${data.content_type || 'content piece'} is ${data.rate}.\n\nThis is my standard rate based on my audience engagement and the deliverables required. I'm happy to discuss the scope if needed.\n\nBest,\n[Your Name]`
  }),
  negotiation_counter_offer: (data, tone) => ({
    subject: `Re: Collaboration Opportunity`,
    body: tone === 'friendly'
      ? `Hi ${data.contact_name || 'there'},\n\nThank you for your offer of ${data.their_rate}! I really appreciate ${data.brand_name}'s interest.\n\nGiven ${data.reason || 'the scope of work and my engagement rates'}, I'd like to propose ${data.my_rate} instead.\n\nI'm confident I can deliver amazing results for this campaign. Would this work for your budget?\n\nLooking forward to hearing from you!\n\n[Your Name]`
      : tone === 'professional'
      ? `Dear ${data.contact_name || 'Team'},\n\nThank you for your offer of ${data.their_rate}. While I appreciate ${data.brand_name}'s proposal, I would like to counter with ${data.my_rate}.\n\nThis rate reflects ${data.reason || 'the deliverables required and my audience engagement metrics'}.\n\nI remain very interested in this partnership and am open to further discussion.\n\nBest regards,\n[Your Name]`
      : `Hi ${data.contact_name || 'there'},\n\nThank you for the offer of ${data.their_rate}. Unfortunately, this is below my standard rates.\n\nMy rate for this project would be ${data.my_rate}. This reflects ${data.reason || 'the value I bring and my standard pricing'}.\n\nPlease let me know if this works for your budget.\n\nBest,\n[Your Name]`
  }),
  negotiation_decline: (data, tone) => ({
    subject: `Re: Collaboration Opportunity`,
    body: `Hi ${data.contact_name || 'there'},\n\nThank you so much for thinking of me for this opportunity with ${data.brand_name}.\n\nAfter careful consideration, I've decided to pass on this collaboration ${data.reason ? `because ${data.reason}` : 'at this time'}.\n\nI hope we can work together on future projects that are a better fit!\n\nBest wishes,\n[Your Name]`
  }),
  payment_pre_due: (data, tone) => ({
    subject: `Upcoming Invoice - Due ${data.due_date}`,
    body: `Hi ${data.contact_name || 'there'},\n\nJust a friendly reminder that the invoice for ${data.amount} is coming due on ${data.due_date}.\n\nPlease let me know if you need me to resend the invoice or if you have any questions about the payment process.\n\nThank you!\n\n[Your Name]`
  }),
  payment_day_1: (data, tone) => ({
    subject: `Invoice Past Due - ${data.brand_name}`,
    body: `Hi ${data.contact_name || 'there'},\n\nI hope you're doing well! I wanted to follow up on the invoice for ${data.amount} from ${data.invoice_date}, which was due yesterday.\n\nIf you've already sent the payment, please disregard this message. If not, could you please let me know when I can expect it?\n\nThank you!\n\n[Your Name]`
  }),
  payment_day_7: (data, tone) => ({
    subject: `Payment Reminder - Invoice Overdue`,
    body: `Hi ${data.contact_name || 'there'},\n\nI'm following up on the outstanding invoice for ${data.amount} from ${data.invoice_date}, which is now 7 days overdue.\n\nCould you please provide an update on when I can expect payment? If there are any issues with the invoice, please let me know so we can resolve them.\n\nThank you for your attention to this matter.\n\n[Your Name]`
  }),
  payment_day_14: (data, tone) => ({
    subject: `Urgent: Invoice 14 Days Overdue`,
    body: `Hi ${data.contact_name || 'there'},\n\nI'm reaching out regarding the invoice for ${data.amount} from ${data.invoice_date}, which is now 14 days overdue.\n\nI would appreciate a response regarding the status of this payment. Please let me know if there are any issues that need to be addressed.\n\nI look forward to hearing from you soon.\n\n[Your Name]`
  }),
  payment_day_30: (data, tone) => ({
    subject: `Final Notice: Invoice 30 Days Overdue`,
    body: `Hi ${data.contact_name || 'there'},\n\nThis is a final notice regarding the outstanding invoice for ${data.amount} from ${data.invoice_date}, which is now 30 days overdue.\n\nI need to receive payment within the next 7 days, or I will need to consider additional steps to collect this debt.\n\nPlease contact me immediately to resolve this matter.\n\n[Your Name]`
  }),
  business_confirmation: (data, tone) => ({
    subject: `Confirmed: ${data.campaign_name || 'Our Collaboration'}`,
    body: `Hi ${data.contact_name || 'there'},\n\nI'm excited to confirm our collaboration with ${data.brand_name} for ${data.campaign_name || 'this project'}!\n\nJust to recap:\n• Deliverables: ${data.deliverables || '[Content details]'}\n• Deadline: ${data.deadline || '[Date]'}\n\nPlease let me know if I'm missing anything. Looking forward to creating something great together!\n\nBest,\n[Your Name]`
  }),
  business_delivery: (data, tone) => ({
    subject: `Content Delivered - ${data.brand_name}`,
    body: `Hi ${data.contact_name || 'there'},\n\nI'm happy to share the completed ${data.content_type || 'content'} for our ${data.brand_name} collaboration!\n\n[Insert link or attachment]\n\nPlease let me know if you'd like any revisions. I'm here to make sure you're 100% happy with the final result.\n\nLooking forward to your feedback!\n\n[Your Name]`
  }),
  business_thank_you: (data, tone) => ({
    subject: `Thank You - ${data.brand_name} Collaboration`,
    body: `Hi ${data.contact_name || 'there'},\n\nI just wanted to say thank you for the opportunity to work with ${data.brand_name}! It was such a pleasure collaborating with your team.\n\nI'm really happy with how everything turned out, and I hope you are too!\n\nI'd love to work together again in the future. Feel free to reach out anytime!\n\nWarmly,\n[Your Name]`
  }),
  relationship_checkin: (data, tone) => ({
    subject: `Checking In - ${data.brand_name}`,
    body: `Hi ${data.contact_name || 'there'},\n\nI hope you're doing well! It's been a while since our ${data.last_project || 'last project'} together, and I wanted to check in.\n\nI've been creating some exciting new content lately and thought of ${data.brand_name}. Would love to catch up and hear what you're working on!\n\nHope to hear from you soon.\n\nBest,\n[Your Name]`
  }),
  relationship_recollab: (data, tone) => ({
    subject: `New Collaboration Idea - ${data.brand_name}`,
    body: `Hi ${data.contact_name || 'there'},\n\nI've been thinking about our previous work together, and I have an idea I'd love to share!\n\n${data.idea || '[Your idea here]'}\n\nI think this could be a great fit for ${data.brand_name} and would love to discuss it further.\n\nWhat do you think? Let me know if you'd like to hop on a call!\n\nBest,\n[Your Name]`
  }),
  // Placeholders for remaining templates
  pitch_initial: (data, tone) => ({ subject: 'Collaboration Pitch', body: 'Template coming soon...' }),
  pitch_followup: (data, tone) => ({ subject: 'Following Up', body: 'Template coming soon...' }),
  negotiation_usage_rights: (data, tone) => ({ subject: 'Usage Rights Discussion', body: 'Template coming soon...' }),
};

export default function EmailAssistantScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ payment?: string }>();

  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [tone, setTone] = useState<EmailTone>('friendly');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleSelectTemplate = (template: TemplateInfo) => {
    setSelectedTemplate(template.key);
    setFormData({});
    setGeneratedEmail(null);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const template = TEMPLATES.find(t => t.key === selectedTemplate);
    if (template) {
      const requiredFields = template.fields.filter(f => 
        f === 'brand_name' || f === 'amount' || f === 'rate'
      );
      const missingFields = requiredFields.filter(f => !formData[f]?.trim());
      
      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(f => 
          f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
        ).join(', ');
        Alert.alert('Missing Information', `Please fill in: ${fieldNames}`);
        return;
      }
    }

    setGenerating(true);
    try {
      const templateFn = EMAIL_TEMPLATES[selectedTemplate];
      const email = templateFn(formData, tone);
      setGeneratedEmail(email);
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', 'Failed to generate email. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', 'Text copied to clipboard.');
  };

  const currentTemplate = TEMPLATES.find(t => t.key === selectedTemplate);

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
          Email Builder
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
        {!selectedTemplate ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              📧 Choose a Template
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Professional emails in seconds.
            </Text>

            {['Negotiation', 'Payment', 'Business', 'Relationship'].map(category => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>
                  {category}
                </Text>
                <View style={styles.templateGrid}>
                  {TEMPLATES.filter(t => t.category === category).map(template => (
                    <TouchableOpacity
                      key={template.key}
                      style={[
                        styles.templateCard, 
                        { backgroundColor: colors.card }
                      ]}
                      onPress={() => handleSelectTemplate(template)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={template.icon as any} 
                        size={24} 
                        color={colors.primary} 
                      />
                      <Text style={[
                        styles.templateLabel, 
                        { color: colors.text }
                      ]}>
                        {template.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </>
        ) : generatedEmail ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setSelectedTemplate(null);
                setGeneratedEmail(null);
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.backButtonText, { color: colors.primary }]}>
                Back to Templates
              </Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>
              ✅ Your Email is Ready!
            </Text>

            {/* Subject */}
            <View style={styles.emailSection}>
              <View style={styles.emailHeader}>
                <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Subject</Text>
                <TouchableOpacity onPress={() => handleCopy(generatedEmail.subject)}>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.emailContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.emailText, { color: colors.text }]}>
                  {generatedEmail.subject}
                </Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.emailSection}>
              <View style={styles.emailHeader}>
                <Text style={[styles.emailLabel, { color: colors.textSecondary }]}>Body</Text>
                <TouchableOpacity onPress={() => handleCopy(generatedEmail.body)}>
                  <Ionicons name="copy-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.emailContent, { backgroundColor: colors.card }]}>
                <Text style={[styles.emailText, { color: colors.text }]}>
                  {generatedEmail.body}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.copyAllButton, { backgroundColor: colors.primary }]}
              onPress={() => handleCopy(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`)}
            >
              <Ionicons name="copy" size={20} color="#FFFFFF" />
              <Text style={styles.copyAllButtonText}>Copy All</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedTemplate(null)}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={[styles.backButtonText, { color: colors.primary }]}>
                Back to Templates
              </Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: colors.text }]}>
              📝 {currentTemplate?.label}
            </Text>

            {/* Tone Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tone</Text>
              <View style={styles.toneGrid}>
                {TONES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.toneChip,
                      { backgroundColor: colors.card },
                      tone === t.key && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setTone(t.key)}
                  >
                    <Text style={styles.toneEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.toneText,
                        { color: tone === t.key ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dynamic Form Fields */}
            {currentTemplate?.fields.map(field => (
              <View key={field} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  placeholder={`Enter ${field.replace(/_/g, ' ')}`}
                  placeholderTextColor={colors.textMuted}
                  value={formData[field] || ''}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, [field]: text }))}
                  multiline={field === 'reason' || field === 'idea' || field === 'deliverables'}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.primary }]}
              onPress={handleGenerate}
              disabled={generating}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                {generating ? 'Creating...' : 'Create Email'}
              </Text>
            </TouchableOpacity>
          </>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  backButtonText: { fontSize: fontSize.sm, fontWeight: '500' },
  categorySection: { marginBottom: spacing.lg },
  categoryTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  templateCard: {
    width: '48%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    gap: spacing.xs,
    position: 'relative',
  },
  templateLabel: { fontSize: fontSize.sm, fontWeight: '500', textAlign: 'center' },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  toneGrid: { flexDirection: 'row', gap: spacing.sm },
  toneChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  toneEmoji: { fontSize: 16 },
  toneText: { fontSize: fontSize.sm, fontWeight: '500' },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  generateButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
  emailSection: { marginBottom: spacing.md },
  emailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  emailLabel: { fontSize: fontSize.sm, fontWeight: '500' },
  emailContent: { padding: spacing.md, borderRadius: borderRadius.md },
  emailText: { fontSize: fontSize.md, lineHeight: 22 },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  copyAllButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
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
