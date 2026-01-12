// lib/hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceCreateInput } from '@/types';
import {
  getAllInvoices,
  createInvoice,
  updateInvoice,
  markInvoicePaid,
  deleteInvoice,
  getInvoiceStats,
} from '@/lib/storage/database';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalEarned: 0,
    outstanding: 0,
    overdue: 0,
    thisMonth: 0,
    invoiceCount: 0,
  });

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, statsData] = await Promise.all([
        getAllInvoices(),
        getInvoiceStats(),
      ]);
      setInvoices(data);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Load invoices error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const addInvoice = useCallback(async (input: InvoiceCreateInput): Promise<Invoice | null> => {
    try {
      const newInvoice = await createInvoice(input);
      setInvoices(prev => [newInvoice, ...prev]);
      // Refresh stats
      const statsData = await getInvoiceStats();
      setStats(statsData);
      return newInvoice;
    } catch (err) {
      console.error('Add invoice error:', err);
      setError('Failed to add invoice');
      return null;
    }
  }, []);

  const editInvoice = useCallback(async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === id ? { ...inv, ...updates, updatedAt: new Date().toISOString() } : inv
        )
      );
      
      const updated = await updateInvoice(id, updates);
      if (!updated) {
        await loadInvoices();
      } else {
        const statsData = await getInvoiceStats();
        setStats(statsData);
      }
      return updated;
    } catch (err) {
      console.error('Edit invoice error:', err);
      await loadInvoices();
      return null;
    }
  }, [loadInvoices]);

  const payInvoice = useCallback(async (id: string, amount?: number): Promise<boolean> => {
    try {
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === id
            ? { ...inv, status: 'paid' as const, paidDate: new Date().toISOString(), paidAmount: amount ?? inv.amount }
            : inv
        )
      );
      
      const updated = await markInvoicePaid(id, amount);
      if (updated) {
        const statsData = await getInvoiceStats();
        setStats(statsData);
        return true;
      }
      await loadInvoices();
      return false;
    } catch (err) {
      console.error('Pay invoice error:', err);
      await loadInvoices();
      return false;
    }
  }, [loadInvoices]);

  const removeInvoice = useCallback(async (id: string): Promise<boolean> => {
    try {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      
      const success = await deleteInvoice(id);
      if (success) {
        const statsData = await getInvoiceStats();
        setStats(statsData);
        return true;
      }
      await loadInvoices();
      return false;
    } catch (err) {
      console.error('Delete invoice error:', err);
      await loadInvoices();
      return false;
    }
  }, [loadInvoices]);

  return {
    invoices,
    loading,
    error,
    stats,
    loadInvoices,
    addInvoice,
    editInvoice,
    payInvoice,
    removeInvoice,
  };
}