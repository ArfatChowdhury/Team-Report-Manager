import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getProjectTasks, updateTaskStatus } from '../../api/tasksApi';
import { logout } from '../../api/authApi';
import client from '../../api/client';
import LiveTimer from '../../components/common/LiveTimer';

const MemberDashboard = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const fetchTasks = async () => {
    try {
      const response = await client.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching member tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleStatusUpdate = async (taskId: string, currentStatus: string) => {
    if (currentStatus === 'done') return;

    Alert.alert(
      'Update Status',
      `Current: ${currentStatus.toUpperCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Working', 
          onPress: () => updateStatus(taskId, 'in-progress'),
          style: currentStatus === 'todo' ? 'default' : 'cancel' 
        },
        { 
          text: 'Pause Task', 
          onPress: () => updateStatus(taskId, 'pause'),
          style: 'default'
        },
        { 
          text: 'Mark as Done', 
          onPress: () => updateStatus(taskId, 'done'),
          style: 'destructive'
        },
      ]
    );
  };

  const updateStatus = async (taskId: string, nextStatus: string) => {
    try {
      setLoading(true);
      await client.patch(`/tasks/${taskId}/status`, { status: nextStatus });
      await fetchTasks();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const renderTaskItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('TaskDetails', { task: item })}
      onLongPress={() => handleStatusUpdate(item._id, item.status)}
      delayLongPress={200}
    >
      <Card style={[styles.taskCard, item.status === 'done' && styles.taskDone]}>
        <View style={styles.taskInfo}>
          <Text style={styles.projectTitle}>{item.project?.title || 'General'}</Text>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.priority}>Priority: {item.priority || 'Medium'}</Text>
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
        <View style={styles.statusCol}>
          <Badge 
            label={item.status} 
            status={item.status === 'done' ? 'done' : item.status === 'in-progress' ? 'in-progress' : 'todo'} 
          />
          <Text style={styles.tapHint}>Long press to update</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Member Portal</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity 
          onPress={async () => {
            await logout();
            dispatch(logOut());
          }} 
          style={styles.logoutBtn}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Assigned Tasks</Text>
      
      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks assigned to you yet.</Text>
            <Text style={styles.emptySubText}>Keep up the good work!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  greeting: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  name: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#64748B', marginLeft: 20, marginBottom: 12, marginTop: 20, textTransform: 'uppercase' },
  listContent: { padding: 16 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskDone: { opacity: 0.6, backgroundColor: '#F1F5F9' },
  taskInfo: { flex: 1 },
  projectTitle: { fontSize: 11, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', marginBottom: 4 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  priority: { fontSize: 12, color: '#64748B', marginTop: 4 },
  dueDateText: { fontSize: 11, color: '#F59E0B', marginTop: 2, fontWeight: '600' },
  statusCol: { alignItems: 'center' },
  tapHint: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#1E293B', fontSize: 18, fontWeight: '700' },
  emptySubText: { color: '#94A3B8', fontSize: 14, marginTop: 8 },
});

export default MemberDashboard;
