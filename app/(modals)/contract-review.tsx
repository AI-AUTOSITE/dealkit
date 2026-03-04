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
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme, spacing, fontSize, borderRadius, shadows } from '../../lib/theme';
import { getDatabase, generateId, getLocalDateString } from '../../lib/database';

interface RedFlag {
  severity: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
  originalText?: string;
}

interface ReviewResult {
  score: number;
  redFlags: RedFlag[];
  summary: string;
}

// Red flag detection patterns
const RED_FLAG_PATTERNS: { 
  pattern: RegExp; 
  severity: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  suggestion: string;
}[] = [
  // HIGH SEVERITY - Payment Issues
  {
    pattern: /net[- ]?60|60[- ]?days?/i,
    severity: 'high',
    category: 'Payment Terms',
    issue: 'Payment terms of Net-60 are very long',
    suggestion: 'Request Net-30 or Net-15 instead. Industry standard is Net-30.'
  },
  {
    pattern: /net[- ]?90|90[- ]?days?/i,
    severity: 'high',
    category: 'Payment Terms',
    issue: 'Payment terms of Net-90 are extremely long',
    suggestion: 'This is a red flag. Request Net-30 maximum.'
  },
  {
    pattern: /upon\s+(approval|satisfaction)|when\s+satisfied/i,
    severity: 'high',
    category: 'Payment Terms',
    issue: 'Payment contingent on subjective approval',
    suggestion: 'Replace with: "Payment due within 30 days of delivery" with max 2 revision rounds.'
  },
  // HIGH SEVERITY - Rights Issues
  {
    pattern: /perpetual|forever|in\s+perpetuity|unlimited\s+time/i,
    severity: 'high',
    category: 'Usage Rights',
    issue: 'Perpetual/unlimited usage rights requested',
    suggestion: 'Limit to 12-24 months max. Perpetual rights should cost 3-5x the base rate.'
  },
  {
    pattern: /all\s+rights|full\s+rights|complete\s+ownership|transfer\s+of\s+ownership/i,
    severity: 'high',
    category: 'Usage Rights',
    issue: 'Full ownership transfer requested',
    suggestion: 'Never transfer ownership. Grant license instead. If required, charge 5-10x base rate.'
  },
  {
    pattern: /whitelisting|paid\s+ads?|advertising\s+rights|boosting/i,
    severity: 'high',
    category: 'Usage Rights',
    issue: 'Whitelisting/paid advertising rights included',
    suggestion: 'Whitelisting should be separate fee (+50-100% of base rate) with time limits.'
  },
  // HIGH SEVERITY - Exclusivity
  {
    pattern: /exclusiv(e|ity)\s*(for\s+)?(1\s+year|12\s+months|2\s+years)/i,
    severity: 'high',
    category: 'Exclusivity',
    issue: 'Long exclusivity period detected',
    suggestion: 'Max 3 months exclusivity for standard rates. Longer periods add 25-50% per month.'
  },
  {
    pattern: /non-?compete|cannot\s+work\s+with|prohibited\s+from/i,
    severity: 'high',
    category: 'Exclusivity',
    issue: 'Non-compete clause detected',
    suggestion: 'Limit scope to direct competitors only, max 30-90 days.'
  },
  // MEDIUM SEVERITY
  {
    pattern: /unlimited\s+revisions?|as\s+many\s+revisions?\s+as/i,
    severity: 'medium',
    category: 'Revisions',
    issue: 'Unlimited revisions requested',
    suggestion: 'Limit to 2-3 revision rounds. Additional revisions billed separately.'
  },
  {
    pattern: /net[- ]?45|45[- ]?days?/i,
    severity: 'medium',
    category: 'Payment Terms',
    issue: 'Payment terms of Net-45 are longer than standard',
    suggestion: 'Try to negotiate to Net-30. Acceptable but not ideal.'
  },
  {
    pattern: /cancel\s+at\s+any\s+time|terminate\s+without\s+(cause|notice)/i,
    severity: 'medium',
    category: 'Cancellation',
    issue: 'Brand can cancel without notice',
    suggestion: 'Add kill fee clause: 25-50% payment if cancelled after work begins.'
  },
  {
    pattern: /no\s+credit|without\s+attribution|remove\s+credit/i,
    severity: 'medium',
    category: 'Attribution',
    issue: 'No credit/attribution provided',
    suggestion: 'Request tagging/credit on brand posts. This is standard practice.'
  },
  {
    pattern: /indemnif(y|ication)|hold\s+harmless/i,
    severity: 'medium',
    category: 'Legal',
    issue: 'Indemnification clause present',
    suggestion: 'Limit to issues arising from YOUR content only, not brand\'s use of it.'
  },
  // LOW SEVERITY
  {
    pattern: /net[- ]?30|30[- ]?days?/i,
    severity: 'low',
    category: 'Payment Terms',
    issue: 'Net-30 payment terms',
    suggestion: 'This is industry standard. Consider requesting Net-15 for faster payment.'
  },
  {
    pattern: /6\s+months?|180\s+days?/i,
    severity: 'low',
    category: 'Usage Rights',
    issue: '6-month usage period',
    suggestion: 'Reasonable timeframe. Make sure it\'s clearly stated when the period starts.'
  },
  {
    pattern: /12\s+months?|1\s+year|365\s+days?/i,
    severity: 'low',
    category: 'Usage Rights',
    issue: '12-month usage period',
    suggestion: 'On the longer side. Consider charging 25-50% more than standard rate.'
  },
];

