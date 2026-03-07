// components/discover/BrandCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Brand, BRAND_CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface BrandCardProps {
  brand: Brand;
  onPress: (brand: Brand) => void;
  onFavorite: (id: string) => void;
  noteCount?: number;
}

export function BrandCard({ brand, onPress, onFavorite, noteCount }: BrandCardProps) {
  const { isDark } = useTheme();
  
  const categoryInfo = BRAND_CATEGORIES.find(c => c.value === brand.category);
  
  // Generate avatar color from brand name
  const getAvatarColor = (name: string) => {
    const hue = name.charCodeAt(0) * 10 % 360;
    return `hsl(${hue}, 60%, ${isDark ? '40%' : '60%'})`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark100 : colors.white },
      ]}
      onPress={() => onPress(brand)}
      activeOpacity={0.7}
      delayPressIn={50}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(brand.name) }]}>
        <Text variant="headingLg" style={{ color: colors.white }}>
          {brand.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text variant="headingSm" numberOfLines={1}>
          {brand.name}
        </Text>
        
        <View style={styles.categoryRow}>
          <Ionicons
            name={categoryInfo?.icon as any || 'grid-outline'}
            size={14}
            color={isDark ? colors.neutral400 : colors.neutral500}
          />
          <Text variant="bodySm" color="secondary" style={{ marginLeft: 4 }}>
            {categoryInfo?.label || 'Other'}
          </Text>
          {noteCount != null && noteCount > 0 && (
            <View style={styles.noteBadge}>
              <Ionicons name="document-text" size={11} color={isDark ? colors.neutral300 : colors.neutral500} />
              <Text variant="bodySm" color="secondary" style={{ marginLeft: 2, fontSize: 11 }}>
                {noteCount}
              </Text>
            </View>
          )}
        </View>

        {brand.description && (
          <Text variant="bodySm" color="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
            {brand.description}
          </Text>
        )}
      </View>

      {/* Favorite Button */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => onFavorite(brand.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={brand.isFavorite ? 'heart' : 'heart-outline'}
          size={22}
          color={brand.isFavorite ? colors.error500 : (isDark ? colors.neutral500 : colors.neutral400)}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
  },
  noteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
});