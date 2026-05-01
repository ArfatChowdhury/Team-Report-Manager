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
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getProjectTasks } from '../../api/tasksApi';
import client from '../../api/client';
import LiveTimer from '../../components/common/LiveTimer';
import Avatar from '../../components/common/Avatar';

const { width } = Dimensions.get('window');

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
      
      const suggestedData = response.data;
      // Handle both string array (old) and object array (new)
      const editableTasks = suggestedData.map((t: any, i: number) => ({ 
        id: i.toString(), 
        title: typeof t === 'string' ? t : (t.title || 'Untitled Task')
      }));
      setSuggestedTasks(editableTasks);
      setReviewModalVisible(true);
    } catch (error) {
      Alert.alert('AI Error', 'Make sure GROQ_API_KEY is in your backend .env');
    } finally {
      setAiLoading(false);
    }
  };

  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');

  const handleSendEmail = async () => {
    if (!recipientEmail) return;
    try {
      setLoading(true);
      setEmailModalVisible(false);
      await client.post('/reports/email-report', {
        to: recipientEmail,
        projectTitle: project.title,
        tasks: tasks 
      });
      Alert.alert('Success', 'AI Report sent successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to send email report');
    } finally {
      setLoading(false);
      setRecipientEmail('');
    }
  };

  const handleEmailReport = () => {
    setEmailModalVisible(true);
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

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <TouchableOpacity onPress={() => navigation.navigate('TaskDetails', { task: item })}>
        <Card style={styles.taskCard}>
          <View style={styles.taskContent}>
            <Avatar name={item.assignedTo?.name || 'U'} size={36} style={styles.taskAvatar} />
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.assignee}>
                {item.assignedTo?.name ? `Assigned to ${item.assignedTo.name}` : 'Unassigned'}
              </Text>
              {item.dueDate && (
                <Text style={styles.dueDateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
              )}
              {item.status === 'in-progress' && item.allocatedMinutes > 0 && (
                <LiveTimer 
                  startedAt={item.startedAt} 
                  allocatedMinutes={item.allocatedMinutes} 
                  status={item.status} 
                  style={styles.timerStyle} 
                />
              )}
            </View>
          </View>
          <Badge 
            label={item.status} 
            status={item.status === 'done' ? 'done' : item.status === 'in-progress' ? 'in-progress' : 'todo'} 
          />
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      
      <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>Project Workspace</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{project.title}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.headerIconBtn, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)' }]} 
            onPress={handleEmailReport}
          >
            <Text style={[styles.headerIconText, { color: '#34D399' }]}>✉️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIconBtn} 
            onPress={handleAISuggest}
            disabled={aiLoading}
          >
            <Text style={styles.headerIconText}>{aiLoading ? '...' : '✨'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Empty Workspace</Text>
            <Text style={styles.emptySub}>No tasks have been created yet.</Text>
            <TouchableOpacity onPress={handleAISuggest} style={styles.emptyAiBtn}>
               <Text style={styles.emptyAiBtnText}>Generate with AI</Text>
            </TouchableOpacity>
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
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>AI Strategy Review</Text>
                <Text style={styles.modalSub}>Refine suggested roadmap</Text>
              </View>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={suggestedTasks}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInRight.delay(index * 50)}>
                  <View style={styles.editTaskRow}>
                    <TextInput
                      style={styles.editTaskInput}
                      value={item.title}
                      onChangeText={(text) => updateSuggestedTask(item.id, text)}
                      multiline
                      placeholderTextColor="#64748B"
                    />
                    <TouchableOpacity onPress={() => removeSuggestedTask(item.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAITasks}>
                <Text style={styles.saveBtnText}>Add {suggestedTasks.length} Tasks</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(400)} style={styles.emailModalContent}>
            <Text style={styles.modalTitle}>AI Report Dispatch</Text>
            <Text style={styles.modalSub}>Enter recipient email address</Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="e.g. client@example.com"
              placeholderTextColor="#64748B"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <View style={styles.modalFooterRow}>
              <TouchableOpacity 
                onPress={() => setEmailModalVisible(false)} 
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSendEmail}
                disabled={!recipientEmail} 
                style={[styles.dispatchBtn, !recipientEmail && { opacity: 0.5 }]}
              >
                <Text style={styles.dispatchBtnText}>Send Report</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020617' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backBtn: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backText: { 
    fontSize: 22, 
    color: '#F8FAFC', 
    fontWeight: '300' 
  },
  headerTitleContainer: { 
    flex: 1 
  },
  headerLabel: { 
    fontSize: 10, 
    color: '#38BDF8', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#F8FAFC',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIconBtn: { 
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerIconText: { 
    fontSize: 16,
    color: '#38BDF8',
  },
  listContent: { 
    padding: 16,
    paddingBottom: 100,
  },
  taskCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    padding: 16,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskAvatar: { 
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  taskInfo: { 
    flex: 1 
  },
  taskTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#F8FAFC' 
  },
  assignee: { 
    fontSize: 12, 
    color: '#94A3B8', 
    marginTop: 4 
  },
  dueDateText: { 
    fontSize: 11, 
    color: '#FB7185', 
    marginTop: 6, 
    fontWeight: '600' 
  },
  timerStyle: {
    marginTop: 8,
    fontSize: 12,
    color: '#38BDF8',
  },
  emptyContainer: { 
    alignItems: 'center', 
    marginTop: 80,
  },
  emptyText: { 
    color: '#F8FAFC', 
    fontSize: 20,
    fontWeight: '800' 
  },
  emptySub: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 8,
  },
  emptyAiBtn: {
    marginTop: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  emptyAiBtnText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 24, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#38BDF8', 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 8,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { 
    fontSize: 32, 
    color: '#020617', 
    fontWeight: '300' 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.1)' 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#F8FAFC' 
  },
  modalSub: { 
    fontSize: 14, 
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: { 
    fontSize: 14, 
    color: '#94A3B8',
  },
  modalList: { 
    padding: 20, 
    paddingBottom: 120 
  },
  editTaskRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    overflow: 'hidden' 
  },
  editTaskInput: { 
    flex: 1, 
    padding: 16, 
    fontSize: 15, 
    color: '#F8FAFC', 
    minHeight: 56 
  },
  removeBtn: { 
    padding: 16, 
    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  removeBtnText: { 
    color: '#EF4444', 
    fontSize: 14, 
    fontWeight: '700' 
  },
  modalFooter: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    padding: 24, 
    backgroundColor: '#0F172A', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.1)' 
  },
  saveBtn: { 
    backgroundColor: '#38BDF8', 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center' 
  },
  saveBtnText: { 
    color: '#020617', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  emailModalContent: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
  },
  emailInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  modalFooterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  dispatchBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
  },
  dispatchBtnText: {
    color: '#020617',
    fontWeight: '800',
  },
});

export default ProjectTasks;
