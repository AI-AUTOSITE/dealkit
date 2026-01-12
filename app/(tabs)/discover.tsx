// app/(tabs)/discover.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Text, SkeletonCard } from '@/components/ui';
import { BrandCard, CategoryTabs } from '@/components/discover';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { useBrands, useRefresh } from '@/lib/hooks';
import { Brand, BrandCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function DiscoverScreen() {
  const { isDark } = useTheme();
  const { brands, loading, loadBrands, toggleFavorite } = useBrands();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | 'all' | 'favorites'>('all');

  // Pull to refresh
  const { refreshing, onRefresh } = useRefresh(loadBrands);

  useFocusEffect(
    useCallback(() => {
      loadBrands();
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
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
      edges={['top']}
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
      {loading && !refreshing ? (
        renderSkeletons()
      ) : filteredBrands.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={selectedCategory === 'favorites' ? 'heart-outline' : 'business-outline'}
            size={64}
            color={isDark ? colors.neutral600 : colors.neutral300}
          />
          <Text variant="headingMd" style={{ marginTop: 16 }}>
            {selectedCategory === 'favorites'
              ? 'No favorites yet'
              : searchQuery || selectedCategory !== 'all'
              ? 'No brands found'
              : 'No brands yet'}
          </Text>
          <Text variant="bodyMd" color="secondary" style={{ marginTop: 8, textAlign: 'center' }}>
            {selectedCategory === 'favorites'
              ? 'Tap the heart icon on brands you like'
              : searchQuery || selectedCategory !== 'all'
              ? 'Try a different search or category'
              : 'Tap + to add your first brand'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBrands}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BrandCard
              brand={item}
              onPress={handleBrandPress}
              onFavorite={toggleFavorite}
            />
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
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary500 }]}
        onPress={handleAddBrand}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
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
});