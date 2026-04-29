import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

type StatusType = 'todo' | 'in-progress' | 'pause' | 'done' | string;

interface BadgeProps {
  label: string;
  status?: StatusType;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ label, status, style }) => {
  const getColors = () => {
    switch (status?.toLowerCase()) {
      case 'todo':
        return { bg: '#F1F5F9', text: '#64748B' };
      case 'in-progress':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'pause':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'done':
        return { bg: '#D1FAE5', text: '#059669' };
      default:
        return { bg: '#F1F5F9', text: '#64748B' };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default Badge;
