// app/modals/add-deal.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Text, Button, DatePicker } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { colors } from '@/design-tokens/primitives/colors';
import { DealCreateInput } from '@/types';
import { createDeal } from '@/lib/storage/database';
import { Ionicons } from '@expo/vector-icons';

export default function AddDealModal() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState<Date | null>(null);

  // Refs for focusing next input
  const titleRef = useRef<TextInput>(null);
  const valueRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!brandName.trim()) {
      showToast('Please enter a brand name', 'error');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      // Format deadline as ISO string if set
      const dueDate = deadline ? deadline.toISOString().split('T')[0] : undefined;

      const input: DealCreateInput = {
        brandName: brandName.trim(),
        title: title.trim() || `${brandName.trim()} Deal`,
        value: parseFloat(value) || 0,
        description: description.trim() || undefined,
        stage: 'pitched',
        dueDate,
      };

      const newDeal = await createDeal(input);

      showToast('Deal created!', 'success');
      router.back();
    } catch (err) {
      console.error('Create deal error:', err);
      showToast('Failed to create deal', 'error');
    } finally {
      setLoading(false);
    }
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

  // Minimum date is today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.flex}>
            {/* Header */}
            <View style={styles.header}>
              <Text variant="headingXl">New Deal</Text>
              <Text variant="bodyMd" color="secondary">
                Add a new brand collaboration
              </Text>
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Brand Name */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Brand Name *
                </Text>
                <TextInput
                  style={inputStyle}
                  value={brandName}
                  onChangeText={setBrandName}
                  placeholder="Nike, Apple, Starbucks..."
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => titleRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Deal Title */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Deal Title
                </Text>
                <TextInput
                  ref={titleRef}
                  style={inputStyle}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Summer Campaign, Product Review..."
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  onSubmitEditing={() => valueRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Value */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Deal Value ($)
                </Text>
                <TextInput
                  ref={valueRef}
                  style={inputStyle}
                  value={value}
                  onChangeText={setValue}
                  placeholder="2500"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Deadline - Calendar Picker */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Deadline
                </Text>
                <DatePicker
                  value={deadline}
                  onChange={setDeadline}
                  placeholder="Select deadline (optional)"
                  minimumDate={today}
                />
              </View>

              {/* Description */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Notes
                </Text>
                <TextInput
                  ref={descriptionRef}
                  style={[inputStyle, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add any notes about this deal..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={handleSave}
                />
              </View>

              {/* Create Button - Inside ScrollView */}
              <Button
                onPress={handleSave}
                disabled={!brandName.trim() || loading}
                loading={loading}
                fullWidth
                style={{ marginTop: 8, marginBottom: 80 }}
              >
                Create Deal
              </Button>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    padding: 16,
    gap: 4,
  },
  content: {
    padding: 16,
    paddingTop: 8,
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
