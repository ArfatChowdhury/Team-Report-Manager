import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

interface LiveTimerProps {
  startedAt?: string;
  allocatedMinutes?: number;
  status: string;
  style?: TextStyle | TextStyle[];
}

const LiveTimer: React.FC<LiveTimerProps> = ({ startedAt, allocatedMinutes, status, style }) => {
  const formatTimeLeft = () => {
    if (!startedAt || !allocatedMinutes || status !== 'in-progress') return null;
    
    const started = new Date(startedAt).getTime();
    const allocatedMs = allocatedMinutes * 60000;
    const deadline = started + allocatedMs;
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s left`;
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s left`;
  };

  const [timeLeftStr, setTimeLeftStr] = useState(formatTimeLeft());

  useEffect(() => {
    if (status === 'in-progress' && startedAt && allocatedMinutes) {
      setTimeLeftStr(formatTimeLeft()); // Initial set
      
      const interval = setInterval(() => {
        setTimeLeftStr(formatTimeLeft());
      }, 1000); // tick every second

      return () => clearInterval(interval);
    } else {
      setTimeLeftStr(null);
    }
  }, [status, startedAt, allocatedMinutes]);

  if (!timeLeftStr) return null;

  return (
    <Text style={[styles.timerText, { color: timeLeftStr === 'Overdue' ? '#EF4444' : '#F59E0B' }, style]}>
      ⏳ {timeLeftStr}
    </Text>
  );
};

const styles = StyleSheet.create({
  timerText: {
    fontSize: 14,
    fontWeight: '700',
  }
});

export default LiveTimer;
