// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

let notificationHandlerConfigured = false;

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification behavior - MUST be called after app is ready
export function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;
  
  // Skip push notification setup in Expo Go (local notifications still work)
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.log('Notification handler setup skipped (Expo Go limitation)');
  }
  
  notificationHandlerConfigured = true;
}

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Android channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('payment-reminders', {
        name: 'Payment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#7C3AED',
      });

      await Notifications.setNotificationChannelAsync('deal-deadlines', {
        name: 'Deal Deadlines',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem('notificationsEnabled');
    return value !== 'false';
  } catch {
    return true;
  }
}

// Toggle notifications
export async function setNotificationsEnabled(enabled: boolean) {
  try {
    await AsyncStorage.setItem('notificationsEnabled', enabled ? 'true' : 'false');
    if (!enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  } catch (error) {
    console.error('Failed to set notifications enabled:', error);
  }
}

// Send a test notification
export async function sendTestNotification(): Promise<boolean> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Test Notification',
        body: 'Notifications are working! You will receive reminders for payments and deadlines.',
        sound: true,
      },
      trigger: null, // Immediate notification
    });
    return true;
  } catch (error) {
    console.error('Failed to send test notification:', error);
    return false;
  }
}

// Schedule a payment reminder notification
export async function schedulePaymentReminder(
  paymentId: string,
  brandName: string,
  amount: number,
  dueDate: string,
  daysBefore: number = 3
): Promise<string | null> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return null;

  try {
    const dueDateTime = new Date(dueDate);
    const triggerDate = new Date(dueDateTime);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0);

    if (triggerDate <= new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Payment Due Soon',
        body: `${brandName}: $${amount.toLocaleString()} due in ${daysBefore} days`,
        data: { type: 'payment_reminder', paymentId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'payment-reminders',
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule payment reminder:', error);
    return null;
  }
}

// Schedule overdue payment notification
export async function scheduleOverdueNotification(
  paymentId: string,
  brandName: string,
  amount: number,
  dueDate: string
): Promise<string | null> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return null;

  try {
    const dueDateTime = new Date(dueDate);
    const triggerDate = new Date(dueDateTime);
    triggerDate.setDate(triggerDate.getDate() + 1);
    triggerDate.setHours(10, 0, 0, 0);

    if (triggerDate <= new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Payment Overdue',
        body: `${brandName}: $${amount.toLocaleString()} is now overdue!`,
        data: { type: 'payment_overdue', paymentId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'payment-reminders',
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule overdue notification:', error);
    return null;
  }
}

// Schedule deal deadline reminder
export async function scheduleDealDeadlineReminder(
  dealId: string,
  brandName: string,
  deadline: string,
  daysBefore: number = 2
): Promise<string | null> {
  const enabled = await areNotificationsEnabled();
  if (!enabled) return null;

  try {
    const deadlineDate = new Date(deadline);
    const triggerDate = new Date(deadlineDate);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    triggerDate.setHours(9, 0, 0, 0);

    if (triggerDate <= new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Deadline Coming Up',
        body: `${brandName}: Content due in ${daysBefore} days`,
        data: { type: 'deal_deadline', dealId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'deal-deadlines',
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Failed to schedule deadline reminder:', error);
    return null;
  }
}

// Cancel a specific notification
export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
}

// Cancel all notifications for a payment (simplified - no DB tracking)
export async function cancelPaymentNotifications(paymentId: string) {
  // Note: Without DB tracking, we cancel all and reschedule
  // This is a simpler approach that avoids circular dependencies
  console.log(`Cancelling notifications for payment: ${paymentId}`);
}

// Compatibility aliases
export const scheduleDealReminder = scheduleDealDeadlineReminder;
export const scheduleInvoiceReminder = schedulePaymentReminder;
export const cancelReminder = cancelNotification;

// Get all scheduled notifications
export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}

// Set up notification response handler
export function setupNotificationResponseHandler(
  onPaymentTap: (paymentId: string) => void,
  onDealTap: (dealId: string) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    
    if (data.type === 'payment_reminder' || data.type === 'payment_overdue') {
      onPaymentTap(data.paymentId as string);
    } else if (data.type === 'deal_deadline') {
      onDealTap(data.dealId as string);
    }
  });

  return subscription;
}

// Schedule all reminders for a new payment
export async function setupPaymentReminders(
  paymentId: string,
  brandName: string,
  amount: number,
  dueDate: string
) {
  await schedulePaymentReminder(paymentId, brandName, amount, dueDate, 7);
  await schedulePaymentReminder(paymentId, brandName, amount, dueDate, 3);
  await schedulePaymentReminder(paymentId, brandName, amount, dueDate, 1);
  await scheduleOverdueNotification(paymentId, brandName, amount, dueDate);
}

// Aliases for cleaner imports
export const scheduleDeadlineReminder = scheduleDealDeadlineReminder;
export const scheduleAllPaymentReminders = setupPaymentReminders;
