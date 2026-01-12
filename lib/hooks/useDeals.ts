// lib/hooks/useDeals.ts
import { useState, useEffect, useCallback } from 'react';
import { Deal, DealCreateInput, DealStage } from '@/types';
import {
  getAllDeals,
  createDeal,
  updateDeal,
  updateDealStage,
  deleteDeal,
} from '@/lib/storage/database';

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all deals
  const loadDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllDeals();
      setDeals(data);
    } catch (err) {
      setError('Failed to load deals');
      console.error('Load deals error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Add new deal (optimistic)
  const addDeal = useCallback(async (input: DealCreateInput): Promise<Deal | null> => {
    try {
      const newDeal = await createDeal(input);
      // Optimistic update
      setDeals(prev => [newDeal, ...prev]);
      return newDeal;
    } catch (err) {
      console.error('Add deal error:', err);
      setError('Failed to add deal');
      return null;
    }
  }, []);

  // Update deal (optimistic)
  const editDeal = useCallback(async (id: string, updates: Partial<Deal>): Promise<Deal | null> => {
    try {
      // Optimistic update
      setDeals(prev =>
        prev.map(deal =>
          deal.id === id ? { ...deal, ...updates, updatedAt: new Date().toISOString() } : deal
        )
      );
      
      const updated = await updateDeal(id, updates);
      if (!updated) {
        // Rollback on failure
        await loadDeals();
      }
      return updated;
    } catch (err) {
      console.error('Edit deal error:', err);
      setError('Failed to update deal');
      await loadDeals(); // Rollback
      return null;
    }
  }, [loadDeals]);

  // Move deal to new stage (optimistic)
  const moveDealToStage = useCallback(async (id: string, stage: DealStage): Promise<boolean> => {
    try {
      // Optimistic update
      setDeals(prev =>
        prev.map(deal =>
          deal.id === id ? { ...deal, stage, updatedAt: new Date().toISOString() } : deal
        )
      );
      
      const updated = await updateDealStage(id, stage);
      if (!updated) {
        await loadDeals(); // Rollback
        return false;
      }
      return true;
    } catch (err) {
      console.error('Move deal error:', err);
      await loadDeals(); // Rollback
      return false;
    }
  }, [loadDeals]);

  // Remove deal (optimistic)
  const removeDeal = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Optimistic update
      setDeals(prev => prev.filter(deal => deal.id !== id));
      
      const success = await deleteDeal(id);
      if (!success) {
        await loadDeals(); // Rollback
        return false;
      }
      return true;
    } catch (err) {
      console.error('Delete deal error:', err);
      await loadDeals(); // Rollback
      return false;
    }
  }, [loadDeals]);

  // Calculate totals
  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return {
    deals,
    loading,
    error,
    totalValue,
    loadDeals,
    addDeal,
    editDeal,
    moveDealToStage,
    removeDeal,
  };
}