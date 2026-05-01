import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { 
  FadeInDown, 
  FadeInRight,
  FadeInUp
} from 'react-native-reanimated';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Avatar from '../../components/common/Avatar';
import SkiaDonutChart from '../../components/common/SkiaDonutChart';
import SkiaStoryBackground from '../../components/common/SkiaStoryBackground';
import client from '../../api/client';
import { getAllProjects } from '../../api/projectsApi';
import { logout } from '../../api/authApi';

const { width } = Dimensions.get('window');

const LeaderDashboard = () => {
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    try {
      const allProjects = await getAllProjects();
      const myProjects = allProjects.filter(
        (p: any) => p.leader?._id === user?._id || p.createdBy?._id === user?._id
      );
      setProjects(myProjects);

      try {
        const summary = await client.get('/reports/summary');
        setCompletedToday(summary.data.totalCompletedToday || 0);
        setTotalTasks(summary.data.totalTasks || 0);
      } catch (_) {}
    } catch (error) {
      console.error('Error fetching leader data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logOut());
    } catch (error) {
      dispatch(logOut());
    }
  };

  const renderProjectItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View key={item._id} entering={FadeInDown.delay(index * 100).duration(600)}>
      <TouchableOpacity onPress={() => navigation.navigate('ProjectTasks', { project: item })}>
        <Card style={styles.projectCard}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectSub}>Tap to manage project tasks</Text>
            {item.deadline && (
              <View style={styles.deadlineRow}>
                <Text style={styles.deadlineLabel}>Deadline:</Text>
                <Text style={styles.deadlineValue}>
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.projectStatus}>
             <Badge label="Active" status="in-progress" />
             <Text style={styles.chevron}>→</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <SkiaStoryBackground />
      <Loader visible={loading} />
      
      {!loading && (
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }
          ]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} tintColor="#38BDF8" />}
        >
          {/* Header Section */}
          <Animated.View entering={FadeInDown.duration(800)} style={styles.topHeader}>
            <View style={styles.profileSection}>
              <Avatar name={user?.name || 'L'} size={50} style={styles.avatarBorder} />
              <View style={styles.headerText}>
                <Text style={styles.timeGreeting}>{getTimeGreeting()}</Text>
                <Text style={styles.leaderName}>{user?.name?.split(' ')[0]}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Productivity Hero Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <Card style={styles.heroCard}>
              <View style={styles.chartInfo}>
                <Text style={styles.heroTitle}>Productivity</Text>
                <Text style={styles.heroSubtitle}>Your team's output today</Text>
                <View style={styles.heroStats}>
                  <View>
                    <Text style={styles.heroStatVal}>{completedToday}</Text>
                    <Text style={styles.heroStatLabel}>Done</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View>
                    <Text style={styles.heroStatVal}>{projects.length}</Text>
                    <Text style={styles.heroStatLabel}>Projects</Text>
                  </View>
                </View>
              </View>
              <View style={styles.chartContainer}>
                <SkiaDonutChart 
                  percentage={totalTasks > 0 ? (completedToday / totalTasks) : 0} 
                  size={90} 
                  strokeWidth={10} 
                />
              </View>
            </Card>
          </Animated.View>

          {/* Bento Stats Grid */}
          <View style={styles.bentoGrid}>
            <Animated.View entering={FadeInRight.delay(400).duration(800)} style={styles.bentoItemLarge}>
              <Card style={styles.bentoCard}>
                <Text style={styles.bentoIcon}>🎯</Text>
                <Text style={styles.bentoVal}>{projects.length}</Text>
                <Text style={styles.bentoLabel}>Active Projects</Text>
              </Card>
            </Animated.View>
            <View style={styles.bentoColumn}>
              <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.bentoItemSmall}>
                <Card style={[styles.bentoCard, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
                  <Text style={styles.bentoSmallVal}>{completedToday}</Text>
                  <Text style={styles.bentoSmallLabel}>Tasks Done</Text>
                </Card>
              </Animated.View>
              <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.bentoItemSmall}>
                <Card style={[styles.bentoCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Text style={[styles.bentoSmallVal, { color: '#10B981' }]}>100%</Text>
                  <Text style={styles.bentoSmallLabel}>Efficiency</Text>
                </Card>
              </Animated.View>
            </View>
          </View>

          {/* Projects List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CreateProject')}>
              <Text style={styles.viewAll}>+ New Project</Text>
            </TouchableOpacity>
          </View>

          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No projects assigned yet.</Text>
            </View>
          ) : (
            projects.map((item, index) => renderProjectItem({ item, index }))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  leaderName: {
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
  heroCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  chartInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 16,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#38BDF8',
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  chartContainer: {
    marginLeft: 16,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    height: 120,
  },
  bentoItemLarge: {
    flex: 1.2,
  },
  bentoColumn: {
    flex: 1,
    gap: 10,
  },
  bentoItemSmall: {
    flex: 1,
  },
  bentoCard: {
    padding: 12,
    height: '100%',
    justifyContent: 'center',
  },
  bentoIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bentoVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  bentoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  bentoSmallVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  bentoSmallLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
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
  },
  viewAll: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '600',
  },
  projectCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  projectSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  deadlineLabel: {
    fontSize: 11,
    color: '#64748B',
    marginRight: 6,
  },
  deadlineValue: {
    fontSize: 11,
    color: '#FB7185',
    fontWeight: '700',
  },
  projectStatus: {
    alignItems: 'flex-end',
  },
  chevron: {
    color: '#334155',
    fontSize: 20,
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 15,
  },
});

export default LeaderDashboard;
