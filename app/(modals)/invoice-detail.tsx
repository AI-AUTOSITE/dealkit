// app/modals/invoice-detail.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Invoice, InvoiceStatus } from '@/types';
import { getInvoiceById, updateInvoice, markInvoicePaid, deleteInvoice } from '@/lib/storage/database';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/lib/toast';


const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: colors.neutral500 },
  sent: { label: 'Sent', color: colors.info500 },
  paid: { label: 'Paid', color: colors.success500 },
  overdue: { label: 'Overdue', color: colors.error500 },
};

export default function InvoiceDetailModal() {
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function loadInvoice() {
      if (!id) return;
      try {
        const data = await getInvoiceById(id);
        setInvoice(data);
      } catch (err) {
        console.error('Load invoice error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  const handleStatusChange = async (newStatus: InvoiceStatus) => {
  if (!invoice) return;

  try {
    if (newStatus === 'paid') {
      await markInvoicePaid(invoice.id);
      showToast('Marked as paid!', 'success');
    } else {
      await updateInvoice(invoice.id, { status: newStatus });
      showToast(`Status changed to ${newStatus}`, 'success');
    }
    const updated = await getInvoiceById(invoice.id);
    if (updated) setInvoice(updated);
  } catch (err) {
    console.error('Status change error:', err);
    showToast('Failed to update status', 'error');
  }
};

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
  if (!invoice) return;
  try {
    await deleteInvoice(invoice.id);
    showToast('Invoice deleted', 'success');
    router.back();
  } catch (err) {
    console.error('Delete invoice error:', err);
    showToast('Failed to delete invoice', 'error');
  }
},
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
        <Text variant="bodyMd" color="secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: isDark ? colors.dark200 : colors.white },
        ]}
      >
        <Text variant="bodyMd" color="secondary">Invoice not found</Text>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIG[invoice.status];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusConfig.color + '20' },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: statusConfig.color }]}
          />
          <Text variant="caption" style={{ color: statusConfig.color }}>
            {statusConfig.label}
          </Text>
        </View>
        <Text variant="caption" color="secondary" style={{ marginTop: 8 }}>
          Created {new Date(invoice.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
      >
        <Text variant="headingXl">{invoice.brandName}</Text>

        <Card style={styles.amountCard}>
          <Text variant="caption" color="secondary">Amount</Text>
          <Text variant="display" style={{ color: statusConfig.color }}>
            ${invoice.amount.toLocaleString()}
          </Text>
          {invoice.status === 'paid' && invoice.paidAmount > 0 && (
            <Text variant="caption" color="secondary" style={{ marginTop: 4 }}>
              Paid: ${invoice.paidAmount.toLocaleString()}
            </Text>
          )}
        </Card>

        {invoice.dueDate && (
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={isDark ? colors.neutral400 : colors.neutral500}
            />
            <Text variant="bodyMd" color="secondary" style={{ marginLeft: 8 }}>
              Due: {new Date(invoice.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {invoice.paidDate && (
          <View style={styles.infoRow}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.success500}
            />
            <Text variant="bodyMd" style={{ marginLeft: 8, color: colors.success500 }}>
              Paid: {new Date(invoice.paidDate).toLocaleDateString()}
            </Text>
          </View>
        )}

        {invoice.description && (
          <View style={styles.section}>
            <Text variant="headingSm" style={styles.sectionTitle}>Description</Text>
            <Text variant="bodyMd" color="secondary">{invoice.description}</Text>
          </View>
        )}

        {/* Status Actions */}
        {invoice.status !== 'paid' && (
          <View style={styles.section}>
            <Text variant="headingSm" style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              {invoice.status === 'draft' && (
                <Button
                  variant="secondary"
                  onPress={() => handleStatusChange('sent')}
                  style={{ flex: 1 }}
                >
                  Mark as Sent
                </Button>
              )}
              <Button
                onPress={() => handleStatusChange('paid')}
                style={{ flex: 1, marginLeft: invoice.status === 'draft' ? 12 : 0 }}
              >
                Mark as Paid
              </Button>
            </View>
          </View>
        )}

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={colors.error500} />
          <Text variant="bodyMd" style={{ color: colors.error500, marginLeft: 8 }}>
            Delete Invoice
          </Text>
        </TouchableOpacity>
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  content: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  amountCard: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    padding: 12,
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