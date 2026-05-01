import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView,
  Modal,
  TextInput
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getProjectTasks } from '../../api/tasksApi';
import client from '../../api/client';
import LiveTimer from '../../components/common/LiveTimer';
import { Alert } from 'react-native';

const ProjectTasks = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { project } = route.params;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<{ id: string; title: string }[]>([]);

  const fetchTasks = async () => {
    try {
      const data = await getProjectTasks(project._id);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [project._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleAISuggest = async () => {
    try {
      setAiLoading(true);
      const response = await client.post('/ai/suggest-tasks', {
        title: project.title,
        description: project.description
      });
      
      const tasks = response.data;
      const editableTasks = tasks.map((t: string, i: number) => ({ id: i.toString(), title: t }));
      setSuggestedTasks(editableTasks);
      setReviewModalVisible(true);
    } catch (error) {
      Alert.alert('AI Error', 'Make sure GROQ_API_KEY is in your backend .env');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEmailReport = async () => {
    Alert.prompt(
      'Send Email Report',
      'Enter recipient email address:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async (email) => {
            if (!email) return;
            try {
              setLoading(true);
              await client.post('/reports/email-report', {
                to: email,
                projectTitle: project.title,
                tasks: tasks // Sends current project tasks
              });
              Alert.alert('Success', 'AI Report sent successfully!');
            } catch (err) {
              Alert.alert('Error', 'Failed to send email report');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleSaveAITasks = async () => {
    try {
      setLoading(true);
      setReviewModalVisible(false);
      
      const promises = suggestedTasks.map(task => {
        if (!task.title.trim()) return null;
        return client.post('/tasks', {
          title: task.title,
          project: project._id,
          priority: 'medium'
          // omitted assignedTo so it remains optional/unassigned
        });
      }).filter(Boolean);

      await Promise.all(promises);
      fetchTasks();
      Alert.alert('Success', `${promises.length} tasks added successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to add AI tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateSuggestedTask = (id: string, newTitle: string) => {
    setSuggestedTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
  };

  const removeSuggestedTask = (id: string) => {
    setSuggestedTasks(prev => prev.filter(t => t.id !== id));
  };

  const renderTaskItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TaskDetails', { task: item })}>
      <Card style={styles.taskCard}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.assignee}>Assigned to: {item.assignedTo?.name || 'Unassigned'}</Text>
          {item.dueDate && (
            <Text style={styles.dueDateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          )}
          {item.status === 'in-progress' && item.allocatedMinutes > 0 && (
            <LiveTimer 
              startedAt={item.startedAt} 
              allocatedMinutes={item.allocatedMinutes} 
              status={item.status} 
              style={{ marginTop: 8, fontSize: 12 }} 
            />
          )}
        </View>
        <Badge 
          label={item.status} 
          status={item.status === 'done' ? 'done' : item.status === 'in-progress' ? 'in-progress' : 'todo'} 
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>Project Tasks</Text>
          <Text style={styles.headerTitle}>{project.title}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.aiBtn, { marginRight: 8, backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]} 
          onPress={handleEmailReport}
        >
          <Text style={[styles.aiBtnText, { color: '#16A34A' }]}>✉️ Report</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.aiBtn} 
          onPress={handleAISuggest}
          disabled={aiLoading}
        >
          <Text style={styles.aiBtnText}>{aiLoading ? '...' : 'AI Plan'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found for this project.</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask', { project })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Review AI Plan</Text>
            <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSub}>Edit, remove, or refine tasks before saving.</Text>
          
          <FlatList
            data={suggestedTasks}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.modalList}
            renderItem={({ item }) => (
              <View style={styles.editTaskRow}>
                <TextInput
                  style={styles.editTaskInput}
                  value={item.title}
                  onChangeText={(text) => updateSuggestedTask(item.id, text)}
                  multiline
                />
                <TouchableOpacity onPress={() => removeSuggestedTask(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAITasks}>
              <Text style={styles.saveBtnText}>Save {suggestedTasks.length} Tasks</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: '#1E293B', fontWeight: '600' },
  headerTitleContainer: { flex: 1 },
  headerLabel: { fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  aiBtn: { 
    backgroundColor: '#EEF2FF', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#6366F1' 
  },
  aiBtnText: { color: '#6366F1', fontWeight: '700', fontSize: 12 },
  listContent: { padding: 16 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  assignee: { fontSize: 13, color: '#64748B', marginTop: 4 },
  dueDateText: { fontSize: 11, color: '#F59E0B', marginTop: 2, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#FFFFFF', fontWeight: '300' },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  modalCloseText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  modalSub: { padding: 16, color: '#64748B', fontSize: 14 },
  modalList: { paddingHorizontal: 16, paddingBottom: 100 },
  editTaskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  editTaskInput: { flex: 1, padding: 12, fontSize: 15, color: '#1E293B', minHeight: 48 },
  removeBtn: { padding: 16, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#EF4444', fontSize: 16, fontWeight: '700' },
  modalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  saveBtn: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ProjectTasks;
