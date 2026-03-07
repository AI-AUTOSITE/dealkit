// app/(tabs)/discover.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Text, SkeletonCard } from '@/components/ui';
import { BrandCard, CategoryTabs } from '@/components/discover';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { useBrands, useRefresh } from '@/lib/hooks';
import { Brand, BrandCategory } from '@/types';
import { getAllBrandNoteCounts } from '@/lib/storage/database';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedListItem, useFabBounce } from '@/lib/animations';

export default function DiscoverScreen() {
  const { isDark } = useTheme();
  const { brands, loading, loadBrands, toggleFavorite } = useBrands();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | 'all' | 'favorites'>('all');
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());

  // Animations
  const { scale: fabScale } = useFabBounce();

  // Pull to refresh
  const { refreshing, onRefresh } = useRefresh(loadBrands);

  useFocusEffect(
    useCallback(() => {
      loadBrands();
      getAllBrandNoteCounts().then(setNoteCounts).catch(() => {});
    }, [loadBrands])
  );

  const filteredBrands = useMemo(() => {
    let result = brands;
    
    if (selectedCategory === 'favorites') {
      result = result.filter(b => b.isFavorite);
    } else if (selectedCategory !== 'all') {
      result = result.filter(b => b.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [brands, selectedCategory, searchQuery]);

  const handleBrandPress = (brand: Brand) => {
    router.push(`/(modals)/brand-detail?id=${brand.id}` as any);
  };

  const handleAddBrand = () => {
    router.push('/(modals)/add-brand' as any);
  };

  // Skeleton loading
  const renderSkeletons = () => (
    <View style={{ padding: 16 }}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={isDark ? colors.neutral400 : colors.neutral500}
          />
          <TextInput
            style={[
              styles.searchInput,
              { color: isDark ? colors.neutral100 : colors.neutral900 },
            ]}
            placeholder="Search brands..."
            placeholderTextColor={isDark ? colors.neutral500 : colors.neutral400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={isDark ? colors.neutral500 : colors.neutral400}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <CategoryTabs
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Brand List */}
      {loading && !refreshing && brands.length === 0 ? (
        renderSkeletons()
      ) : filteredBrands.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[
            styles.emptyIconCircle,
            { backgroundColor: selectedCategory === 'favorites'
              ? (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)')
              : (isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)')
            }
          ]}>
            <Ionicons
              name={selectedCategory === 'favorites' ? 'heart' : 'business'}
              size={40}
              color={selectedCategory === 'favorites' ? colors.error500 : colors.primary500}
            />
          </View>
          <Text variant="headingMd" style={{ marginTop: 8 }}>
            {selectedCategory === 'favorites'
              ? 'No favorites yet'
              : searchQuery || selectedCategory !== 'all'
              ? 'No brands found'
              : 'Build Your Brand Network'}
          </Text>
          <Text variant="bodyMd" color="secondary" style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
            {selectedCategory === 'favorites'
              ? 'Tap the heart icon on brands you love\nto find them quickly here.'
              : searchQuery || selectedCategory !== 'all'
              ? 'Try a different search or category.'
              : 'Save brand contacts, add notes,\nand keep track of every relationship.'}
          </Text>
          {selectedCategory === 'all' && !searchQuery && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary500 }]}
              onPress={() => router.push('/(modals)/add-brand')}
            >
              <Ionicons name="add" size={20} color={colors.white} />
              <Text style={styles.emptyButtonText}>Add First Brand</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedListItem index={index} screenKey="discover">
              <BrandCard
                brand={item}
                onPress={handleBrandPress}
                onFavorite={toggleFavorite}
                noteCount={noteCounts.get(item.id)}
              />
            </AnimatedListItem>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? colors.primary400 : colors.primary500}
              colors={[colors.primary500]}
            />
          }
        />
      )}

      {/* FAB */}
      <Animated.View style={[styles.fab, { backgroundColor: colors.primary500, transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={styles.fabInner}
          onPress={handleAddBrand}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 20,
    gap: 6,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});