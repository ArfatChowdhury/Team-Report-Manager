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
  Modal,
  Dimensions
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { carryOverTask } from '../../api/tasksApi';
import { getAllUsers } from '../../api/usersApi';
import client from '../../api/client';
import LiveTimer from '../../components/common/LiveTimer';
import Avatar from '../../components/common/Avatar';

const { width, height } = Dimensions.get('window');

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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const confirmAssign = async () => {
    if (!selectedUserId) return;
    try {
      setAssignLoading(true);
      const res = await client.patch(`/tasks/${currentTask._id}`, { assignedTo: selectedUserId });
      setCurrentTask(res.data);
      setAssignModalVisible(false);
      Alert.alert('Success', 'Task assigned successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to assign task');
    } finally {
      setAssignLoading(false);
      setSelectedUserId(null);
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
      <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Task Core</Text>
        {currentTask.isLocked && <Badge label="LOCKED" status="todo" />}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.projectSection}>
          <Text style={styles.projectLabel}>Workspace</Text>
          <Text style={styles.projectTitle}>{currentTask.project?.title || 'General Tasks'}</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.titleRow}>
          <Text style={styles.taskTitle}>{currentTask.title}</Text>
          {(user?.role === 'admin' || user?.role === 'leader') && !currentTask.isLocked && (
            <TouchableOpacity onPress={handleAIImprove} disabled={aiLoading} style={styles.aiBtn}>
              {aiLoading ? (
                <ActivityIndicator size="small" color="#38BDF8" />
              ) : (
                <Text style={styles.aiBtnText}>✨ AI</Text>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>
        
        <Animated.View entering={FadeInDown.delay(300)} style={styles.badgeRow}>
          <Badge 
            label={currentTask.status} 
            status={currentTask.status === 'done' ? 'done' : currentTask.status === 'in-progress' ? 'in-progress' : 'todo'} 
          />
          <View style={{ width: 10 }} />
          <Badge 
            label={currentTask.priority || 'Medium'} 
            status={currentTask.priority === 'high' ? 'in-progress' : 'todo'} 
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Card style={styles.descCard}>
            <Text style={styles.sectionLabel}>Objective Details</Text>
            <Text style={styles.description}>
              {currentTask.description || 'No detailed instructions provided.'}
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoLabelRow}>
              <Text style={styles.infoLabel}>Assigned Agent</Text>
              {(user?.role === 'admin' || user?.role === 'leader') && (
                <TouchableOpacity onPress={() => { fetchUsers(); setAssignModalVisible(true); }}>
                  <Text style={styles.assignLink}>RE-ASSIGN</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.avatarRow}>
              <Avatar name={currentTask.assignedTo?.name || 'U'} size={32} style={styles.avatarBorder} />
              <Text style={styles.infoValue}>{currentTask.assignedTo?.name || 'Unassigned'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Strategy Origin</Text>
            <View style={styles.avatarRow}>
              <Avatar name={currentTask.assignedBy?.name || 'M'} size={32} style={styles.avatarBorder} />
              <Text style={styles.infoValue}>{currentTask.assignedBy?.name || 'System'}</Text>
            </View>
          </View>
        </Animated.View>

        {(currentTask.startedAt || currentTask.allocatedMinutes > 0) && (
          <Animated.View entering={FadeInDown.delay(600)} style={styles.timeSection}>
            <Text style={styles.sectionLabel}>Operations Timeline</Text>
            
            <View style={styles.timeStats}>
              {currentTask.allocatedMinutes > 0 && (
                <View style={styles.timeStatItem}>
                   <Text style={styles.timeStatLabel}>Budgeted Time</Text>
                   <Text style={styles.timeStatValue}>
                      {currentTask.allocatedMinutes >= 1440 
                        ? `${(currentTask.allocatedMinutes / 1440).toFixed(1)} Days` 
                        : `${Math.round(currentTask.allocatedMinutes / 60)} Hours`}
                   </Text>
                </View>
              )}

              <View style={styles.timeStatItem}>
                 <Text style={styles.timeStatLabel}>Active Progress</Text>
                 <LiveTimer 
                    startedAt={currentTask.startedAt} 
                    allocatedMinutes={currentTask.allocatedMinutes} 
                    status={currentTask.status} 
                    style={styles.liveTimerText}
                  />
              </View>
            </View>

            <View style={styles.timelineFooter}>
               {currentTask.dueDate && (
                <Text style={styles.deadlineText}>
                  Deadline: {new Date(currentTask.dueDate).toLocaleDateString()}
                </Text>
              )}
               {currentTask.timeTracked > 0 && (
                <Text style={styles.trackedText}>⏱️ {currentTask.timeTracked}m tracked</Text>
              )}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(700)} style={styles.actionSection}>
          {!currentTask.isLocked && (user?.role === 'member' ? user._id === currentTask.assignedTo?._id : true) && (
            <View style={styles.actionButtons}>
              {statusLoading ? <ActivityIndicator size="large" color="#38BDF8" /> : (
                <>
                  {(currentTask.status === 'todo' || currentTask.status === 'pause') && (
                    <Button title="Engage Progress" onPress={() => handleStatusChange('in-progress')} style={styles.startBtn} />
                  )}
                  {currentTask.status === 'in-progress' && (
                    <View style={styles.dualActions}>
                      <TouchableOpacity onPress={() => handleStatusChange('pause')} style={styles.pauseIconButton}>
                         <Text style={styles.pauseIconText}>⏸</Text>
                      </TouchableOpacity>
                      <Button title="Finalize Mission" onPress={() => handleStatusChange('done')} style={styles.doneBtn} />
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {(user?.role === 'admin' || user?.role === 'leader') && currentTask.status !== 'done' && !currentTask.isLocked && (
            <TouchableOpacity 
              onPress={handleCarryOver}
              style={styles.carryOverTrigger}
            >
              <Text style={styles.carryOverText}>Carry Over to Next Cycle</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <Animated.View entering={ZoomIn.duration(400)} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Re-Assign Operation</Text>
            <ScrollView style={styles.userListScroll} showsVerticalScrollIndicator={false}>
              {users.map((u: any) => (
                <TouchableOpacity 
                  key={u._id} 
                  style={[styles.userItem, selectedUserId === u._id && styles.userItemActive]}
                  onPress={() => setSelectedUserId(u._id)}
                  disabled={assignLoading}
                >
                  <Avatar name={u.name} size={40} style={styles.avatarBorder} />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, selectedUserId === u._id && styles.userNameActive]}>{u.name}</Text>
                    <Text style={styles.userRole}>{u.role}</Text>
                  </View>
                  <View style={[styles.workloadBadge, u.activeTasks > 5 ? styles.highWorkload : styles.normalWorkload]}>
                    <Text style={styles.workloadText}>{u.activeTasks || 0} OPS</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity 
                onPress={() => {
                  setAssignModalVisible(false);
                  setSelectedUserId(null);
                }} 
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Abort</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={confirmAssign}
                disabled={!selectedUserId || assignLoading} 
                style={[styles.modalConfirmBtn, (!selectedUserId || assignLoading) && { opacity: 0.5 }]}
              >
                <Text style={styles.modalConfirmText}>{assignLoading ? '...' : 'Assign'}</Text>
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
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
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
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#F8FAFC', 
    flex: 1 
  },
  content: { 
    padding: 24 
  },
  projectSection: { 
    marginBottom: 16 
  },
  projectLabel: { 
    fontSize: 10, 
    color: '#38BDF8', 
    fontWeight: '800', 
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  projectTitle: { 
    fontSize: 18, 
    color: '#F8FAFC', 
    fontWeight: '800',
    marginTop: 4,
  },
  titleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 16 
  },
  taskTitle: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#F8FAFC', 
    flex: 1, 
    marginRight: 12,
    lineHeight: 32,
  },
  aiBtn: { 
    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  aiBtnText: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 12,
  },
  badgeRow: { 
    flexDirection: 'row', 
    marginBottom: 32 
  },
  descCard: { 
    padding: 20, 
    marginBottom: 32,
  },
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: '800', 
    color: '#64748B', 
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: { 
    fontSize: 16, 
    color: '#CBD5E1', 
    lineHeight: 26,
    fontWeight: '400' 
  },
  infoGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 32,
    gap: 16,
  },
  infoItem: { 
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: { 
    fontSize: 10, 
    color: '#64748B', 
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  assignLink: { 
    color: '#38BDF8', 
    fontWeight: '800', 
    fontSize: 10,
  },
  avatarRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatarBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoValue: { 
    fontSize: 14, 
    color: '#F8FAFC', 
    fontWeight: '700',
    marginLeft: 10,
  },
  timeSection: { 
    paddingTop: 24, 
    marginBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeStatItem: {
    flex: 1,
  },
  timeStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 4,
  },
  timeStatValue: {
    fontSize: 18,
    color: '#F8FAFC',
    fontWeight: '800',
  },
  liveTimerText: {
    fontSize: 18,
    color: '#38BDF8',
    fontWeight: '800',
  },
  timelineFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: { 
    fontSize: 12, 
    color: '#FB7185', 
    fontWeight: '700' 
  },
  trackedText: { 
    fontSize: 12, 
    color: '#34D399', 
    fontWeight: '700' 
  },
  actionSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  actionButtons: { 
    gap: 12 
  },
  dualActions: {
    flexDirection: 'row',
    gap: 12,
  },
  startBtn: { 
    backgroundColor: '#38BDF8',
    height: 56,
  },
  pauseIconButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseIconText: {
    fontSize: 18,
    color: '#F59E0B',
  },
  doneBtn: { 
    backgroundColor: '#34D399',
    height: 56,
    flex: 1,
  },
  carryOverTrigger: {
    marginTop: 24,
    alignItems: 'center',
  },
  carryOverText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    padding: 24 
  },
  modalContent: { 
    backgroundColor: '#0F172A', 
    padding: 24, 
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#F8FAFC', 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  userListScroll: {
    maxHeight: 400,
  },
  userItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)', 
    marginBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  userItemActive: { 
    backgroundColor: 'rgba(56, 189, 248, 0.1)', 
    borderColor: '#38BDF8' 
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#F8FAFC' 
  },
  userNameActive: { 
    color: '#38BDF8' 
  },
  userRole: { 
    fontSize: 12, 
    color: '#64748B', 
    marginTop: 2, 
    textTransform: 'capitalize' 
  },
  workloadBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  normalWorkload: { 
    backgroundColor: 'rgba(52, 211, 153, 0.15)' 
  },
  highWorkload: { 
    backgroundColor: 'rgba(251, 113, 133, 0.15)' 
  },
  workloadText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#F8FAFC' 
  },
  modalActionsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 24,
    gap: 12,
  },
  modalCancelBtn: { 
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalConfirmBtn: { 
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#020617',
    fontWeight: '800',
  }
});

export default TaskDetails;
