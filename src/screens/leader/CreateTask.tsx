import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';
import Avatar from '../../components/common/Avatar';
import { getMyMembers } from '../../api/usersApi';
import { createTask } from '../../api/tasksApi';
import client from '../../api/client';

const { width } = Dimensions.get('window');

const CreateTask = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { project } = route.params;

  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
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
        <View style={styles.header}>
           <Text style={styles.title}>New Task</Text>
           <Text style={styles.subtitle}>{project.title}</Text>
        </View>

        <View style={styles.aiBox}>
          <Text style={styles.aiText}>Write roughly, let AI polish it.</Text>
          <TouchableOpacity onPress={handleAIImprove} style={styles.aiBtn}>
            <Text style={styles.aiBtnText}>✨ AI Polish</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.label}>Task Identifier</Text>
        <Input 
          placeholder="What needs to be done?"
          value={formData.title}
          onChangeText={(v) => setFormData({...formData, title: v})}
        />

        <Text style={styles.label}>Context & Details</Text>
        <Input 
          placeholder="Provide additional context for the team member..."
          multiline
          numberOfLines={3}
          style={styles.descInput}
          value={formData.description}
          onChangeText={(v) => setFormData({...formData, description: v})}
        />

        <Text style={styles.label}>Assign To</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.memberScroll}
          contentContainerStyle={styles.memberScrollContent}
        >
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No members available</Text>
          ) : (
            members.map(m => (
              <TouchableOpacity 
                key={m._id}
                style={[styles.memberCard, formData.assignedTo === m._id && styles.memberCardActive]}
                onPress={() => setFormData({...formData, assignedTo: m._id})}
              >
                <Avatar name={m.name} size={36} />
                <Text style={[styles.memberName, formData.assignedTo === m._id && styles.memberNameActive]} numberOfLines={1}>
                  {m.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Text style={styles.label}>Priority Level</Text>
        <View style={styles.priorityRow}>
          {priorities.map(p => (
            <TouchableOpacity 
              key={p}
              style={[
                styles.prioChip, 
                formData.priority === p && styles.prioChipActive,
                formData.priority === p && p === 'high' && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: '#EF4444' },
                formData.priority === p && p === 'low' && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: '#10B981' }
              ]}
              onPress={() => setFormData({...formData, priority: p})}
            >
              <Text style={[styles.prioText, formData.priority === p && styles.prioTextActive]}>
                {p.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Project Timeline</Text>
        <TouchableOpacity 
          style={styles.dateSelector} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateValue, !formData.dueDate && styles.datePlaceholder]}>
            {formData.dueDate || 'Select Task Deadline'}
          </Text>
        </TouchableOpacity>

        <CustomDateTimePicker 
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          initialDate={date}
          onConfirm={(selectedDate) => {
            setDate(selectedDate);
            const formatted = selectedDate.toISOString().replace('T', ' ').substring(0, 16);
            setFormData({...formData, dueDate: formatted});
            setShowDatePicker(false);
          }}
        />

        <Button 
          title="Launch Task" 
          onPress={handleCreate} 
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020617' 
  },
  scrollContent: { 
    padding: 24 
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 4,
  },
  aiBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginBottom: 24,
  },
  aiText: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    marginRight: 12,
  },
  aiBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  aiBtnText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '800',
  },
  label: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#94A3B8', 
    marginBottom: 10, 
    marginTop: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  descInput: { 
    height: 120,
    textAlignVertical: 'top',
  },
  memberScroll: {
    marginHorizontal: -24,
    marginTop: 4,
  },
  memberScrollContent: {
    paddingHorizontal: 24,
  },
  memberCard: {
    width: 80,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  memberName: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '600',
  },
  memberNameActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  priorityRow: { 
    flexDirection: 'row', 
    gap: 8,
    marginTop: 4,
  },
  prioChip: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  prioChipActive: { 
    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
    borderColor: '#38BDF8' 
  },
  prioText: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#64748B' 
  },
  prioTextActive: { 
    color: '#F8FAFC' 
  },
  dateSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  datePlaceholder: {
    color: '#64748B',
    fontWeight: '400',
  },
  submitBtn: { 
    marginTop: 40,
    marginBottom: 40,
    backgroundColor: '#38BDF8',
    height: 56,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  }
});

export default CreateTask;

export default CreateTask;
