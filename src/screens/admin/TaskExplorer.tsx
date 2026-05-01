import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import Avatar from '../../components/common/Avatar';
import client from '../../api/client';
import SkiaStoryBackground from '../../components/common/SkiaStoryBackground';

const TaskExplorer = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { filter } = route.params || {};

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await client.get('/tasks');
      let data = response.data;

      if (filter === 'pending') {
        data = data.filter((t: any) => t.status !== 'done');
      } else if (filter === 'high') {
        data = data.filter((t: any) => t.priority === 'high');
      }

      setTasks(data);
    } catch (error) {
      console.error('Error fetching explorer tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const renderTaskItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(600)}>
      <TouchableOpacity onPress={() => navigation.navigate('TaskDetails', { task: item })}>
        <Card style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <View style={styles.userInfo}>
              <Avatar name={item.assignedTo?.name || 'U'} size={32} />
              <View style={styles.userText}>
                <Text style={styles.taskTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.projectText}>{item.project?.title || 'General'}</Text>
              </View>
            </View>
            <Badge 
              label={item.status} 
              status={item.status === 'done' ? 'done' : item.status === 'in-progress' ? 'in-progress' : 'todo'} 
            />
          </View>
          
          <View style={styles.taskFooter}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Priority:</Text>
              <Text style={[styles.metaValue, item.priority === 'high' && { color: '#FB7185' }]}>
                {item.priority?.toUpperCase() || 'MEDIUM'}
              </Text>
            </View>
            <Text style={styles.assigneeText}>
              Assigned to {item.assignedTo?.name || 'Unassigned'}
            </Text>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <SkiaStoryBackground />
      <Loader visible={loading} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Task Explorer</Text>
          <Text style={styles.headerSub}>Viewing {filter || 'all'} operations</Text>
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item._id}
        renderItem={renderTaskItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No matching tasks found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 24, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255, 255, 255, 0.05)' 
  },
  backBtn: { marginRight: 16 },
  backText: { color: '#F8FAFC', fontSize: 24 },
  headerTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#38BDF8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  listContent: { padding: 20, paddingBottom: 40 },
  taskCard: { padding: 16, marginBottom: 12 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  userText: { marginLeft: 12, flex: 1 },
  taskTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  projectText: { color: '#64748B', fontSize: 12, marginTop: 2 },
  taskFooter: { 
    marginTop: 16, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaLabel: { color: '#64748B', fontSize: 10, textTransform: 'uppercase', marginRight: 4 },
  metaValue: { color: '#38BDF8', fontSize: 10, fontWeight: '800' },
  assigneeText: { color: '#94A3B8', fontSize: 11 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#64748B', fontSize: 16 },
});

export default TaskExplorer;
