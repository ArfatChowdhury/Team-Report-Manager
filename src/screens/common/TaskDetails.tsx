import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute } from '@react-navigation/native';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { carryOverTask } from '../../api/tasksApi';
import client from '../../api/client';

const TaskDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { task } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const [aiLoading, setAiLoading] = useState(false);

  const handleCarryOver = async () => {
    Alert.alert(
      'Carry Over Task',
      'This will create a duplicate task for tomorrow and LOCK this one. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Carry Over', 
          onPress: async () => {
            try {
              await carryOverTask(task._id);
              Alert.alert('Success', 'Task carried over and locked');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Error', 'Failed to carry over task');
            }
          } 
        }
      ]
    );
  };

  const handleAIImprove = async () => {
    try {
      setAiLoading(true);
      const prompt = `Rewrite this task title and description to be more professional. 
      Title: ${task.title}
      Description: ${task.description}
      Return ONLY a JSON object: { "title": "...", "description": "..." }`;

      const response = await client.post('/ai/chat', { prompt });
      const improved = response.data;
      
      Alert.alert(
        'AI Writing Assistant',
        `Title: ${improved.title}\n\nApply these improvements?`,
        [
          { text: 'Discard', style: 'cancel' },
          { 
            text: 'Apply', 
            onPress: async () => {
              await client.put(`/tasks/${task._id}`, {
                title: improved.title,
                description: improved.description
              });
              Alert.alert('Success', 'Improvements applied!');
              navigation.goBack();
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('AI Error', 'Failed to generate improvements');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Details</Text>
        {task.isLocked && <Badge label="LOCKED" status="todo" />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.projectSection}>
          <Text style={styles.projectLabel}>Project</Text>
          <Text style={styles.projectTitle}>{task.project?.title || 'General'}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          {(user?.role === 'admin' || user?.role === 'leader') && !task.isLocked && (
            <TouchableOpacity onPress={handleAIImprove} disabled={aiLoading}>
              {aiLoading ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <Text style={styles.aiLink}>AI Improve ✨</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.badgeRow}>
          <Badge 
            label={task.status} 
            status={task.status === 'done' ? 'done' : task.status === 'in-progress' ? 'in-progress' : 'todo'} 
          />
          <View style={{ width: 10 }} />
          <Badge 
            label={task.priority || 'Medium'} 
            status={task.priority === 'high' ? 'in-progress' : 'todo'} 
          />
        </View>

        <Card style={styles.descCard}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>
            {task.description || 'No description provided for this task.'}
          </Text>
        </Card>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Assigned To</Text>
            <Text style={styles.infoValue}>{task.assignedTo?.name || 'Unassigned'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Assigned By</Text>
            <Text style={styles.infoValue}>{task.assignedBy?.name || 'Manager'}</Text>
          </View>
        </View>

        {task.startedAt && (
          <View style={styles.timeSection}>
            <Text style={styles.infoLabel}>Timeline</Text>
            <Text style={styles.timeValue}>Started: {new Date(task.startedAt).toLocaleDateString()}</Text>
            {task.completedAt && (
              <Text style={styles.timeValue}>Completed: {new Date(task.completedAt).toLocaleDateString()}</Text>
            )}
            {task.dueDate && (
              <Text style={[styles.timeValue, { color: '#EF4444', fontWeight: '700' }]}>
                Deadline: {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {(user?.role === 'admin' || user?.role === 'leader') && task.status !== 'done' && !task.isLocked && (
          <Button 
            title="Carry Over to Tomorrow" 
            onPress={handleCarryOver}
            style={styles.carryOverBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backBtn: { padding: 8 },
  backText: { fontSize: 24, color: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginLeft: 8, flex: 1 },
  content: { padding: 24 },
  projectSection: { marginBottom: 12 },
  projectLabel: { fontSize: 12, color: '#6366F1', fontWeight: '700', textTransform: 'uppercase' },
  projectTitle: { fontSize: 16, color: '#1E293B', fontWeight: '600' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  taskTitle: { fontSize: 22, fontWeight: '800', color: '#1E293B', flex: 1, marginRight: 10 },
  aiLink: { color: '#6366F1', fontWeight: '700', fontSize: 13, backgroundColor: '#EEF2FF', padding: 6, borderRadius: 6 },
  badgeRow: { flexDirection: 'row', marginBottom: 24 },
  descCard: { padding: 16, backgroundColor: '#F8FAFC', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  description: { fontSize: 15, color: '#334155', lineHeight: 22 },
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 15, color: '#1E293B', fontWeight: '600' },
  timeSection: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, marginBottom: 20 },
  timeValue: { fontSize: 14, color: '#64748B', marginTop: 4 },
  carryOverBtn: { marginTop: 20, backgroundColor: '#6366F1' },
});

export default TaskDetails;
