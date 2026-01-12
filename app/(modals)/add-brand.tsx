// app/modals/add-brand.tsx
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
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { BrandCategory, BrandCreateInput, BRAND_CATEGORIES } from '@/types';
import { createBrand } from '@/lib/storage/database';
import { useToast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';

export default function AddBrandModal() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BrandCategory>('other');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');

  // Refs for keyboard navigation
  const descRef = useRef<TextInput>(null);
  const websiteRef = useRef<TextInput>(null);
  const instagramRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Brand name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      const input: BrandCreateInput = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        email: email.trim() || undefined,
      };

      await createBrand(input);
      showToast('Brand added!', 'success');
      router.back();
    } catch (err) {
      console.error('Create brand error:', err);
      showToast('Failed to add brand', 'error');
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

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="headingXl">Add Brand</Text>
            <Text variant="bodyMd" color="secondary">
              Save a brand to track
            </Text>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand Name */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Brand Name *
              </Text>
              <TextInput
                style={inputStyle}
                value={name}
                onChangeText={setName}
                placeholder="Nike, Apple, Starbucks..."
                placeholderTextColor={placeholderColor}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => descRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {BRAND_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        {
                          backgroundColor: category === cat.value
                            ? colors.primary500
                            : isDark ? colors.dark100 : colors.neutral100,
                        },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={16}
                        color={category === cat.value ? colors.white : (isDark ? colors.neutral400 : colors.neutral600)}
                      />
                      <Text
                        variant="bodySm"
                        style={{
                          marginLeft: 6,
                          color: category === cat.value ? colors.white : (isDark ? colors.neutral300 : colors.neutral700),
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Description
              </Text>
              <TextInput
                ref={descRef}
                style={[inputStyle, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What does this brand do?"
                placeholderTextColor={placeholderColor}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Website */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Website
              </Text>
              <TextInput
                ref={websiteRef}
                style={inputStyle}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                placeholderTextColor={placeholderColor}
                keyboardType="url"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => instagramRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Instagram */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Instagram
              </Text>
              <TextInput
                ref={instagramRef}
                style={inputStyle}
                value={instagram}
                onChangeText={setInstagram}
                placeholder="@username"
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>

            {/* Email */}
            <View style={styles.field}>
              <Text variant="headingSm" style={styles.label}>
                Contact Email
              </Text>
              <TextInput
                ref={emailRef}
                style={inputStyle}
                value={email}
                onChangeText={setEmail}
                placeholder="contact@brand.com"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>

            {/* Save Button inside ScrollView */}
            <View style={{ marginTop: 16, marginBottom: 80 }}>
              <Button
                onPress={handleSave}
                disabled={!name.trim() || loading}
                loading={loading}
                fullWidth
              >
                Add Brand
              </Button>
            </View>
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
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
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