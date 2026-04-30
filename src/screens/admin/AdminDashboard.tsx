import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import client from '../../api/client';
import { getAllUsers } from '../../api/usersApi';
import { getAllProjects } from '../../api/projectsApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, projects: 0, tasks: 0 });
  const [dailyRecap, setDailyRecap] = useState({ totalCompleted: 0, totalMinutes: 0 });
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
      
      setStats({
        users: users.length,
        projects: projects.length,
        tasks: summary.data.totalCompleted
      });
      setDailyRecap(summary.data);
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

  const handleLogout = () => {
    dispatch(logOut());
  };

  // Removed early return to fix Hook order issues


  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      {!loading && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, Admin</Text>
              <Text style={styles.name}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.users}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.projects}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </Card>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('ManageUsers')}
          >
            <Card style={styles.actionCard}>
              <View>
                <Text style={styles.actionTitle}>Manage Team</Text>
                <Text style={styles.actionDesc}>Add leaders or members</Text>
              </View>
              <Badge label="Manage" status="in-progress" />
            </Card>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => navigation.navigate('ManageProjects')}
          >
            <Card style={styles.actionCard}>
              <View>
                <Text style={styles.actionTitle}>Manage Projects</Text>
                <Text style={styles.actionDesc}>Create and assign projects</Text>
              </View>
              <Badge label="Active" status="in-progress" />
            </Card>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Today's Achievement</Text>
          <Card style={styles.recapCard}>
            <View style={styles.recapRow}>
              <View style={styles.recapItem}>
                <Text style={styles.recapVal}>{dailyRecap.totalCompleted}</Text>
                <Text style={styles.recapLab}>Tasks Done</Text>
              </View>
              <View style={styles.recapDivider} />
              <View style={styles.recapItem}>
                <Text style={styles.recapVal}>{dailyRecap.totalMinutes}m</Text>
                <Text style={styles.recapLab}>Time Logged</Text>
              </View>
            </View>
          </Card>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  logoutBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  actionItem: {
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  recapCard: {
    backgroundColor: '#6366F1',
    padding: 20,
    marginBottom: 20,
  },
  recapRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  recapItem: {
    alignItems: 'center',
  },
  recapVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recapLab: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 4,
  },
  recapDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

export default AdminDashboard;
