import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logOut } from '../../store/slices/authSlice';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import client from '../../api/client';
import { getAllProjects } from '../../api/projectsApi';

const LeaderDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);

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
        setCompletedToday(summary.data.totalCompleted || 0);
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

  const moveProjectCustom = (fromIndex: number, toIndex: number) => {
    const newList = [...projects];
    if (toIndex < 0) toIndex = 0;
    if (toIndex >= newList.length) toIndex = newList.length - 1;
    
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    setProjects(newList);
  };

  const DraggableProjectItem = ({ item, index }: { item: any; index: number }) => {
    const pan = React.useRef(new Animated.ValueXY()).current;
    
    const panResponder = React.useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([null, { dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: (e, gestureState) => {
          // Approximate height of card is ~100px
          const slotsMoved = Math.round(gestureState.dy / 100);
          if (slotsMoved !== 0) {
            moveProjectCustom(index, index + slotsMoved);
          }
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      })
    ).current;

    return (
      <Animated.View 
        style={[styles.projectCardContainer, { transform: pan.getTranslateTransform(), zIndex: pan.y.interpolate({ inputRange: [-1, 0, 1], outputRange: [10, 1, 10] }) }]}
      >
        <Card style={styles.projectCard}>
          <View style={styles.reorderCol} {...panResponder.panHandlers}>
            <Text style={styles.dragHandle}>≡</Text>
          </View>

          <TouchableOpacity
            style={styles.projectInfo}
            onPress={() => navigation.navigate('ProjectTasks', { project: item })}
          >
            <Text style={styles.projectTitle}>{item.title}</Text>
            <Text style={styles.projectSub}>Tap to manage tasks</Text>
            {item.deadline && (
              <Text style={styles.deadline}>
                Due: {new Date(item.deadline).toLocaleDateString()}
              </Text>
            )}
          </TouchableOpacity>

          <Badge label="Leader" status="done" />
        </Card>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello, Leader 👋</Text>
          <Text style={styles.nameText}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => dispatch(logOut())} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loader visible={true} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => <DraggableProjectItem item={item} index={index} />}
          ListHeaderComponent={
            <View style={styles.statsContainer}>
              <Card style={styles.statsCard}>
                <Text style={styles.statsVal}>{completedToday}</Text>
                <Text style={styles.statsLabel}>Tasks Done Today</Text>
              </Card>
              <Card style={[styles.statsCard, styles.statsCardAccent]}>
                <Text style={[styles.statsVal, { color: '#fff' }]}>{projects.length}</Text>
                <Text style={[styles.statsLabel, { color: '#e0e7ff' }]}>My Projects</Text>
              </Card>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchData} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No projects assigned yet.</Text>
            </View>
          }
        />
      )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  welcomeText: { fontSize: 14, color: '#64748B' },
  nameText: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#EF4444', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  statsCard: { flex: 1, padding: 16, alignItems: 'center' },
  statsCardAccent: { backgroundColor: '#6366F1' },
  statsVal: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  statsLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  listContent: { padding: 16 },
  projectCardContainer: { marginBottom: 12 },
  projectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 2,
  },
  reorderCol: { marginRight: 16, alignItems: 'center', justifyContent: 'center', padding: 8 },
  dragHandle: { fontSize: 24, color: '#94A3B8', fontWeight: 'bold' },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  projectSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  deadline: { fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#64748B', fontSize: 16 },
});

export default LeaderDashboard;
