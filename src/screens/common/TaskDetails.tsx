import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute } from '@react-navigation/native';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { carryOverTask } from '../../api/tasksApi';
import { getAllUsers } from '../../api/usersApi';
import client from '../../api/client';

const TaskDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { task } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState(task);
  const [statusLoading, setStatusLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const formatTimeLeft = () => {
    if (!currentTask.startedAt || !currentTask.allocatedMinutes) return null;
    const started = new Date(currentTask.startedAt).getTime();
    const allocatedMs = currentTask.allocatedMinutes * 60000;
    const deadline = started + allocatedMs;
    const now = new Date().getTime();
    const diff = deadline - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} day ${hours} hours ${minutes} min left`;
    return `${hours} hours ${minutes} min left`;
  };

  const [timeLeftStr, setTimeLeftStr] = useState(formatTimeLeft());

  React.useEffect(() => {
    if (currentTask.status === 'in-progress' && currentTask.allocatedMinutes) {
      const interval = setInterval(() => {
        setTimeLeftStr(formatTimeLeft());
      }, 60000); // update every minute
      return () => clearInterval(interval);
    }
  }, [currentTask.status, currentTask.allocatedMinutes]);

  const handleAssign = async (userId: string) => {
    try {
      setAssignLoading(true);
      const res = await client.patch(`/tasks/${currentTask._id}`, { assignedTo: userId });
      setCurrentTask(res.data);
      setAssignModalVisible(false);
      Alert.alert('Success', 'Task assigned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setAssignLoading(false);
    }
  };

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
              await carryOverTask(currentTask._id);
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusLoading(true);
      const res = await client.patch(`/tasks/${currentTask._id}/status`, { status: newStatus });
      setCurrentTask(res.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAIImprove = async () => {
    try {
      setAiLoading(true);
      const res = await client.post('/ai/improve-task', {
        title: currentTask.title,
        description: currentTask.description
      });
      const improved = res.data;
      
      Alert.alert(
        'AI Writing Assistant',
        `Improved Title: ${improved.title}\n\nApply these improvements?`,
        [
          { text: 'Discard', style: 'cancel' },
          { 
            text: 'Apply', 
            onPress: async () => {
              try {
                const updated = await client.patch(`/tasks/${currentTask._id}`, {
                  title: improved.title,
                  description: improved.description
                });
                setCurrentTask(updated.data);
                Alert.alert('Success', 'Improvements applied!');
              } catch (err) {
                Alert.alert('Error', 'Failed to save improvements');
              }
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
          <Text style={styles.projectTitle}>{currentTask.project?.title || 'General'}</Text>
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          {(user?.role === 'admin' || user?.role === 'leader') && !currentTask.isLocked && (
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
            label={currentTask.status} 
            status={currentTask.status === 'done' ? 'done' : currentTask.status === 'in-progress' ? 'in-progress' : 'todo'} 
          />
          <View style={{ width: 10 }} />
          <Badge 
            label={currentTask.priority || 'Medium'} 
            status={currentTask.priority === 'high' ? 'in-progress' : 'todo'} 
          />
        </View>

        <Card style={styles.descCard}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>
            {currentTask.description || 'No description provided for this task.'}
          </Text>
        </Card>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.infoLabel}>Assigned To</Text>
              {(user?.role === 'admin' || user?.role === 'leader') && (
                <TouchableOpacity onPress={() => { fetchUsers(); setAssignModalVisible(true); }}>
                  <Text style={styles.assignLink}>Assign</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.infoValue}>{currentTask.assignedTo?.name || 'Unassigned'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Assigned By</Text>
            <Text style={styles.infoValue}>{currentTask.assignedBy?.name || 'Manager'}</Text>
          </View>
        </View>

        {(currentTask.startedAt || currentTask.allocatedMinutes > 0) && (
          <View style={styles.timeSection}>
            <Text style={styles.infoLabel}>Timeline & Tracking</Text>
            
            {currentTask.allocatedMinutes > 0 && (
              <Text style={styles.timeValue}>
                Budget: {currentTask.allocatedMinutes >= 1440 
                  ? `${(currentTask.allocatedMinutes / 1440).toFixed(1)} Days` 
                  : `${Math.round(currentTask.allocatedMinutes / 60)} Hours`}
              </Text>
            )}

            {currentTask.status === 'in-progress' && timeLeftStr && (
              <Text style={[styles.timeTrackedValue, { color: timeLeftStr === 'Overdue' ? '#EF4444' : '#F59E0B', fontSize: 16 }]}>
                ⏳ {timeLeftStr}
              </Text>
            )}

            {currentTask.startedAt && (
              <Text style={styles.timeValue}>Started: {new Date(currentTask.startedAt).toLocaleDateString()}</Text>
            )}
            {currentTask.completedAt && (
              <Text style={styles.timeValue}>Completed: {new Date(currentTask.completedAt).toLocaleDateString()}</Text>
            )}
            {currentTask.timeTracked > 0 && (
              <Text style={styles.timeTrackedValue}>⏱️ Time Tracked: {currentTask.timeTracked} mins</Text>
            )}
            {currentTask.dueDate && (
              <Text style={[styles.timeValue, { color: '#EF4444', fontWeight: '700' }]}>
                Deadline: {new Date(currentTask.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {!currentTask.isLocked && (user?.role === 'member' ? user._id === currentTask.assignedTo?._id : true) && (
          <View style={styles.actionButtons}>
            {statusLoading ? <ActivityIndicator size="large" color="#6366F1" /> : (
              <>
                {(currentTask.status === 'todo' || currentTask.status === 'pause') && (
                  <Button title="Start Task" onPress={() => handleStatusChange('in-progress')} style={styles.startBtn} />
                )}
                {currentTask.status === 'in-progress' && (
                  <>
                    <Button title="Pause" onPress={() => handleStatusChange('pause')} style={styles.pauseBtn} />
                    <Button title="Mark as Done" onPress={() => handleStatusChange('done')} style={styles.doneBtn} />
                  </>
                )}
              </>
            )}
          </View>
        )}

        {(user?.role === 'admin' || user?.role === 'leader') && currentTask.status !== 'done' && !currentTask.isLocked && (
          <Button 
            title="Carry Over to Tomorrow" 
            onPress={handleCarryOver}
            style={styles.carryOverBtn}
          />
        )}
      </ScrollView>

      <Modal
        visible={assignModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Task To</Text>
            {users.map((u: any) => (
              <TouchableOpacity 
                key={u._id} 
                style={styles.userItem}
                onPress={() => handleAssign(u._id)}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userRole}>{u.role}</Text>
                  </View>
                  <View style={[styles.workloadBadge, u.activeTasks > 5 ? styles.highWorkload : styles.normalWorkload]}>
                    <Text style={styles.workloadText}>{u.activeTasks || 0} tasks</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <Button 
              title="Cancel" 
              onPress={() => setAssignModalVisible(false)} 
              style={styles.cancelBtn} 
            />
          </View>
        </View>
      </Modal>
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
  timeTrackedValue: { fontSize: 15, color: '#10B981', marginTop: 8, fontWeight: '700' },
  actionButtons: { marginTop: 16, gap: 12 },
  startBtn: { backgroundColor: '#3B82F6' },
  pauseBtn: { backgroundColor: '#F59E0B' },
  doneBtn: { backgroundColor: '#10B981' },
  carryOverBtn: { marginTop: 24, backgroundColor: '#6366F1' },
  assignLink: { color: '#6366F1', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  userItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  userName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  userRole: { fontSize: 12, color: '#64748B', textTransform: 'capitalize' },
  workloadBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  highWorkload: { backgroundColor: '#FEE2E2' },
  normalWorkload: { backgroundColor: '#F1F5F9' },
  workloadText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  cancelBtn: { marginTop: 20, backgroundColor: '#F1F5F9' },
});

export default TaskDetails;
