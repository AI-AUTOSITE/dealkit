import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, fontSize, shadows } from '../../../lib/theme';
import { getDatabase, getLocalDateString } from '../../../lib/storage/database';
import { Platform as PlatformType, Niche, UserProfile } from '../../../types';

const PLATFORMS: { key: PlatformType; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'Twitter' },
];

const NICHES: { key: Niche; label: string }[] = [
  { key: 'finance', label: '💰 Finance' },
  { key: 'crypto', label: '🪙 Crypto' },
  { key: 'tech', label: '💻 Tech' },
  { key: 'legal', label: '⚖️ Legal' },
  { key: 'healthcare', label: '🏥 Healthcare' },
  { key: 'real_estate', label: '🏠 Real Estate' },
  { key: 'fashion', label: '👗 Fashion' },
  { key: 'beauty', label: '💄 Beauty' },
  { key: 'fitness', label: '💪 Fitness' },
  { key: 'food', label: '🍔 Food' },
  { key: 'travel', label: '✈️ Travel' },
  { key: 'gaming', label: '🎮 Gaming' },
  { key: 'music', label: '🎵 Music' },
  { key: 'photography', label: '📷 Photography' },
  { key: 'parenting', label: '👶 Parenting' },
  { key: 'pets', label: '🐕 Pets' },
  { key: 'lifestyle', label: '🌟 Lifestyle' },
  { key: 'education', label: '📚 Education' },
  { key: 'entertainment', label: '🎬 Entertainment' },
  { key: 'sports', label: '⚽ Sports' },
  { key: 'diy', label: '🔧 DIY' },
  { key: 'automotive', label: '🚗 Automotive' },
  { key: 'home_decor', label: '🏡 Home Decor' },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('instagram');
  const [handle, setHandle] = useState('');
  const [followers, setFollowers] = useState('');
  const [engagementRate, setEngagementRate] = useState('');
  const [niche, setNiche] = useState<Niche>('lifestyle');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const db = getDatabase();
      const profile = await db.getFirstAsync<UserProfile>(
        'SELECT * FROM user_profile WHERE id = 1'
      );
      if (profile) {
        setDisplayName(profile.display_name || '');
        setPlatform(profile.primary_platform || 'instagram');
        setHandle(profile.handle || '');
        setFollowers(profile.followers?.toString() || '');
        setEngagementRate(profile.engagement_rate?.toString() || '');
        setNiche(profile.niche || 'lifestyle');
        setEmail(profile.email || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = getDatabase();
      const now = getLocalDateString();

      // Check if profile exists
      const exists = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_profile WHERE id = 1'
      );

      if (exists && exists.count > 0) {
        await db.runAsync(
          `UPDATE user_profile SET
            display_name = ?, primary_platform = ?, handle = ?, followers = ?,
            engagement_rate = ?, niche = ?, email = ?, updated_at = ?
          WHERE id = 1`,
          [
            displayName.trim() || null,
            platform,
            handle.trim() || null,
            followers ? Number(followers) : null,
            engagementRate ? Number(engagementRate) : null,
            niche,
            email.trim() || null,
            now,
          ]
        );
      } else {
        await db.runAsync(
          `INSERT INTO user_profile (
            id, display_name, primary_platform, handle, followers,
            engagement_rate, niche, email, created_at, updated_at
          ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            displayName.trim() || null,
            platform,
            handle.trim() || null,
            followers ? Number(followers) : null,
            engagementRate ? Number(engagementRate) : null,
            niche,
            email.trim() || null,
            now,
            now,
          ]
        );
      }

      Alert.alert('Saved!', 'Your profile has been updated.');
      router.back();
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Edit Profile
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            👤 Your Profile
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Used for rate calculations and emails.
          </Text>

          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="Your Name"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          {/* Primary Platform */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Primary Platform</Text>
            <View style={styles.segmentContainer}>
              {PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.segment,
                    platform === p.key && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setPlatform(p.key)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: platform === p.key ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Handle */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Handle</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="@yourhandle"
              placeholderTextColor={colors.textMuted}
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
            />
          </View>

          {/* Followers */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Followers</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="45000"
              placeholderTextColor={colors.textMuted}
              value={followers}
              onChangeText={setFollowers}
              keyboardType="numeric"
            />
          </View>

          {/* Engagement Rate */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Engagement Rate (%)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="4.2"
              placeholderTextColor={colors.textMuted}
              value={engagementRate}
              onChangeText={setEngagementRate}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Niche */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Niche</Text>
            <View style={styles.nichesContainer}>
              {NICHES.map((n) => (
                <TouchableOpacity
                  key={n.key}
                  style={[
                    styles.nicheChip,
                    { backgroundColor: colors.card },
                    niche === n.key && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setNiche(n.key)}
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

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email (for reminders)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : '💾 Save Profile'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Close Button */}
      <TouchableOpacity
        style={[styles.floatingClose, { backgroundColor: colors.card }, shadows.lg]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </TouchableOpacity>
    </SafeAreaView>
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
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 120 },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: '700' },
  sectionSubtitle: { fontSize: fontSize.md, marginTop: spacing.xs, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '500', marginBottom: spacing.xs },
  input: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
  },
  segmentContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  segmentText: { fontSize: fontSize.sm, fontWeight: '500' },
  nichesContainer: {
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
  saveButton: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: fontSize.md, fontWeight: '600' },
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
