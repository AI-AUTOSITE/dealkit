// components/wallet/InvoiceCard.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Invoice, InvoiceStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: colors.neutral500, icon: 'document-outline' },
  sent: { label: 'Sent', color: colors.info500, icon: 'send-outline' },
  paid: { label: 'Paid', color: colors.success500, icon: 'checkmark-circle' },
  overdue: { label: 'Overdue', color: colors.error500, icon: 'alert-circle' },
};

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
  const { isDark } = useTheme();
  const statusConfig = STATUS_CONFIG[invoice.status];

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark100 : colors.white,
          borderColor: isDark ? colors.neutral800 : colors.neutral200,
        },
      ]}
      onPress={() => onPress?.(invoice)}
      activeOpacity={0.7}
      delayPressIn={75}
    >
      <View style={styles.left}>
        {/* Brand Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: isDark ? colors.dark50 : colors.neutral100 },
          ]}
        >
          <Text variant="headingSm" color="secondary">
            {invoice.brandName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text variant="headingSm" numberOfLines={1}>
            {invoice.brandName}
          </Text>
          <View style={styles.statusRow}>
            <Ionicons
              name={statusConfig.icon as any}
              size={14}
              color={statusConfig.color}
            />
            <Text
              variant="caption"
              style={{ color: statusConfig.color, marginLeft: 4 }}
            >
              {statusConfig.label}
            </Text>
            {invoice.dueDate && invoice.status !== 'paid' && (
              <Text variant="caption" color="tertiary" style={{ marginLeft: 8 }}>
                Due {formatDate(invoice.dueDate)}
              </Text>
            )}
            {invoice.paidDate && invoice.status === 'paid' && (
              <Text variant="caption" color="tertiary" style={{ marginLeft: 8 }}>
                Paid {formatDate(invoice.paidDate)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.right}>
        <Text
          variant="headingMd"
          style={{
            color: invoice.status === 'paid' ? colors.success500 : isDark ? colors.neutral100 : colors.neutral900,
          }}
        >
          ${invoice.amount.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  right: {
    marginLeft: 12,
  },
});