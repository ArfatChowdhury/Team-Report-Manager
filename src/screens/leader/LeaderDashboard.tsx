import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import client from '../../api/client';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { getAllProjects } from '../../api/projectsApi';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const LeaderDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ activeTasks: 0, completedToday: 0 });
  
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const fetchData = async () => {
    try {
      const allProjects = await getAllProjects();
      // Filter projects where this user is the leader
      const myProjects = allProjects.filter((p: any) => p.leader?._id === user?._id);
      setProjects(myProjects.sort((a: any, b: any) => a.order - b.order));

      // Fetch some stats
      const summary = await client.get('/reports/summary');
      setStats({
        activeTasks: 0, // Simplified for now
        completedToday: summary.data.totalCompleted || 0
      });
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

  const handleDragEnd = async ({ data }: { data: any[] }) => {
    setProjects(data);
    try {
        // Sync order with backend
        const promises = data.map((proj, index) => 
            client.put(`/projects/${proj._id}`, { order: index })
        );
        await Promise.all(promises);
    } catch (e) {
        Alert.alert('Error', 'Failed to save new order');
    }
  };

  const renderProjectItem = ({ item, drag, isActive }: RenderItemParams<any>) => (
    <ScaleDecorator>
      <TouchableOpacity 
        onLongPress={drag}
        disabled={isActive}
        onPress={() => navigation.navigate('ProjectTasks', { project: item })}
        style={[styles.itemContainer, isActive && styles.itemActive]}
      >
        <Card style={styles.projectCard}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectStats}>Tap to view tasks</Text>
            {item.deadline && (
                <Text style={styles.deadline}>Due: {new Date(item.deadline).toLocaleDateString()}</Text>
            )}
          </View>
          <View style={styles.badgeCol}>
            <Badge label="Leader" status="done" />
            <Text style={styles.dragHint}>Hold to drag</Text>
          </View>
        </Card>
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <View>
            <Text style={styles.welcomeText}>Hello, Leader</Text>
            <Text style={styles.nameText}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={() => dispatch(logOut())} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>

        {loading ? (
            <Loader visible={true} />
        ) : (
            <DraggableFlatList
                data={projects}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item._id}
                renderItem={renderProjectItem}
                ListHeaderComponent={
                    <View style={styles.statsContainer}>
                        <Card style={styles.statsCard}>
                            <Text style={styles.statsVal}>{stats.completedToday}</Text>
                            <Text style={styles.statsLabel}>Tasks Done Today</Text>
                        </Card>
                        <Card style={[styles.statsCard, { backgroundColor: '#6366F1' }]}>
                            <Text style={[styles.statsVal, { color: '#fff' }]}>{projects.length}</Text>
                            <Text style={[styles.statsLabel, { color: '#e0e7ff' }]}>Projects</Text>
                        </Card>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No projects assigned yet.</Text>
                    </View>
                }
            />
        )}
        </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  welcomeText: { fontSize: 14, color: '#64748B' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: 16, justifyContent: 'space-between' },
  statsCard: { flex: 1, marginHorizontal: 8, padding: 16, alignItems: 'center' },
  statsVal: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  statsLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  listContent: { padding: 16 },
  itemContainer: { marginBottom: 12 },
  itemActive: { opacity: 0.9, scale: 1.02 },
  projectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  projectStats: { fontSize: 13, color: '#64748B', marginTop: 4 },
  deadline: { fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' },
  badgeCol: { alignItems: 'center' },
  dragHint: { fontSize: 10, color: '#94A3B8', marginTop: 4, fontStyle: 'italic' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748B', fontSize: 16 },
});

export default LeaderDashboard;