export default function ContractReviewScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [contractText, setContractText] = useState('');
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedFlags, setExpandedFlags] = useState<Set<number>>(new Set());

  const analyzeContract = async () => {
    if (!contractText.trim()) {
      Alert.alert('Required', 'Please paste your contract text.');
      return;
    }

    if (contractText.trim().length < 100) {
      Alert.alert('Too Short', 'Please paste more of the contract for accurate analysis.');
      return;
    }

    setAnalyzing(true);
    setExpandedFlags(new Set());

    try {
      const redFlags: RedFlag[] = [];

      for (const pattern of RED_FLAG_PATTERNS) {
        const match = contractText.match(pattern.pattern);
        if (match) {
          redFlags.push({
            severity: pattern.severity,
            category: pattern.category,
            issue: pattern.issue,
            suggestion: pattern.suggestion,
            originalText: match[0],
          });
        }
      }

      let score = 100;
      for (const flag of redFlags) {
        if (flag.severity === 'high') score -= 15;
        else if (flag.severity === 'medium') score -= 8;
        else score -= 3;
      }
      score = Math.max(0, Math.min(100, score));

      let summary = '';
      const highCount = redFlags.filter(f => f.severity === 'high').length;
      const mediumCount = redFlags.filter(f => f.severity === 'medium').length;

      if (highCount === 0 && mediumCount === 0) {
        summary = '✅ This contract looks good! No major red flags detected.';
      } else if (highCount >= 3) {
        summary = '🚨 CAUTION: Multiple serious issues found. Negotiate these terms before signing.';
      } else if (highCount >= 1) {
        summary = '⚠️ Some concerning terms detected. Review the red flags below.';
      } else {
        summary = '📝 A few things to review, but nothing too concerning.';
      }

      setResult({ score, redFlags, summary });

      const db = getDatabase();
      await db.runAsync(
        `INSERT INTO contract_reviews (id, contract_text, analysis_result, score, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [generateId(), contractText.substring(0, 1000), JSON.stringify(redFlags), score, getLocalDateString()]
      );
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to analyze contract. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleFlag = (index: number) => {
    setExpandedFlags(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'high': return { bg: colors.errorLight, color: colors.error, icon: 'alert-circle' };
      case 'medium': return { bg: colors.warningLight, color: colors.warning, icon: 'warning' };
      default: return { bg: colors.primaryLight, color: colors.primary, icon: 'information-circle' };
    }
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
          Contract Review
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
        {!result ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              📋 Review Your Contract
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Paste contract text to find red flags.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Contract Text <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Paste your contract or agreement here..."
                placeholderTextColor={colors.textMuted}
                value={contractText}
                onChangeText={setContractText}
                multiline
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.textMuted }]}>
                {contractText.length} characters
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.pasteButton, { borderColor: colors.primary }]}
              onPress={async () => {
                const text = await Clipboard.getStringAsync();
                if (text) setContractText(text);
              }}
            >
              <Ionicons name="clipboard-outline" size={18} color={colors.primary} />
              <Text style={[styles.pasteButtonText, { color: colors.primary }]}>
                Paste from Clipboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
              onPress={analyzeContract}
              disabled={analyzing}
              activeOpacity={0.8}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>
                {analyzing ? 'Analyzing...' : 'Analyze Contract'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>💡 Tips</Text>
              <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
                • Include payment terms{'\n'}
                • Include usage rights/licensing{'\n'}
                • Include exclusivity clauses{'\n'}
                • The more text, the better
              </Text>
            </View>
          </>
        ) : (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.scoreCard, { backgroundColor: getScoreColor(result.score) + '20' }]}>
              <View style={styles.scoreHeader}>
                <Text style={[styles.scoreLabel, { color: getScoreColor(result.score) }]}>
                  Contract Score
                </Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(result.score) }]}>
                  {result.score}/100
                </Text>
              </View>
              <Text style={[styles.summary, { color: colors.text }]}>
                {result.summary}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🚩 Issues Found ({result.redFlags.length})
            </Text>

            {result.redFlags.length === 0 ? (
              <View style={[styles.emptyFlags, { backgroundColor: colors.successLight }]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                <Text style={[styles.emptyFlagsText, { color: colors.success }]}>
                  No red flags detected!
                </Text>
              </View>
            ) : (
              result.redFlags.map((flag, index) => {
                const style = getSeverityStyle(flag.severity);
                const isExpanded = expandedFlags.has(index);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.flagCard, { backgroundColor: style.bg }]}
                    onPress={() => toggleFlag(index)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.flagHeader}>
                      <View style={styles.flagLeft}>
                        <Ionicons name={style.icon as any} size={20} color={style.color} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.flagCategory, { color: style.color }]}>
                            {flag.severity.toUpperCase()} • {flag.category}
                          </Text>
                          <Text style={[styles.flagIssue, { color: colors.text }]}>
                            {flag.issue}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={colors.textSecondary}
                      />
                    </View>
                    
                    {isExpanded && (
                      <View style={[styles.flagDetails, { borderTopColor: style.color + '30' }]}>
                        {flag.originalText && (
                          <View style={styles.originalTextBox}>
                            <Text style={[styles.originalTextLabel, { color: colors.textSecondary }]}>
                              Found:
                            </Text>
                            <Text style={[styles.originalText, { color: colors.text }]}>
                              "{flag.originalText}"
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.suggestionLabel, { color: style.color }]}>
                          💡 Suggestion:
                        </Text>
                        <Text style={[styles.suggestionText, { color: colors.text }]}>
                          {flag.suggestion}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={[styles.newReviewButton, { backgroundColor: colors.primary }]}
              onPress={() => { setResult(null); setContractText(''); }}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.newReviewButtonText}>New Review</Text>
            </TouchableOpacity>
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
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  textArea: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: fontSize.xs, marginTop: spacing.xs, textAlign: 'right' },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  pasteButtonText: { fontSize: fontSize.sm, fontWeight: '500' },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  analyzeButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
  tipsCard: { padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  tipsTitle: { fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.xs },
  tipsText: { fontSize: fontSize.sm, lineHeight: 22 },
  scoreCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.lg },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  scoreLabel: { fontSize: fontSize.md, fontWeight: '600' },
  scoreValue: { fontSize: fontSize.xxxl, fontWeight: '700' },
  summary: { fontSize: fontSize.md, lineHeight: 22 },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.md },
  emptyFlags: { padding: spacing.xl, borderRadius: borderRadius.lg, alignItems: 'center' },
  emptyFlagsText: { fontSize: fontSize.md, fontWeight: '600', marginTop: spacing.sm },
  flagCard: { padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  flagHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  flagLeft: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  flagCategory: { fontSize: fontSize.xs, fontWeight: '600' },
  flagIssue: { fontSize: fontSize.sm, fontWeight: '500', marginTop: 2 },
  flagDetails: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1 },
  originalTextBox: { marginBottom: spacing.sm },
  originalTextLabel: { fontSize: fontSize.xs },
  originalText: { fontSize: fontSize.sm, fontStyle: 'italic' },
  suggestionLabel: { fontSize: fontSize.sm, fontWeight: '600' },
  suggestionText: { fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  newReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  newReviewButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
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
