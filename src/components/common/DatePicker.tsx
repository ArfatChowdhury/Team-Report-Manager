import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView 
} from 'react-native';
import Button from './Button';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: string) => void;
  currentDate?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ visible, onClose, onSelect, currentDate }) => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleConfirm = () => {
    const formattedMonth = selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth;
    const formattedDay = selectedDay < 10 ? `0${selectedDay}` : selectedDay;
    onSelect(`${selectedYear}-${formattedMonth}-${formattedDay}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Deadline</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            {/* Year */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Year</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.item, selectedYear === item && styles.itemSelected]}
                    onPress={() => setSelectedYear(item)}
                  >
                    <Text style={[styles.itemText, selectedYear === item && styles.itemTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Month */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Month</Text>
              <FlatList
                data={months}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.item, selectedMonth === item && styles.itemSelected]}
                    onPress={() => setSelectedMonth(item)}
                  >
                    <Text style={[styles.itemText, selectedMonth === item && styles.itemTextSelected]}>
                      {new Date(0, item - 1).toLocaleString('default', { month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Day */}
            <View style={styles.column}>
              <Text style={styles.colLabel}>Day</Text>
              <FlatList
                data={days}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.item, selectedDay === item && styles.itemSelected]}
                    onPress={() => setSelectedDay(item)}
                  >
                    <Text style={[styles.itemText, selectedDay === item && styles.itemTextSelected]}>{item}</Text>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>

          <Button title="Confirm Date" onPress={handleConfirm} style={styles.confirmBtn} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  content: { 
    backgroundColor: '#FFFFFF', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    padding: 24,
    height: 400
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  closeText: { color: '#64748B', fontWeight: '600' },
  pickerRow: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  column: { flex: 1, alignItems: 'center' },
  colLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 12, textTransform: 'uppercase' },
  item: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, width: '100%', alignItems: 'center' },
  itemSelected: { backgroundColor: '#EEF2FF' },
  itemText: { fontSize: 16, color: '#64748B' },
  itemTextSelected: { color: '#4F46E5', fontWeight: '700' },
  confirmBtn: { marginTop: 20 }
});

export default DatePicker;
