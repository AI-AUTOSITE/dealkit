// lib/hooks/useBrands.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Brand, BrandCreateInput, BrandCategory } from '@/types';
import {
  getAllBrands,
  createBrand,
  updateBrand,
  toggleBrandFavorite,
  deleteBrand,
} from '@/lib/storage/database';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const loadBrands = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);
      const data = await getAllBrands();
      setBrands(data);
    } catch (err) {
      setError('Failed to load brands');
      console.error('Load brands error:', err);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const addBrand = useCallback(async (input: BrandCreateInput): Promise<Brand | null> => {
    try {
      const newBrand = await createBrand(input);
      setBrands(prev => [newBrand, ...prev]);
      return newBrand;
    } catch (err) {
      console.error('Add brand error:', err);
      setError('Failed to add brand');
      return null;
    }
  }, []);

  const editBrand = useCallback(async (id: string, updates: Partial<Brand>): Promise<Brand | null> => {
    try {
      setBrands(prev =>
        prev.map(brand =>
          brand.id === id ? { ...brand, ...updates, updatedAt: new Date().toISOString() } : brand
        )
      );
      
      const updated = await updateBrand(id, updates);
      if (!updated) {
        await loadBrands();
      }
      return updated;
    } catch (err) {
      console.error('Edit brand error:', err);
      await loadBrands();
      return null;
    }
  }, [loadBrands]);

  const toggleFavorite = useCallback(async (id: string): Promise<boolean> => {
    try {
      setBrands(prev =>
        prev.map(brand =>
          brand.id === id ? { ...brand, isFavorite: !brand.isFavorite } : brand
        )
      );
      
      const updated = await toggleBrandFavorite(id);
      if (!updated) {
        await loadBrands();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Toggle favorite error:', err);
      await loadBrands();
      return false;
    }
  }, [loadBrands]);

  const removeBrand = useCallback(async (id: string): Promise<boolean> => {
    try {
      setBrands(prev => prev.filter(brand => brand.id !== id));
      
      const success = await deleteBrand(id);
      if (!success) {
        await loadBrands();
        return false;
      }
      return true;
    } catch (err) {
      console.error('Delete brand error:', err);
      await loadBrands();
      return false;
    }
  }, [loadBrands]);

  // Filter helpers
  const filterByCategory = useCallback((category: BrandCategory | 'all') => {
    if (category === 'all') return brands;
    return brands.filter(b => b.category === category);
  }, [brands]);

  const favorites = brands.filter(b => b.isFavorite);

  return {
    brands,
    loading,
    error,
    favorites,
    loadBrands,
    addBrand,
    editBrand,
    toggleFavorite,
    removeBrand,
    filterByCategory,
  };
}