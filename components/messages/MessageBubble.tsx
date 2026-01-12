// components/messages/MessageBubble.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface MessageBubbleProps {
  message: Message;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPress?: (message: Message) => void;
}

const TYPE_CONFIG = {
  note: { icon: 'document-text-outline', color: colors.primary500 },
  reminder: { icon: 'alarm-outline', color: colors.warning500 },
  task: { icon: 'checkbox-outline', color: colors.success500 },
};

export function MessageBubble({
  message,
  onToggleComplete,
  onDelete,
  onPress,
}: MessageBubbleProps) {
  const { isDark } = useTheme();
  const config = TYPE_CONFIG[message.type];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatReminderDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const isPast = date < now;

    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    let prefix = '';
    if (isPast) {
      prefix = '⏰ Was due ';
    } else {
      prefix = '🔔 ';
    }

    if (isToday) {
      return `${prefix}Today at ${timeStr}`;
    } else if (isTomorrow) {
      return `${prefix}Tomorrow at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${prefix}${dateStr} at ${timeStr}`;
    }
  };

  const isReminderPast = message.reminderDate && new Date(message.reminderDate) < new Date();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.dark100 : colors.white,
          borderColor: isDark ? colors.neutral800 : colors.neutral200,
          opacity: message.isCompleted ? 0.6 : 1,
        },
      ]}
      onPress={() => onPress?.(message)}
      activeOpacity={0.7}
      delayPressIn={75}
    >
      {/* Left: Type Icon or Checkbox */}
      {message.type === 'task' ? (
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: message.isCompleted ? colors.success500 : isDark ? colors.neutral600 : colors.neutral400,
              backgroundColor: message.isCompleted ? colors.success500 : 'transparent',
            },
          ]}
          onPress={() => onToggleComplete?.(message.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {message.isCompleted && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </TouchableOpacity>
      ) : (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.color + '20' },
          ]}
        >
          <Ionicons name={config.icon as any} size={16} color={config.color} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text
          variant="bodyMd"
          style={{
            textDecorationLine: message.isCompleted ? 'line-through' : 'none',
          }}
          numberOfLines={3}
        >
          {message.content}
        </Text>
        
        {/* Reminder Date */}
        {message.type === 'reminder' && message.reminderDate && (
          <View style={[
            styles.reminderBadge,
            { 
              backgroundColor: isReminderPast 
                ? (isDark ? colors.error500 + '20' : colors.error100) 
                : (isDark ? colors.warning500 + '20' : colors.warning100) 
            }
          ]}>
            <Text 
              variant="caption" 
              style={{ 
                color: isReminderPast ? colors.error500 : colors.warning600,
                fontWeight: '500',
              }}
            >
              {formatReminderDate(message.reminderDate)}
            </Text>
          </View>
        )}
        
        <View style={styles.meta}>
          {message.brandName && (
            <>
              <Text variant="caption" color="secondary">
                {message.brandName}
              </Text>
              <Text variant="caption" color="tertiary"> · </Text>
            </>
          )}
          <Text variant="caption" color="tertiary">
            {formatTime(message.createdAt)}
          </Text>
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete?.(message.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="close"
          size={18}
          color={isDark ? colors.neutral500 : colors.neutral400}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  reminderBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
