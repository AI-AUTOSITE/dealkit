// app/modals/deal-detail.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Deal, DealStage } from '@/types';
import { getDealById, updateDeal, deleteDeal } from '@/lib/storage/database';
import { useToast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';

const STAGES: { value: DealStage; label: string; color: string }[] = [
  { value: 'pitched', label: 'Pitched', color: colors.neutral500 },
  { value: 'negotiating', label: 'Negotiating', color: colors.warning500 },
  { value: 'contracted', label: 'Contracted', color: colors.primary500 },
  { value: 'in_progress', label: 'In Progress', color: colors.info500 },
  { value: 'delivered', label: 'Delivered', color: colors.primary400 },
  { value: 'invoiced', label: 'Invoiced', color: colors.warning600 },
  { value: 'paid', label: 'Paid', color: colors.success500 },
];

export default function DealDetailModal() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<DealStage>('pitched');

  // Load deal
  useEffect(() => {
    async function loadDeal() {
      if (!id) return;
      try {
        const data = await getDealById(id);
        if (data) {
          setDeal(data);
          setTitle(data.title);
          setBrandName(data.brandName);
          setValue(data.value.toString());
          setDescription(data.description || '');
          setStage(data.stage);
        }
      } catch (err) {
        console.error('Load deal error:', err);
        showToast('Failed to load deal', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadDeal();
  }, [id]);

  const handleSave = async () => {
    if (!deal) return;
    
    try {
      setSaving(true);
      Keyboard.dismiss();
      
      await updateDeal(deal.id, {
        title: title.trim() || deal.title,
        brandName: brandName.trim() || deal.brandName,
        value: parseFloat(value) || 0,
        description: description.trim() || undefined,
        stage,
      });
      
      showToast('Deal updated!', 'success');
      setIsEditing(false);
      
      // Reload deal
      const updated = await getDealById(deal.id);
      if (updated) setDeal(updated);
    } catch (err) {
      console.error('Save deal error:', err);
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Deal',
      'Are you sure you want to delete this deal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!deal) return;
            try {
              await deleteDeal(deal.id);
              showToast('Deal deleted', 'success');
              router.back();
            } catch (err) {
              showToast('Failed to delete', 'error');
            }
          },
        },
      ]
    );
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDark ? colors.dark50 : colors.neutral100,
      borderColor: isDark ? colors.neutral700 : colors.neutral300,
      color: isDark ? colors.neutral100 : colors.neutral900,
    },
  ];

  const placeholderColor = isDark ? colors.neutral500 : colors.neutral400;

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text variant="bodyMd" color="secondary">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deal) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text variant="bodyMd" color="secondary">Deal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStage = STAGES.find(s => s.value === (isEditing ? stage : deal.stage));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text variant="headingXl" numberOfLines={1} style={{ flex: 1 }}>
                {isEditing ? 'Edit Deal' : deal.brandName}
              </Text>
              {!isEditing && (
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={isDark ? colors.neutral300 : colors.neutral600}
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Stage Badge */}
            <View
              style={[
                styles.stageBadge,
                { backgroundColor: currentStage?.color || colors.neutral500 },
              ]}
            >
              <Text variant="bodySm" style={{ color: colors.white, fontWeight: '600' }}>
                {currentStage?.label}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {isEditing ? (
              // Edit Mode
              <>
                <View style={styles.field}>
                  <Text variant="headingSm" style={styles.label}>Brand Name</Text>
                  <TextInput
                    style={inputStyle}
                    value={brandName}
                    onChangeText={setBrandName}
                    placeholder="Brand name"
                    placeholderTextColor={placeholderColor}
                  />
                </View>

                <View style={styles.field}>
                  <Text variant="headingSm" style={styles.label}>Deal Title</Text>
                  <TextInput
                    style={inputStyle}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Deal title"
                    placeholderTextColor={placeholderColor}
                  />
                </View>

                <View style={styles.field}>
                  <Text variant="headingSm" style={styles.label}>Value ($)</Text>
                  <TextInput
                    style={inputStyle}
                    value={value}
                    onChangeText={setValue}
                    placeholder="0"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.field}>
                  <Text variant="headingSm" style={styles.label}>Stage</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.stageSelector}>
                      {STAGES.map((s) => (
                        <TouchableOpacity
                          key={s.value}
                          style={[
                            styles.stageOption,
                            {
                              backgroundColor: stage === s.value ? s.color : (isDark ? colors.dark100 : colors.neutral100),
                              borderColor: s.color,
                            },
                          ]}
                          onPress={() => setStage(s.value)}
                        >
                          <Text
                            variant="bodySm"
                            style={{
                              color: stage === s.value ? colors.white : (isDark ? colors.neutral300 : colors.neutral700),
                            }}
                          >
                            {s.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.field}>
                  <Text variant="headingSm" style={styles.label}>Notes</Text>
                  <TextInput
                    style={[inputStyle, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Add notes..."
                    placeholderTextColor={placeholderColor}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.editActions}>
                  <Button
  variant="secondary"
  onPress={() => {
    setIsEditing(false);
    // Reset form
    setTitle(deal.title);
    setBrandName(deal.brandName);
    setValue(deal.value.toString());
    setDescription(deal.description || '');
    setStage(deal.stage);
  }}
  style={{ flex: 1 }}
>
  Cancel
</Button>
                  <Button
                    onPress={handleSave}
                    loading={saving}
                    disabled={saving}
                    style={{ flex: 1 }}
                  >
                    Save
                  </Button>
                </View>
              </>
            ) : (
              // View Mode
              <>
                {/* Value */}
                <View style={styles.valueCard}>
                  <Text variant="bodySm" color="secondary">Deal Value</Text>
                  <Text variant="headingXl" style={{ color: colors.success500, marginTop: 4 }}>
                    ${deal.value.toLocaleString()}
                  </Text>
                </View>

                {/* Details */}
                <View style={styles.detailSection}>
                  <Text variant="headingSm" style={styles.detailLabel}>Title</Text>
                  <Text variant="bodyMd">{deal.title}</Text>
                </View>

                {deal.description && (
                  <View style={styles.detailSection}>
                    <Text variant="headingSm" style={styles.detailLabel}>Notes</Text>
                    <Text variant="bodyMd" color="secondary">{deal.description}</Text>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text variant="headingSm" style={styles.detailLabel}>Created</Text>
                  <Text variant="bodyMd" color="secondary">
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error500} />
                  <Text variant="bodyMd" style={{ color: colors.error500, marginLeft: 8 }}>
                    Delete Deal
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          {/* Floating Close Button */}
          <TouchableOpacity
            style={[
              styles.floatingClose,
              { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close"
              size={24}
              color={isDark ? colors.neutral300 : colors.neutral600}
            />
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 16,
    gap: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  content: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  stageSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  stageOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  valueCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    marginBottom: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 24,
  },
  floatingClose: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});