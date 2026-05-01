import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Dimensions,
  Alert,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Loader from '../../components/common/Loader';
import Badge from '../../components/common/Badge';
import client from '../../api/client';
import { getAllUsers } from '../../api/usersApi';
import { getAllProjects } from '../../api/projectsApi';
import { logout } from '../../api/authApi';
import LiveTimer from '../../components/common/LiveTimer';
import Avatar from '../../components/common/Avatar';
import SkiaDonutChart from '../../components/common/SkiaDonutChart';
import SkiaStoryBackground from '../../components/common/SkiaStoryBackground';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withDelay 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0, pending: 0, totalTasks: 0, highPriorityCount: 0, overdueProjects: 0 });
  const [dailyRecap, setDailyRecap] = useState({ totalCompletedToday: 0, totalMinutes: 0 });
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const fetchData = async () => {
    try {
      const users = await getAllUsers();
      const projects = await getAllProjects();
      const summary = await client.get('/reports/summary');
      const tasksRes = await client.get('/tasks');
      
      const inProgress = tasksRes.data.filter((t: any) => t.status === 'in-progress');
      setActiveTasks(inProgress);

      setStats({
        users: users.length,
        projects: projects.length,
        tasks: summary.data.totalTasks,
        pending: summary.data.totalPending,
        totalTasks: summary.data.totalTasks,
        highPriorityCount: summary.data.highPriorityCount,
        overdueProjects: summary.data.overdueProjects
      });
      setDailyRecap({
        totalCompletedToday: summary.data.totalCompletedToday || 0,
        totalMinutes: summary.data.totalMinutes || 0
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    dispatch(logOut());
  };

  const handleWipeout = () => {
    Alert.alert(
      "🚀 System Wipeout",
      "Are you absolutely sure? This will delete ALL tasks, projects, and members. You cannot undo this.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "WIPE EVERYTHING", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await client.post('/users/wipeout');
              Alert.alert("Success", "System wiped successfully.");
              fetchData();
            } catch (error: any) {
              Alert.alert("Error", error.response?.data?.message || "Wipeout failed");
            } finally {
              setLoading(false);
              await fetchData();
            }
          }
        }
      ]
    );
  };

  const ActionCard = ({ title, desc, icon, onPress, delay }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }]
    }));

    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
        <AnimatedPressable
          onPress={onPress}
          onPressIn={() => (scale.value = withSpring(0.95))}
          onPressOut={() => (scale.value = withSpring(1))}
          style={[styles.glassCard, styles.actionCard, animatedStyle]}
        >
          <View style={styles.iconContainer}>{icon}</View>
          <View>
            <Text style={styles.actionTitle}>{title}</Text>
            <Text style={styles.actionDesc}>{desc}</Text>
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <SkiaStoryBackground />
      <Loader visible={loading} />
      {!loading && (
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
        >
          {/* Futuristic Header */}
          <View style={styles.topHeader}>
            <Animated.View entering={FadeInDown.duration(800)} style={styles.profileSection}>
              <Avatar name={user?.name || 'Admin'} size={56} style={styles.avatarBorder} />
              <View style={styles.headerText}>
                <Text style={styles.timeGreeting}>{getTimeGreeting()},</Text>
                <Text style={styles.adminName}>{user?.name}</Text>
              </View>
            </Animated.View>
            
            <View style={styles.headerActions}>
               <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Log Out</Text>
               </TouchableOpacity>
            </View>
          </View>

          {/* Main Hero Stats */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)} style={[styles.glassCard, styles.heroCard]}>
             <View style={styles.heroLeft}>
                <Text style={styles.heroTitle}>Productivity Score</Text>
                <Text style={styles.heroSubTitle}>Based on current tasks</Text>
                <View style={styles.heroStatsRow}>
                   <View>
                      <Text style={styles.heroStatVal}>{dailyRecap.totalCompletedToday}</Text>
                      <Text style={styles.heroStatLab}>Done</Text>
                   </View>
                   <View style={styles.statDivider} />
                   <View>
                      <Text style={styles.heroStatVal}>{dailyRecap.totalMinutes}m</Text>
                      <Text style={styles.heroStatLab}>Logged</Text>
                   </View>
                </View>
             </View>
             <View style={styles.heroRight}>
                <SkiaDonutChart 
                  completed={stats.totalTasks - stats.pending} 
                  total={stats.totalTasks} 
                  size={120} 
                  strokeWidth={10}
                />
             </View>
          </Animated.View>

          {/* Overdue Alert */}
          {stats.overdueProjects > 0 && (
            <TouchableOpacity 
              style={styles.overdueAlert}
              onPress={() => navigation.navigate('ManageProjects')}
            >
              <Text style={styles.overdueAlertText}>🚨 {stats.overdueProjects} Overdue Projects Found</Text>
            </TouchableOpacity>
          )}

          {/* Quick Bento Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Control Center</Text>
            <TouchableOpacity onPress={() => Share.share({ message: `Admin Summary: ${stats.totalTasks} Tasks` })}>
               <Text style={styles.seeAll}>Share Report</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bentoGrid}>
             <View style={styles.bentoCol}>
                <ActionCard 
                  title="Team" 
                  desc={`${stats.users} Active`} 
                  icon={<Text style={{ fontSize: 24 }}>👥</Text>} 
                  onPress={() => navigation.navigate('ManageUsers')}
                  delay={400}
                />
                <ActionCard 
                  title="Projects" 
                  desc={`${stats.projects} Total`} 
                  icon={<Text style={{ fontSize: 24 }}>📁</Text>} 
                  onPress={() => navigation.navigate('ManageProjects')}
                  delay={600}
                />
             </View>
             <View style={styles.bentoCol}>
                <ActionCard 
                  title="AI Tasks" 
                  desc="Groq Engine" 
                  icon={<Text style={{ fontSize: 24 }}>✨</Text>} 
                  onPress={() => navigation.navigate('BulkTaskCreation')}
                  delay={500}
                />
                <TouchableOpacity 
                  onPress={() => navigation.navigate('TaskExplorer', { filter: 'pending' })}
                  style={[styles.glassCard, styles.miniStatCard]}
                >
                   <Text style={styles.miniLabel}>Pending</Text>
                   <Text style={[styles.miniVal, { color: '#FBBF24' }]}>{stats.pending}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('TaskExplorer', { filter: 'high' })}
                  style={[styles.glassCard, styles.miniStatCard, { marginTop: 12 }]}
                >
                   <Text style={styles.miniLabel}>Urgent</Text>
                   <Text style={[styles.miniVal, { color: '#FB7185' }]}>{stats.highPriorityCount}</Text>
                </TouchableOpacity>
             </View>
          </View>

          {/* Live Activity Feed */}
          {activeTasks.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={styles.sectionTitle}>Live Activity Feed</Text>
              {activeTasks.map((task, index) => (
                <Animated.View 
                  key={task._id} 
                  entering={FadeInRight.delay(700 + (index * 100)).duration(500)}
                  style={[styles.glassCard, styles.activityCard]}
                >
                  <Avatar name={task.assignedTo?.name || 'U'} size={40} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.activityUser}>{task.assignedTo?.name}</Text>
                  </View>
                  <View style={styles.activityEnd}>
                     <Badge label="LIVE" status="in-progress" />
                     <LiveTimer 
                        startedAt={task.startedAt} 
                        allocatedMinutes={task.allocatedMinutes} 
                        status={task.status}
                        style={styles.activityTimer} 
                     />
                  </View>
                </Animated.View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  adminName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  wipeoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  wipeoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 13,
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
  heroCard: {
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  heroLeft: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroSubTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  heroStatVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
  },
  heroStatLab: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
  },
  heroRight: {
    marginLeft: 16,
  },
  overdueAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overdueAlertText: {
    color: '#FB7185',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '600',
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bentoCol: {
    width: '48%',
  },
  actionCard: {
    padding: 14,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  miniStatCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  miniVal: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 14,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  activityUser: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  activityEnd: {
    alignItems: 'flex-end',
  },
  activityTimer: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 4,
  }
});

export default AdminDashboard;
