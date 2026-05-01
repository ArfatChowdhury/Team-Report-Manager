import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getProjectTasks, updateTaskStatus } from '../../api/tasksApi';
import { logout } from '../../api/authApi';
import client from '../../api/client';
import LiveTimer from '../../components/common/LiveTimer';
import Avatar from '../../components/common/Avatar';
import SkiaStoryBackground from '../../components/common/SkiaStoryBackground';

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

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).duration(600)}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('TaskDetails', { task: item })}
        onLongPress={() => handleStatusUpdate(item._id, item.status)}
        delayLongPress={200}
      >
        <Card style={[styles.taskCard, item.status === 'done' && styles.taskDone]}>
          <View style={styles.taskInfo}>
            <Text style={styles.projectTitle}>{item.project?.title || 'General'}</Text>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <View style={styles.taskMeta}>
               <Text style={styles.priority}>Priority: {item.priority || 'Medium'}</Text>
               {item.dueDate && (
                 <Text style={styles.dueDateText}> • Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
               )}
            </View>
            {item.status === 'in-progress' && item.allocatedMinutes > 0 && (
              <LiveTimer 
                startedAt={item.startedAt} 
                allocatedMinutes={item.allocatedMinutes} 
                status={item.status} 
                style={styles.timerStyle} 
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
    </Animated.View>
  );

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const pendingCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <SafeAreaView style={styles.container}>
      <SkiaStoryBackground />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.topHeader}>
          <View style={styles.profileSection}>
            <Avatar 
              name={user?.name || 'M'} 
              size={50} 
              style={styles.avatarBorder}
            />
            <View style={styles.headerText}>
              <Text style={styles.timeGreeting}>{getTimeGreeting()}</Text>
              <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={async () => {
              await logout();
              dispatch(logOut());
            }} 
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Mini Stats Grid */}
        <View style={styles.bentoGrid}>
           <Animated.View entering={FadeInRight.delay(200).duration(800)} style={styles.bentoItem}>
              <Card style={styles.bentoCard}>
                 <Text style={styles.bentoVal}>{pendingCount}</Text>
                 <Text style={styles.bentoLabel}>Pending Tasks</Text>
              </Card>
           </Animated.View>
           <Animated.View entering={FadeInRight.delay(400).duration(800)} style={styles.bentoItem}>
              <Card style={[styles.bentoCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                 <Text style={[styles.bentoVal, { color: '#10B981' }]}>{completedCount}</Text>
                 <Text style={styles.bentoLabel}>Completed</Text>
              </Card>
           </Animated.View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Assigned Tasks</Text>
          {loading && <Text style={styles.loadingText}>Updating...</Text>}
        </View>

        {tasks.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks assigned to you yet.</Text>
            <Text style={styles.emptySubText}>Keep up the good work!</Text>
          </View>
        ) : (
          tasks.map((item, index) => (
            <React.Fragment key={item._id}>
              {renderTaskItem({ item, index })}
            </React.Fragment>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  headerText: {
    marginLeft: 14,
  },
  timeGreeting: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 13,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  bentoItem: {
    flex: 1,
  },
  bentoCard: {
    padding: 20,
    alignItems: 'center',
  },
  bentoVal: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  bentoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingText: {
    fontSize: 12,
    color: '#38BDF8',
  },
  taskCard: {
    flexDirection: 'row',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  taskDone: {
    opacity: 0.5,
  },
  taskInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  taskMeta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  priority: {
    fontSize: 11,
    color: '#94A3B8',
  },
  dueDateText: {
    fontSize: 11,
    color: '#FB7185',
    fontWeight: '600',
  },
  timerStyle: {
    marginTop: 10,
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  statusCol: {
    alignItems: 'center',
    marginLeft: 10,
  },
  tapHint: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
});

export default MemberDashboard;

export default MemberDashboard;
