import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  RefreshControl 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { getAllUsers, deleteUser } from '../../api/usersApi';

const ManageUsers = () => {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Could not load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDelete = (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              setUsers(users.filter(u => u._id !== userId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: any }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <Badge label={item.role} status={item.role === 'leader' ? 'in-progress' : 'todo'} />
        <TouchableOpacity 
          onPress={() => handleDelete(item._id, item.name)}
          style={styles.deleteBtn}
        >
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) return <Loader visible={true} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('CreateUser')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  deleteBtn: {
    marginTop: 8,
  },
  deleteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#64748B',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
});

export default ManageUsers;
