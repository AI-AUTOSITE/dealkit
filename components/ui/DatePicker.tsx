// components/ui/DatePicker.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Text } from './Text';
import { useTheme } from '@/lib/theme';
import { colors } from '@/design-tokens/primitives/colors';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
  label,
}: DatePickerProps) {
  const { isDark } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        // Keep picker open on iOS until dismissed
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleClear = () => {
    onChange(null);
  };

  const handleIOSDone = () => {
    setShowPicker(false);
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const displayValue = value ? formatDate(value) : placeholder;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="bodySm" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { backgroundColor: isDark ? colors.dark100 : colors.neutral100 },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color={isDark ? colors.neutral400 : colors.neutral500}
        />
        <Text
          variant="bodyMd"
          style={{
            ...styles.text,
            ...(!value && { color: isDark ? colors.neutral500 : colors.neutral400 }),
          }}
        >
          {displayValue}
        </Text>
        {value && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? colors.neutral500 : colors.neutral400}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Android: Native picker */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}

      {/* iOS: Modal with picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
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
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text variant="bodyMd" color="secondary">Cancel</Text>
                </TouchableOpacity>
                <Text variant="headingSm">Select Date</Text>
                <TouchableOpacity onPress={handleIOSDone}>
                  <Text variant="bodyMd" style={{ color: colors.primary500 }}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
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
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 10,
  },
  text: {
    flex: 1,
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
