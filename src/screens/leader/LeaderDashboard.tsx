import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getAllProjects } from '../../api/projectsApi';

const LeaderDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const fetchData = async () => {
    try {
      // Backend automatically filters by leader role
      const data = await getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching leader projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    dispatch(logOut());
  };

  const renderProjectItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ProjectTasks', { project: item })}
    >
      <Card style={styles.projectCard}>
        <View>
          <Text style={styles.projectTitle}>{item.title}</Text>
          <Text style={styles.projectDesc} numberOfLines={1}>{item.description || 'No description'}</Text>
        </View>
        <Badge label="Active" status="in-progress" />
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Leader Dashboard</Text>
          <Text style={styles.name}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNum}>{projects.length}</Text>
          <Text style={styles.statLabel}>My Projects</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#6366F1' }]}>0</Text>
          <Text style={styles.statLabel}>Pending Tasks</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Assigned Projects</Text>
      
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No projects assigned to you yet.</Text>
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
    backgroundColor: '#FFFFFF' 
  },
  greeting: { fontSize: 14, color: '#64748B' },
  name: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
  statsRow: { flexDirection: 'row', padding: 16, justifyContent: 'space-between' },
  statCard: { flex: 1, marginHorizontal: 6, alignItems: 'center', paddingVertical: 16 },
  statNum: { fontSize: 24, fontWeight: '800', color: '#10B981' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginLeft: 20, marginBottom: 12, marginTop: 10 },
  listContent: { padding: 16 },
  projectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  projectTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  projectDesc: { fontSize: 13, color: '#64748B', marginTop: 2, maxWidth: 200 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
});

export default LeaderDashboard;
