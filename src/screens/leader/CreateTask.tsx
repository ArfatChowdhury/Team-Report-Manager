import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { getMyMembers } from '../../api/usersApi';
import { createTask } from '../../api/tasksApi';

const CreateTask = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { project } = route.params;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: project._id,
    assignedTo: '',
    priority: 'medium',
    dueDate: ''
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await getMyMembers();
        setMembers(data);
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    fetchMembers();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.assignedTo) {
      Alert.alert('Error', 'Please enter a title and select a team member');
      return;
    }

    setLoading(true);
    try {
      await createTask(formData);
      Alert.alert('Success', 'Task assigned successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create task';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAIImprove = async () => {
    if (!formData.title && !formData.description) {
      Alert.alert('Info', 'Please enter a title or description to improve');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/ai/improve-task', {
        title: formData.title,
        description: formData.description
      });
      setFormData({
        ...formData,
        title: res.data.title,
        description: res.data.description
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to improve task writing');
    } finally {
      setLoading(false);
    }
  };

  const priorities = ['low', 'medium', 'high'];

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.projectLabel}>Project: {project.title}</Text>
          <TouchableOpacity onPress={handleAIImprove} style={styles.aiBtn}>
            <Text style={styles.aiBtnText}>✨ AI Improve</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Task Title</Text>
        <Input 
          placeholder="e.g. Implement Login API"
          value={formData.title}
          onChangeText={(v) => setFormData({...formData, title: v})}
        />

        <Text style={styles.label}>Description</Text>
        <Input 
          placeholder="What needs to be done?"
          multiline
          numberOfLines={3}
          style={{ height: 100 }}
          value={formData.description}
          onChangeText={(v) => setFormData({...formData, description: v})}
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityGrid}>
          {priorities.map(p => (
            <TouchableOpacity 
              key={p}
              style={[
                styles.priorityChip, 
                formData.priority === p && styles.priorityChipActive,
                formData.priority === p && p === 'high' && { backgroundColor: '#EF4444', borderColor: '#EF4444' },
                formData.priority === p && p === 'low' && { backgroundColor: '#10B981', borderColor: '#10B981' }
              ]}
              onPress={() => setFormData({...formData, priority: p})}
            >
              <Text style={[styles.priorityText, formData.priority === p && styles.priorityTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Task Deadline</Text>
        <Input 
          placeholder="YYYY-MM-DD (e.g. 2026-05-01)"
          value={formData.dueDate}
          onChangeText={(v) => setFormData({...formData, dueDate: v})}
        />

        <Text style={styles.label}>Assign To Team Member</Text>
        <View style={styles.memberList}>
          {members.length === 0 ? (
            <Text style={styles.helperText}>No members found assigned to you.</Text>
          ) : (
            members.map(m => (
              <TouchableOpacity 
                key={m._id}
                style={[styles.memberItem, formData.assignedTo === m._id && styles.memberItemActive]}
                onPress={() => setFormData({...formData, assignedTo: m._id})}
              >
                <Text style={[styles.memberName, formData.assignedTo === m._id && styles.memberTextActive]}>
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Button 
          title="Assign Task" 
          onPress={handleCreate} 
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { padding: 24 },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  aiBtn: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  aiBtnText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
  },
  projectLabel: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  priorityGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  priorityChip: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  priorityChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  priorityText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  priorityTextActive: { color: '#FFFFFF' },
  memberList: { marginTop: 8 },
  memberItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  memberItemActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  memberName: { fontSize: 14, color: '#1E293B' },
  memberTextActive: { color: '#1E40AF', fontWeight: '600' },
  helperText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  submitBtn: { marginTop: 32 },
});

export default CreateTask;
