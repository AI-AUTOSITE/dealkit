// lib/haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Light tap - ボタンタップ、トグル
export function hapticLight() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

// Medium tap - 選択、カード移動
export function hapticMedium() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

// Heavy tap - 削除、重要なアクション
export function hapticHeavy() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

// Success - 保存成功、完了
export function hapticSuccess() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

// Warning - 注意が必要
export function hapticWarning() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

// Error - エラー発生
export function hapticError() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

// Selection - リスト選択
export function hapticSelection() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
}
