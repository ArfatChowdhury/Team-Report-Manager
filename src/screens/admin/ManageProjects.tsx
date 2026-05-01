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
      <TouchableOpacity 
        style={styles.projectInfo}
        onPress={() => navigation.navigate('ProjectTasks', { project: item })}
      >
        <Text style={styles.projectTitle}>{item.title}</Text>
        <Text style={styles.projectLeader}>
          Leader: <Text style={styles.leaderName}>{item.leader?.name || 'Unassigned'}</Text>
        </Text>
        {item.deadline && (
          <Text style={styles.deadlineText}>
            Deadline: {new Date(item.deadline).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
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
  container: { flex: 1, backgroundColor: '#020617' },
  listContent: { padding: 16 },
  projectCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC' },
  projectLeader: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  leaderName: { color: '#38BDF8', fontWeight: '600' },
  deadlineText: { fontSize: 11, color: '#FB7185', marginTop: 2, fontWeight: '500' },
  actions: { alignItems: 'flex-end' },
  editBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)' },
  editText: { color: '#38BDF8', fontSize: 12, fontWeight: '700' },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 14 },
  deleteText: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#94A3B8' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#38BDF8', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#38BDF8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  fabText: { fontSize: 32, color: '#020617', fontWeight: '400' },
});

export default ManageProjects;
