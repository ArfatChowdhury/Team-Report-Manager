import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface CustomDateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}) => {
  const [mode, setMode] = useState<'date' | 'time'>('date');
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    if (mode === 'date') {
      setMode('time');
    } else {
      onConfirm(selectedDate);
      setMode('date');
    }
  };

  const handleCancel = () => {
    setMode('date');
    onClose();
  };

  const updateDate = (
    field: 'month' | 'day' | 'year' | 'hour' | 'minute',
    value: number,
  ) => {
    const newDate = new Date(selectedDate);
    if (field === 'month') {newDate.setMonth(value);}
    if (field === 'day') {newDate.setDate(value);}
    if (field === 'year') {newDate.setFullYear(value);}
    if (field === 'hour') {newDate.setHours(value);}
    if (field === 'minute') {newDate.setMinutes(value);}
    setSelectedDate(newDate);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {mode === 'date' ? 'Select Date' : 'Select Time'}
          </Text>
          {mode === 'date' ? (
            <View style={styles.pickerRow}>
              {/* Month Column */}
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {months.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.item,
                      selectedDate.getMonth() === i && styles.itemActive,
                    ]}
                    onPress={() => updateDate('month', i)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedDate.getMonth() === i && styles.itemTextActive,
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Day Column */}
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {days.map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.item,
                      selectedDate.getDate() === d && styles.itemActive,
                    ]}
                    onPress={() => updateDate('day', d)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedDate.getDate() === d && styles.itemTextActive,
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Year Column */}
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {years.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.item,
                      selectedDate.getFullYear() === y && styles.itemActive,
                    ]}
                    onPress={() => updateDate('year', y)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedDate.getFullYear() === y &&
                          styles.itemTextActive,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.pickerRow}>
              {/* Hour Column */}
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {hours.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.item,
                      selectedDate.getHours() === h && styles.itemActive,
                    ]}
                    onPress={() => updateDate('hour', h)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedDate.getHours() === h && styles.itemTextActive,
                      ]}
                    >
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.separator}>
                <Text style={styles.separatorText}>:</Text>
              </View>
              {/* Minute Column */}
              <ScrollView
                style={styles.column}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.item,
                      selectedDate.getMinutes() === m && styles.itemActive,
                    ]}
                    onPress={() => updateDate('minute', m)}
                  >
                    <Text
                      style={[
                        styles.itemText,
                        selectedDate.getMinutes() === m &&
                          styles.itemTextActive,
                      ]}
                    >
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={handleCancel} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.btnConfirm}>
              <Text style={styles.btnConfirmText}>
                {mode === 'date' ? 'Next' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  pickerRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
  },
  column: {
    flex: 1,
    paddingHorizontal: 4,
  },
  separator: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  separatorText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38BDF8',
  },
  item: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  itemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  itemText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  itemTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
  },
  btnCancelText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  btnConfirm: {
    flex: 1,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    borderRadius: 16,
  },
  btnConfirmText: {
    color: '#020617',
    fontWeight: '800',
  }
});

export default CustomDateTimePicker;
