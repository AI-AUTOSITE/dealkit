// app/modals/add-invoice.tsx
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
import { InvoiceCreateInput } from '@/types';
import { createInvoice } from '@/lib/storage/database';
import { Ionicons } from '@expo/vector-icons';

export default function AddInvoiceModal() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);

  // Refs for focusing next input
  const amountRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!brandName.trim() || !amount.trim()) {
      showToast('Please fill in brand name and amount', 'error');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      // Format due date as local date string (YYYY-MM-DD)
      let dueDateStr: string | undefined;
      if (dueDate) {
        const y = dueDate.getFullYear();
        const m = String(dueDate.getMonth() + 1).padStart(2, '0');
        const d = String(dueDate.getDate()).padStart(2, '0');
        dueDateStr = `${y}-${m}-${d}`;
      }

      const input: InvoiceCreateInput = {
        brandName: brandName.trim(),
        amount: parseFloat(amount) || 0,
        description: description.trim() || undefined,
        dueDate: dueDateStr,
        status: 'draft',
      };

      const newInvoice = await createInvoice(input);

      showToast('Payment created!', 'success');
      router.back();
    } catch (err) {
      console.error('Create invoice error:', err);
      showToast('Failed to create payment', 'error');
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
              <Text variant="headingXl">New Payment</Text>
              <Text variant="bodyMd" color="secondary">
                Track a payment from a brand
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
                  onSubmitEditing={() => amountRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Amount */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Amount ($) *
                </Text>
                <TextInput
                  ref={amountRef}
                  style={inputStyle}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="2500"
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>

              {/* Due Date - Calendar Picker */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Due Date
                </Text>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select due date (optional)"
                  minimumDate={today}
                />
              </View>

              {/* Description */}
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>
                  Description
                </Text>
                <TextInput
                  ref={descriptionRef}
                  style={[inputStyle, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Campaign name, deliverables..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={handleSave}
                />
              </View>

              {/* Create Button - Inside ScrollView */}
              <Button
                onPress={handleSave}
                disabled={!brandName.trim() || !amount.trim() || loading}
                loading={loading}
                fullWidth
                style={{ marginTop: 8, marginBottom: 80 }}
              >
                Create Payment
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
    minHeight: 80,
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
