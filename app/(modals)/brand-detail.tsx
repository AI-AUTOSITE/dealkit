// app/modals/brand-detail.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Alert,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Brand, BrandCategory, BRAND_CATEGORIES } from '@/types';
import { getBrandById, updateBrand, deleteBrand, toggleBrandFavorite } from '@/lib/storage/database';
import { useToast } from '@/lib/toast';
import { Ionicons } from '@expo/vector-icons';

export default function BrandDetailModal() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BrandCategory>('other');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [email, setEmail] = useState('');

  // Load brand
  useEffect(() => {
    async function loadBrand() {
      if (!id) return;
      try {
        const data = await getBrandById(id);
        if (data) {
          setBrand(data);
          setName(data.name);
          setCategory(data.category);
          setDescription(data.description || '');
          setWebsite(data.website || '');
          setInstagram(data.instagram || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error('Load brand error:', err);
        showToast('Failed to load brand', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadBrand();
  }, [id]);

  const handleSave = async () => {
    if (!brand) return;
    
    try {
      setSaving(true);
      Keyboard.dismiss();
      
      await updateBrand(brand.id, {
        name: name.trim() || brand.name,
        category,
        description: description.trim() || undefined,
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        email: email.trim() || undefined,
      });
      
      showToast('Brand updated!', 'success');
      setIsEditing(false);
      
      // Reload brand
      const updated = await getBrandById(brand.id);
      if (updated) setBrand(updated);
    } catch (err) {
      console.error('Save brand error:', err);
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!brand) return;
    try {
      const updated = await toggleBrandFavorite(brand.id);
      if (updated) {
        setBrand(updated);
        showToast(updated.isFavorite ? 'Added to favorites!' : 'Removed from favorites', 'success');
      }
    } catch (err) {
      showToast('Failed to update', 'error');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Brand',
      'Are you sure you want to delete this brand?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!brand) return;
            try {
              await deleteBrand(brand.id);
              showToast('Brand deleted', 'success');
              router.back();
            } catch (err) {
              showToast('Failed to delete', 'error');
            }
          },
        },
      ]
    );
  };

  const openLink = (url: string) => {
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(fullUrl);
    }
  };

  const openInstagram = (handle: string) => {
    if (handle) {
      const username = handle.replace('@', '');
      Linking.openURL(`https://instagram.com/${username}`);
    }
  };

  const openEmail = (emailAddr: string) => {
    if (emailAddr) {
      Linking.openURL(`mailto:${emailAddr}`);
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

  // Generate avatar color
  const getAvatarColor = (brandName: string) => {
    const hue = brandName.charCodeAt(0) * 10 % 360;
    return `hsl(${hue}, 60%, ${isDark ? '40%' : '50%'})`;
  };

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

  if (!brand) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
        <View style={styles.loadingContainer}>
          <Text variant="bodyMd" color="secondary">Brand not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryInfo = BRAND_CATEGORIES.find(c => c.value === brand.category);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(brand.name) }]}>
              <Text variant="headingXl" style={{ color: colors.white }}>
                {brand.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            
            {/* Actions */}
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
                ]}
                onPress={handleToggleFavorite}
              >
                <Ionicons
                  name={brand.isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={brand.isFavorite ? colors.error500 : (isDark ? colors.neutral400 : colors.neutral600)}
                />
              </TouchableOpacity>
              {!isEditing && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <Ionicons
                    name="pencil"
                    size={18}
                    color={isDark ? colors.neutral400 : colors.neutral600}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <Text variant="headingXl" style={{ marginTop: 16 }}>
            {brand.name}
          </Text>
          
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Ionicons
              name={categoryInfo?.icon as any || 'grid-outline'}
              size={14}
              color={isDark ? colors.neutral400 : colors.neutral500}
            />
            <Text variant="bodySm" color="secondary" style={{ marginLeft: 6 }}>
              {categoryInfo?.label || 'Other'}
            </Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {isEditing ? (
            // Edit Mode
            <View>
              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Brand Name</Text>
                <TextInput
                  style={inputStyle}
                  value={name}
                  onChangeText={setName}
                  placeholder="Brand name"
                  placeholderTextColor={placeholderColor}
                />
              </View>

              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  <View style={styles.categorySelector}>
                    {BRAND_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={[
                          styles.categoryOption,
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
                          size={14}
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

              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Description</Text>
                <TextInput
                  style={[inputStyle, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="About this brand..."
                  placeholderTextColor={placeholderColor}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Website</Text>
                <TextInput
                  style={inputStyle}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://example.com"
                  placeholderTextColor={placeholderColor}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Instagram</Text>
                <TextInput
                  style={inputStyle}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="@username"
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.field}>
                <Text variant="headingSm" style={styles.label}>Contact Email</Text>
                <TextInput
                  style={inputStyle}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="contact@brand.com"
                  placeholderTextColor={placeholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.editActions}>
                <Button
                  variant="secondary"
                  onPress={() => {
                    setIsEditing(false);
                    Keyboard.dismiss();
                    // Reset form
                    setName(brand.name);
                    setCategory(brand.category);
                    setDescription(brand.description || '');
                    setWebsite(brand.website || '');
                    setInstagram(brand.instagram || '');
                    setEmail(brand.email || '');
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
            </View>
          ) : (
            // View Mode
            <View>
              {brand.description && (
                <View style={styles.detailSection}>
                  <Text variant="headingSm" style={styles.detailLabel}>About</Text>
                  <Text variant="bodyMd" color="secondary">{brand.description}</Text>
                </View>
              )}

              {/* Contact Links */}
              <View style={styles.linksSection}>
                {brand.website && (
                  <TouchableOpacity
                    style={[
                      styles.linkItem,
                      { backgroundColor: isDark ? colors.dark100 : colors.neutral50 },
                    ]}
                    onPress={() => openLink(brand.website!)}
                  >
                    <Ionicons name="globe-outline" size={20} color={colors.primary500} />
                    <Text variant="bodyMd" style={{ marginLeft: 12, color: colors.primary500 }}>
                      {brand.website}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {brand.instagram && (
                  <TouchableOpacity
                    style={[
                      styles.linkItem,
                      { backgroundColor: isDark ? colors.dark100 : colors.neutral50 },
                    ]}
                    onPress={() => openInstagram(brand.instagram!)}
                  >
                    <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                    <Text variant="bodyMd" style={{ marginLeft: 12 }}>
                      {brand.instagram}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {brand.email && (
                  <TouchableOpacity
                    style={[
                      styles.linkItem,
                      { backgroundColor: isDark ? colors.dark100 : colors.neutral50 },
                    ]}
                    onPress={() => openEmail(brand.email!)}
                  >
                    <Ionicons name="mail-outline" size={20} color={colors.primary500} />
                    <Text variant="bodyMd" style={{ marginLeft: 12 }}>
                      {brand.email}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error500} />
                <Text variant="bodyMd" style={{ color: colors.error500, marginLeft: 8 }}>
                  Delete Brand
                </Text>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    minHeight: 80,
    paddingTop: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    marginBottom: 8,
  },
  linksSection: {
    gap: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 32,
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