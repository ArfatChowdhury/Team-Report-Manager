import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getProjectTasks } from '../../api/tasksApi';
import client from '../../api/client';
import { Alert } from 'react-native';

const ProjectTasks = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { project } = route.params;

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const data = await getProjectTasks(project._id);
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [project._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleAISuggest = async () => {
    try {
      setAiLoading(true);
      const response = await client.post('/ai/suggest-tasks', {
        title: project.title,
        description: project.description
      });
      
      const suggestedTasks = response.data;
      
      Alert.alert(
        'AI Suggestions',
        `Llama-3 suggested ${suggestedTasks.length} tasks. Should I add them to your project?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add All', 
            onPress: async () => {
              try {
                setLoading(true);
                // Create each task
                const promises = suggestedTasks.map((tTitle: string) => 
                  client.post('/tasks', {
                    title: tTitle,
                    project: project._id,
                    assignedTo: null, // Admin/Leader can assign later
                    priority: 'medium'
                  })
                );
                await Promise.all(promises);
                fetchTasks();
              } catch (e) {
                Alert.alert('Error', 'Failed to add AI tasks');
              } finally {
                setLoading(false);
              }
            } 
          }
        ]
      );
    } catch (error) {
      Alert.alert('AI Error', 'Make sure GROQ_API_KEY is in your backend .env');
    } finally {
      setAiLoading(false);
    }
  };

  const renderTaskItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => navigation.navigate('TaskDetails', { task: item })}>
      <Card style={styles.taskCard}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <Text style={styles.assignee}>Assigned to: {item.assignedTo?.name || 'Unassigned'}</Text>
          {item.dueDate && (
            <Text style={styles.dueDateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          )}
        </View>
        <Badge 
          label={item.status} 
          status={item.status === 'done' ? 'done' : item.status === 'in-progress' ? 'in-progress' : 'todo'} 
        />
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerLabel}>Project Tasks</Text>
          <Text style={styles.headerTitle}>{project.title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.aiBtn} 
          onPress={handleAISuggest}
          disabled={aiLoading}
        >
          <Text style={styles.aiBtnText}>{aiLoading ? '...' : 'AI Plan'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tasks found for this project.</Text>
          </View>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTask', { project })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 24, color: '#1E293B', fontWeight: '600' },
  headerTitleContainer: { flex: 1 },
  headerLabel: { fontSize: 12, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  aiBtn: { 
    backgroundColor: '#EEF2FF', 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#6366F1' 
  },
  aiBtnText: { color: '#6366F1', fontWeight: '700', fontSize: 12 },
  listContent: { padding: 16 },
  taskCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  assignee: { fontSize: 13, color: '#64748B', marginTop: 4 },
  dueDateText: { fontSize: 11, color: '#F59E0B', marginTop: 2, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#FFFFFF', fontWeight: '300' },
});

export default ProjectTasks;
