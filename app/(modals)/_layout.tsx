import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../lib/theme';

export default function ModalsLayout() {
  const { colors } = useTheme();

  return (
    <>
      {/* iOS card modal has black area above - use light (white) text */}
      {Platform.OS === 'ios' && <StatusBar style="light" />}
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'modal',
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_bottom',
        }}
      >
      <Stack.Screen name="rate-calculator" />
      <Stack.Screen name="email-assistant" />
      <Stack.Screen name="contract-review" />
      <Stack.Screen name="usage-calculator" />
      <Stack.Screen name="deal/[id]" />
      <Stack.Screen name="payment/[id]" />
      <Stack.Screen name="brand-detail" />
      <Stack.Screen name="add-brand" />
      <Stack.Screen name="add-deal" />
      <Stack.Screen name="add-invoice" />
      <Stack.Screen name="deal-detail" />
      <Stack.Screen name="invoice-detail" />
      <Stack.Screen name="settings/profile" />
      <Stack.Screen name="settings/how-to-use" />
      <Stack.Screen name="settings/terms" />
      <Stack.Screen name="settings/privacy" />
    </Stack>
    </>
  );
}
