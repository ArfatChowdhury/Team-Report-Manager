import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getAllProjects } from '../../api/projectsApi';
import client from '../../api/client';

const ManageProjects = () => {
  const navigation = useNavigation<any>();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleDelete = (projectId: string, title: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/projects/${projectId}`);
              fetchProjects();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  const renderProjectItem = ({ item }: { item: any }) => (
    <Card style={styles.projectCard}>
      <View style={styles.projectInfo}>
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectLeader}>
          Leader: <Text style={styles.leaderName}>{item.leader?.name || 'Unassigned'}</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('EditProject', { project: item })}
          style={styles.editBtn}
        >
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => handleDelete(item._id, item.title)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <Loader visible={true} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No projects found</Text>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateProject')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  listContent: { padding: 16 },
  projectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  projectLeader: { fontSize: 13, color: '#64748B', marginTop: 4 },
  leaderName: { color: '#3B82F6', fontWeight: '600' },
  actions: { alignItems: 'flex-end' },
  editBtn: { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#EFF6FF', borderRadius: 6, marginBottom: 6 },
  editText: { color: '#3B82F6', fontSize: 12, fontWeight: '600' },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  deleteText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#64748B' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#FFFFFF', fontWeight: '300' },
});

export default ManageProjects;
