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
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { getLeaders } from '../../api/usersApi';
import { createProject } from '../../api/projectsApi';
import { suggestTasks } from '../../api/aiApi';
import { createTask, createTasksBulk } from '../../api/tasksApi';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';

const CreateProject = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftTasks, setDraftTasks] = useState<any[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    leader: '',
    deadline: ''
  });

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const data = await getLeaders();
        setLeaders(data);
      } catch (err) {
        console.error('Error fetching leaders:', err);
      }
    };
    fetchLeaders();
  }, []);

  const handleManualCreate = async () => {
    if (!formData.title || !formData.leader) {
      Alert.alert('Error', 'Project title and leader are required');
      return;
    }

    setLoading(true);
    try {
      await createProject(formData);
      Alert.alert('Success', 'Project created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create project';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Please enter a project title first so AI knows what to plan!');
      return;
    }

    setLoading(true);
    try {
      const tasks = await suggestTasks(formData.title, formData.description);
      // Add a 'assignedTo' field to each task for drafting
      const enrichedTasks = tasks.map((t: any) => ({ ...t, assignedTo: '' }));
      setDraftTasks(enrichedTasks);
      setIsDrafting(true);
    } catch (error: any) {
      Alert.alert('AI Error', 'Failed to generate suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      console.log('🚀 Starting project creation...');
      
      // 1. Create the project
      const mainLeader = formData.leader || draftTasks[0]?.assignedTo || leaders[0]?._id;
      
      // Clean up the project data
      const projectPayload = {
        ...formData,
        leader: mainLeader,
        deadline: formData.deadline || null // Convert empty string to null for DB
      };

      const project = await createProject(projectPayload);
      const projectId = project._id;
      console.log('✅ Project created:', projectId);

      // 2. Prepare all tasks for BULK creation
      const tasksToCreate = draftTasks.map(task => ({
        project: projectId,
        title: task.title,
        description: task.description || '',
        assignedTo: task.assignedTo || mainLeader,
        priority: task.priority || 'medium',
        dueDate: formData.deadline || null, // Using the field name from model 'dueDate'
        allocatedMinutes: task.allocatedMinutes || 0
      }));

      console.log(`📝 Sending ${tasksToCreate.length} tasks in bulk...`);
      await createTasksBulk(tasksToCreate);

      Alert.alert('Success', `Project created with ${draftTasks.length} AI tasks!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('❌ Save Error Details:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save project and tasks';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateDraftTask = (index: number, field: string, value: any) => {
    const updated = [...draftTasks];
    updated[index][field] = value;
    setDraftTasks(updated);
  };

  const removeDraftTask = (index: number) => {
    setDraftTasks(draftTasks.filter((_, i) => i !== index));
  };

  const handleSuggestTasks = async () => {
    if (!formData.title || !formData.description) {
      Alert.alert('Error', 'Please enter project title and description');
      return;
    }

    try {
      setLoading(true);
      const tasks = await suggestTasks(formData.title, formData.description, formData.deadline);
      setDraftTasks(tasks);
      setIsDrafting(true);
    } catch (error) {
      Alert.alert('AI Error', 'Failed to generate tasks');
    } finally {
      setLoading(false);
    }
  };

  if (isDrafting) {
    return (
      <SafeAreaView style={styles.container}>
        <Loader visible={loading} />
        <View style={styles.header}>
          <Text style={styles.title}>AI Draft Board</Text>
          <Text style={styles.subtitle}>Refine and prioritize tasks before saving</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {draftTasks.map((task, index) => (
            <View key={index} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View>
                  <Text style={styles.draftLabel}>Task #{index + 1}</Text>
                  {task.allocatedMinutes > 0 && (
                    <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: 'bold', marginTop: 2 }}>
                      ⏱️ {task.allocatedMinutes >= 1440 
                        ? `${(task.allocatedMinutes / 1440).toFixed(1)} Days` 
                        : `${Math.round(task.allocatedMinutes / 60)} Hours`}
                    </Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removeDraftTask(index)}>
                  <Text style={styles.deleteBtn}>Remove</Text>
                </TouchableOpacity>
              </View>

              <Input 
                value={task.title}
                onChangeText={(v) => updateDraftTask(index, 'title', v)}
                style={styles.draftInputTitle}
              />
              
              <Input 
                value={task.description}
                onChangeText={(v) => updateDraftTask(index, 'description', v)}
                multiline
                style={styles.draftInputDesc}
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignLabel}>Priority:</Text>
                  <View style={styles.priorityRow}>
                    {['low', 'medium', 'high'].map(p => (
                      <TouchableOpacity 
                        key={p}
                        style={[
                          styles.priorityTag, 
                          task.priority === p && styles[`priority_${p}`],
                          task.priority === p && styles.priorityActive
                        ]}
                        onPress={() => updateDraftTask(index, 'priority', p)}
                      >
                        <Text style={[styles.priorityText, task.priority === p && styles.priorityTextActive]}>
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              
              <Text style={styles.assignLabel}>Assign Leader (Optional):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leaderScroll}>
                {leaders.map(l => (
                  <TouchableOpacity 
                    key={l._id}
                    style={[styles.smallLeaderItem, task.assignedTo === l._id && styles.leaderItemActive]}
                    onPress={() => updateDraftTask(index, 'assignedTo', l._id)}
                  >
                    <Text style={[styles.smallLeaderName, task.assignedTo === l._id && styles.leaderTextActive]}>
                      {l.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))}

          <Button 
            title={`Launch Project with ${draftTasks.length} Tasks`} 
            onPress={handleSaveAll} 
            style={styles.submitBtn}
          />
          <TouchableOpacity onPress={() => setIsDrafting(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Back to Project Form</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Project Title</Text>
        <Input 
          placeholder="e.g. Website Redesign"
          value={formData.title}
          onChangeText={(v) => setFormData({...formData, title: v})}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <Input 
          placeholder="Brief overview of the project"
          multiline
          numberOfLines={3}
          style={{ height: 100 }}
          value={formData.description}
          onChangeText={(v) => setFormData({...formData, description: v})}
        />

        <Text style={styles.label}>Project Deadline</Text>
        <TouchableOpacity 
          style={styles.dateSelector} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, !formData.deadline && styles.datePlaceholder]}>
            {formData.deadline || 'Select deadline date'}
          </Text>
        </TouchableOpacity>

        <CustomDateTimePicker 
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          initialDate={date}
          onConfirm={(selectedDate) => {
            setDate(selectedDate);
            const formatted = selectedDate.toISOString().replace('T', ' ').substring(0, 16);
            setFormData({ ...formData, deadline: formatted });
            setShowDatePicker(false);
          }}
        />

        <View style={styles.actionSection}>
          <Text style={styles.label}>Choose Creation Path</Text>
          
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={handleAIGenerate}
          >
            <Text style={styles.aiButtonText}>✨ AI Generate Plan</Text>
            <Text style={styles.aiButtonSub}>Let AI brainstorm the tasks for you</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR MANUAL SETUP</Text>
            <View style={styles.line} />
          </View>

          <Text style={styles.label}>Assign Main Project Leader</Text>
          <View style={styles.leaderList}>
            {leaders.map(l => (
              <TouchableOpacity 
                key={l._id}
                style={[styles.leaderItem, formData.leader === l._id && styles.leaderItemActive]}
                onPress={() => setFormData({...formData, leader: l._id})}
              >
                <Text style={[styles.leaderName, formData.leader === l._id && styles.leaderTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button 
            title="Create Project Manually" 
            onPress={handleManualCreate} 
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 24, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  scrollContent: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  
  // AI Button
  aiButton: { 
    backgroundColor: '#EEF2FF', 
    borderWidth: 2, 
    borderColor: '#6366F1', 
    padding: 20, 
    borderRadius: 16, 
    marginTop: 12,
    alignItems: 'center'
  },
  aiButtonText: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  aiButtonSub: { fontSize: 12, color: '#6366F1', marginTop: 4 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  orText: { marginHorizontal: 12, fontSize: 10, fontWeight: '700', color: '#94A3B8' },

  // Draft Board
  taskCard: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1 },
  deleteBtn: { color: '#EF4444', fontSize: 12, fontWeight: '600' },
  taskDesc: { fontSize: 14, color: '#64748B', marginTop: 8, lineHeight: 20 },
  assignLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 16, marginBottom: 8 },
  leaderScroll: { flexDirection: 'row' },
  smallLeaderItem: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 8 
  },
  smallLeaderName: { fontSize: 12, color: '#64748B' },
  
  leaderList: { marginTop: 8 },
  leaderItem: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 8,
    backgroundColor: '#FFFFFF'
  },
  leaderItemActive: { backgroundColor: '#EEF2FF', borderColor: '#6366F1' },
  leaderName: { fontSize: 14, color: '#1E293B' },
  leaderTextActive: { color: '#4F46E5', fontWeight: '700' },
  submitBtn: { marginTop: 24, backgroundColor: '#4F46E5' },
  cancelBtn: { marginTop: 16, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  actionSection: { marginTop: 8 },

  // Date Selector Styles
  dateSelector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
    marginTop: 4,
  },
  dateText: { fontSize: 14, color: '#1E293B' },
  datePlaceholder: { color: '#94A3B8' },

  // New Draft Styles
  draftLabel: { fontSize: 12, fontWeight: '800', color: '#6366F1', textTransform: 'uppercase' },
  draftInputTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', paddingVertical: 8, marginBottom: 4 },
  draftInputDesc: { fontSize: 14, color: '#64748B', height: 80, textAlignVertical: 'top', paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  priorityRow: { flexDirection: 'row', marginTop: 4 },
  priorityTag: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginRight: 8,
    backgroundColor: '#F8FAFC'
  },
  priorityActive: { borderColor: 'transparent' },
  priority_low: { backgroundColor: '#DCFCE7' },
  priority_medium: { backgroundColor: '#FEF9C3' },
  priority_high: { backgroundColor: '#FEE2E2' },
  priorityText: { fontSize: 10, fontWeight: '800', color: '#94A3B8' },
  priorityTextActive: { color: '#1E293B' },
});

export default CreateProject;


