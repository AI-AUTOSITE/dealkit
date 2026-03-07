// app/(tabs)/messages.tsx - Inbox Screen with Reminder Functionality
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from '@/components/ui';
import { MessageBubble } from '@/components/messages';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { colors } from '@/design-tokens/primitives/colors';
import { useMessages } from '@/lib/hooks/useMessages';
import { useDeals } from '@/lib/hooks/useDeals';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

type MessageType = 'note' | 'task' | 'reminder';
type ViewMode = 'inbox' | 'notes';

interface ActionItem {
  id: string;
  type: 'deal' | 'payment';
  title: string;
  subtitle: string;
  urgency: 'high' | 'medium' | 'low';
  action: () => void;
}

export default function InboxScreen() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { messages, loading, loadMessages, addMessage, toggleComplete, removeMessage } = useMessages();
  const { deals } = useDeals();
  
  const [inputText, setInputText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('note');
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const inputRef = useRef<TextInput>(null);
  
  // Reminder date/time states
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  // Generate action items from deals
  const actionItems: ActionItem[] = React.useMemo(() => {
    const items: ActionItem[] = [];
    
    deals.forEach(deal => {
      const createdDate = new Date(deal.createdAt);
      const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if ((deal.stage === 'pitched' || deal.stage === 'negotiating') && daysSinceCreated > 7) {
        items.push({
          id: `deal-${deal.id}`,
          type: 'deal',
          title: deal.brandName,
          subtitle: `${deal.stage} for ${daysSinceCreated} days - Follow up?`,
          urgency: daysSinceCreated > 14 ? 'high' : 'medium',
          action: () => router.push(`/(modals)/deal/${deal.id}`),
        });
      }
      
      if (deal.stage === 'contracted' || deal.stage === 'in_progress') {
        items.push({
          id: `deal-progress-${deal.id}`,
          type: 'deal',
          title: deal.brandName,
          subtitle: `In progress - $${deal.value.toLocaleString()}`,
          urgency: 'low',
          action: () => router.push(`/(modals)/deal/${deal.id}`),
        });
      }
    });
    
    return items.sort((a, b) => {
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });
  }, [deals]);

  // Schedule a notification for the reminder
  const scheduleReminderNotification = async (content: string, date: Date): Promise<string | null> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Notifications Disabled', 'Please enable notifications to receive reminders.');
          return null;
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Reminder',
          body: content,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: date,
        },
      });

      return notificationId;
    } catch (error) {
      console.log('Could not schedule notification:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    // For reminders, require a date
    if (messageType === 'reminder' && !reminderDate) {
      showToast('Please select a reminder time', 'error');
      return;
    }

    Keyboard.dismiss();
    const text = inputText.trim();
    setInputText('');

    // Schedule notification if it's a reminder
    let notificationId: string | null = null;
    if (messageType === 'reminder' && reminderDate) {
      notificationId = await scheduleReminderNotification(text, reminderDate);
    }

    const result = await addMessage({
      content: text,
      type: messageType,
      reminderDate: reminderDate?.toISOString(),
    });

    if (result) {
      const successMessage = 
        messageType === 'task' ? 'Task added!' : 
        messageType === 'reminder' ? `Reminder set for ${formatReminderDate(reminderDate!)}` : 
        'Note added!';
      showToast(successMessage, 'success');
      
      // Reset reminder date after creating
      if (messageType === 'reminder') {
        setReminderDate(null);
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete this?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMessage(id);
            if (success) {
              showToast('Deleted', 'success');
            }
          },
        },
      ]
    );
  };

  const handleEmailAssistant = () => {
    router.push('/(modals)/email-assistant');
  };

  // Date picker handlers
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setTempDate(selectedDate);
        // Show time picker after date is selected on Android
        setTimeout(() => setShowTimePicker(true), 100);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        // Combine date and time
        const combinedDate = new Date(tempDate);
        combinedDate.setHours(selectedTime.getHours());
        combinedDate.setMinutes(selectedTime.getMinutes());
        setReminderDate(combinedDate);
      }
    } else {
      if (selectedTime) {
        setTempDate(selectedTime);
      }
    }
  };

  const handleIOSConfirm = () => {
    setReminderDate(tempDate);
    setShowDatePicker(false);
  };

  const openDatePicker = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Default to 30 min from now
    setTempDate(reminderDate || now);
    setShowDatePicker(true);
  };

  const clearReminderDate = () => {
    setReminderDate(null);
  };

  const formatReminderDate = (date: Date): string => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeStr}`;
    } else {
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      return `${dateStr} at ${timeStr}`;
    }
  };

  const renderActionItem = ({ item }: { item: ActionItem }) => (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: isDark ? colors.dark100 : colors.white },
      ]}
      onPress={item.action}
      activeOpacity={0.7}
    >
      <View style={[
        styles.urgencyIndicator,
        { 
          backgroundColor: 
            item.urgency === 'high' ? colors.error500 :
            item.urgency === 'medium' ? colors.warning500 :
            colors.primary500 
        }
      ]} />
      <View style={styles.actionContent}>
        <Text variant="bodyMd" style={{ fontWeight: '600' }}>{item.title}</Text>
        <Text variant="bodySm" color="secondary">{item.subtitle}</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? colors.neutral500 : colors.neutral400}
      />
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble
      message={item}
      onToggleComplete={handleToggleComplete}
      onDelete={handleDelete}
    />
  );

  const TypeButton = ({ type, icon }: { type: MessageType; icon: string }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        {
          backgroundColor: messageType === type
            ? (isDark ? colors.primary600 : colors.primary500)
            : (isDark ? colors.dark50 : colors.neutral100),
        },
      ]}
      onPress={() => {
        setMessageType(type);
        // Clear reminder date when switching away from reminder
        if (type !== 'reminder') {
          setReminderDate(null);
        }
      }}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={messageType === type ? colors.white : (isDark ? colors.neutral400 : colors.neutral600)}
      />
    </TouchableOpacity>
  );

  const highPriorityItems = actionItems.filter(i => i.urgency === 'high');
  const otherItems = actionItems.filter(i => i.urgency !== 'high');

  // Minimum date is now
  const minDate = new Date();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? colors.dark200 : colors.white },
      ]}
    >
      {/* Header Actions */}
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.aiButton,
              { backgroundColor: isDark ? colors.primary600 : colors.primary500 }
            ]}
            onPress={handleEmailAssistant}
          >
            <Ionicons name="mail-outline" size={16} color={colors.white} />
            <Text variant="bodySm" style={{ color: colors.white, fontWeight: '600' }}>
              Quick Email
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'inbox' && { backgroundColor: isDark ? colors.primary600 : colors.primary500 }
          ]}
          onPress={() => setViewMode('inbox')}
        >
          <Text 
            variant="bodySm" 
            style={{ 
              color: viewMode === 'inbox' ? colors.white : (isDark ? colors.neutral300 : colors.neutral600),
              fontWeight: '600' 
            }}
          >
            Action Items ({actionItems.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === 'notes' && { backgroundColor: isDark ? colors.primary600 : colors.primary500 }
          ]}
          onPress={() => setViewMode('notes')}
        >
          <Text 
            variant="bodySm" 
            style={{ 
              color: viewMode === 'notes' ? colors.white : (isDark ? colors.neutral300 : colors.neutral600),
              fontWeight: '600' 
            }}
          >
            Notes & Reminders ({messages.length})
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {viewMode === 'inbox' ? (
          // Action Items View
          actionItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.1)' }]}>
                <Ionicons name="checkmark-circle" size={40} color="#22C55E" />
              </View>
              <Text variant="headingMd" style={{ marginTop: 8 }}>
                All Caught Up! 🎉
              </Text>
              <Text variant="bodyMd" color="secondary" style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                No overdue payments or upcoming deadlines.{'\n'}You're on top of your game!
              </Text>
            </View>
          ) : (
            <FlatList
              data={[...highPriorityItems, ...otherItems]}
              renderItem={renderActionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                highPriorityItems.length > 0 ? (
                  <Text variant="headingSm" color="secondary" style={styles.sectionHeader}>
                    ⚡ NEEDS ATTENTION
                  </Text>
                ) : null
              }
            />
          )
        ) : (
          // Notes View
          <>
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.1)' }]}>
                  <Ionicons name="document-text" size={40} color={colors.primary500} />
                </View>
                <Text variant="headingMd" style={{ marginTop: 8 }}>
                  Your Notebook
                </Text>
                <Text variant="bodyMd" color="secondary" style={{ marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                  Jot down ideas, tasks, or reminders.{'\n'}Type below to add your first note!
                </Text>
              </View>
            ) : (
              <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            )}

            {/* Input Area */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: isDark ? colors.dark100 : colors.neutral50,
                  borderTopColor: isDark ? colors.neutral800 : colors.neutral200,
                },
              ]}
            >
              {/* Type Selector */}
              <View style={styles.typeSelector}>
                <TypeButton type="note" icon="document-text-outline" />
                <TypeButton type="task" icon="checkbox-outline" />
                <TypeButton type="reminder" icon="alarm-outline" />
                
                {/* Reminder Date Picker Button */}
                {messageType === 'reminder' && (
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      {
                        backgroundColor: reminderDate 
                          ? (isDark ? colors.primary600 : colors.primary100)
                          : (isDark ? colors.dark50 : colors.neutral100),
                        borderColor: reminderDate 
                          ? colors.primary500 
                          : (isDark ? colors.neutral700 : colors.neutral300),
                      },
                    ]}
                    onPress={openDatePicker}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={reminderDate ? colors.primary500 : (isDark ? colors.neutral400 : colors.neutral600)}
                    />
                    <Text 
                      variant="bodySm" 
                      style={{ 
                        color: reminderDate ? colors.primary500 : (isDark ? colors.neutral400 : colors.neutral600),
                        marginLeft: 4,
                      }}
                    >
                      {reminderDate ? formatReminderDate(reminderDate) : 'Set time'}
                    </Text>
                    {reminderDate && (
                      <TouchableOpacity 
                        onPress={clearReminderDate}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginLeft: 4 }}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.primary500} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Text Input */}
              <View style={styles.inputRow}>
                {/* Keyboard dismiss button */}
                <TouchableOpacity
                  style={[
                    styles.keyboardDismissButton,
                    { backgroundColor: isDark ? colors.dark50 : colors.neutral100 },
                  ]}
                  onPress={() => Keyboard.dismiss()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={isDark ? colors.neutral400 : colors.neutral500}
                  />
                </TouchableOpacity>
                <TextInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? colors.dark50 : colors.white,
                      borderColor: isDark ? colors.neutral700 : colors.neutral300,
                      color: isDark ? colors.neutral100 : colors.neutral900,
                    },
                  ]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder={
                    messageType === 'task' ? 'Add a task...' :
                    messageType === 'reminder' ? 'What to remind?' : 'Write a note...'
                  }
                  placeholderTextColor={isDark ? colors.neutral500 : colors.neutral400}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: (inputText.trim() && (messageType !== 'reminder' || reminderDate))
                        ? colors.primary500 
                        : (isDark ? colors.dark50 : colors.neutral200),
                    },
                  ]}
                  onPress={handleSend}
                  disabled={!inputText.trim() || (messageType === 'reminder' && !reminderDate)}
                >
                  <Ionicons
                    name="arrow-up"
                    size={20}
                    color={(inputText.trim() && (messageType !== 'reminder' || reminderDate))
                      ? colors.white 
                      : (isDark ? colors.neutral600 : colors.neutral400)}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Android Date Picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={minDate}
        />
      )}

      {/* Android Time Picker */}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* iOS Date/Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDark ? colors.dark200 : colors.white },
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text variant="bodyMd" color="secondary">Cancel</Text>
                </TouchableOpacity>
                <Text variant="headingSm">Set Reminder</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text variant="bodyMd" style={{ color: colors.primary500, fontWeight: '600' }}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setTempDate(date);
                }}
                minimumDate={minDate}
                style={styles.iosPicker}
                textColor={isDark ? colors.white : colors.neutral900}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  urgencyIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
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
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  typeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  keyboardDismissButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 16,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  iosPicker: {
    height: 200,
  },
});
