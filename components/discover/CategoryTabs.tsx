// components/discover/CategoryTabs.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { BrandCategory, BRAND_CATEGORIES } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface CategoryTabsProps {
  selected: BrandCategory | 'all' | 'favorites';
  onSelect: (category: BrandCategory | 'all' | 'favorites') => void;
}

export function CategoryTabs({ selected, onSelect }: CategoryTabsProps) {
  const { isDark } = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);

  const allCategories = [
    { value: 'all' as const, label: 'All', icon: 'apps-outline' },
    { value: 'favorites' as const, label: 'Favorites', icon: 'heart' },
    ...BRAND_CATEGORIES,
  ];

  // 4カテゴリで1ドット
  const totalDots = Math.ceil(allCategories.length / 4);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      const progress = contentOffset.x / maxScroll;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    }
  };

  // 現在のドットを計算
  const activeDotIndex = Math.round(scrollProgress * (totalDots - 1));

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {allCategories.map((cat, index) => {
          const isSelected = selected === cat.value;
          const isFavorites = cat.value === 'favorites';
          const isLast = index === allCategories.length - 1;
          
          return (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.tab,
                {
                  backgroundColor: isSelected
                    ? (isFavorites ? colors.error500 : colors.primary500)
                    : isDark ? colors.dark100 : colors.neutral100,
                  marginRight: isLast ? 16 : 8,
                },
              ]}
              onPress={() => onSelect(cat.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={cat.icon as any}
                size={16}
                color={isSelected ? colors.white : (isDark ? colors.neutral400 : colors.neutral600)}
              />
              <Text
                variant="bodySm"
                style={{
                  marginLeft: 6,
                  color: isSelected ? colors.white : (isDark ? colors.neutral300 : colors.neutral700),
                  fontWeight: isSelected ? '600' : '400',
                }}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Dot Indicators */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalDots }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeDotIndex
                  ? (isDark ? colors.primary400 : colors.primary500)
                  : (isDark ? colors.neutral700 : colors.neutral300),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // シンプルに
  },
  container: {
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    height: 36,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});