import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import client from '../../api/client';
import { getAllProjects } from '../../api/projectsApi';
import { getLeaders } from '../../api/usersApi';

interface AITask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
}

const BulkTaskCreation = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectGoal, setProjectGoal] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<AITask[]>([]);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projData, leaderData] = await Promise.all([
          getAllProjects(),
          getLeaders()
        ]);
        setProjects(projData);
        setLeaders(leaderData);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!projectGoal || !selectedProject) {
      Alert.alert('Error', 'Please select a project and enter a goal');
      return;
    }

    setLoading(true);
    try {
      const selectedProj = projects.find(p => p._id === selectedProject);
      const res = await client.post('/ai/suggest-tasks', {
        title: selectedProj.title,
        description: projectGoal
      });
      
      // Default assignment to the first leader if available
      const initialTasks = res.data.map((task: any) => ({
        ...task,
        assignedTo: leaders[0]?._id || ''
      }));
      
      setGeneratedTasks(initialTasks);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate tasks. Please check your Groq API key.');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = (index: number, updates: Partial<AITask>) => {
    const newTasks = [...generatedTasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setGeneratedTasks(newTasks);
  };

  const handleSave = async () => {
    if (generatedTasks.length === 0) return;
    
    const unassigned = generatedTasks.some(t => !t.assignedTo);
    if (unassigned) {
      Alert.alert('Error', 'Please assign a leader to all tasks');
      return;
    }

    setLoading(true);
    try {
      const tasksToSave = generatedTasks.map(t => ({
        ...t,
        project: selectedProject,
        dueDate: dueDate || undefined
      }));

      await client.post('/tasks/bulk', { tasks: tasksToSave });
      Alert.alert('Success', `${generatedTasks.length} tasks created!`, [
        { text: 'Great!', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Bulk AI Task Creation</Text>
        <Text style={styles.subtitle}>Let AI build your project roadmap in seconds.</Text>

        <Text style={styles.label}>1. Select Project</Text>
        <View style={styles.list}>
          {projects.map(p => (
            <TouchableOpacity 
              key={p._id}
              style={[styles.listItem, selectedProject === p._id && styles.listItemActive]}
              onPress={() => setSelectedProject(p._id)}
            >
              <Text style={[styles.listText, selectedProject === p._id && styles.listTextActive]}>
                {p.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>2. Describe the Goal</Text>
        <Input 
          placeholder="e.g. Build a clothing website with Stripe integration..."
          multiline
          numberOfLines={4}
          style={styles.goalInput}
          value={projectGoal}
          onChangeText={setProjectGoal}
        />

        <Text style={styles.label}>3. Set Deadline (Optional)</Text>
        <Input 
          placeholder="YYYY-MM-DD"
          value={dueDate}
          onChangeText={setDueDate}
        />

        <Button 
          title={generatedTasks.length > 0 ? "Re-generate with AI" : "Generate Roadmap with AI"} 
          onPress={handleGenerate}
          type="outline"
          style={styles.genBtn}
        />

        {generatedTasks.length > 0 && (
          <View style={styles.reviewSection}>
            <Text style={styles.sectionTitle}>Review & Assign Tasks</Text>
            {generatedTasks.map((task, idx) => (
              <Card key={idx} style={styles.taskCard}>
                <TextInput 
                  style={styles.taskTitleInput}
                  value={task.title}
                  onChangeText={(v) => updateTask(idx, { title: v })}
                />
                <TextInput 
                  style={styles.taskDescInput}
                  value={task.description}
                  multiline
                  onChangeText={(v) => updateTask(idx, { description: v })}
                />
                
                <View style={styles.taskControls}>
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Priority:</Text>
                    <View style={styles.priorityRow}>
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <TouchableOpacity 
                          key={p} 
                          onPress={() => updateTask(idx, { priority: p })}
                          style={[styles.prioBtn, task.priority === p && styles[`prioBtn_${p}`]]}
                        >
                          <Text style={[styles.prioText, task.priority === p && styles.prioTextActive]}>
                            {p.charAt(0).toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Assign To:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assignScroll}>
                      {leaders.map(l => (
                        <TouchableOpacity 
                          key={l._id} 
                          onPress={() => updateTask(idx, { assignedTo: l._id })}
                          style={[styles.assigneeBtn, task.assignedTo === l._id && styles.assigneeBtnActive]}
                        >
                          <Text style={[styles.assigneeText, task.assignedTo === l._id && styles.assigneeTextActive]}>
                            {l.name.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Card>
            ))}

            <Button 
              title={`Save ${generatedTasks.length} Tasks`}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles: any = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  list: { flexDirection: 'row', flexWrap: 'wrap' },
  listItem: { padding: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, marginBottom: 8, backgroundColor: '#FFF' },
  listItemActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  listText: { fontSize: 12, color: '#64748B' },
  listTextActive: { color: '#FFF', fontWeight: '600' },
  goalInput: { height: 100, textAlignVertical: 'top' },
  genBtn: { marginTop: 20 },
  reviewSection: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  taskCard: { marginBottom: 16, padding: 16 },
  taskTitleInput: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  taskDescInput: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  taskControls: { borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  controlGroup: { marginBottom: 10 },
  controlLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase' },
  priorityRow: { flexDirection: 'row' },
  prioBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, backgroundColor: '#F1F5F9', marginRight: 6 },
  prioBtn_low: { backgroundColor: '#10B981' },
  prioBtn_medium: { backgroundColor: '#F59E0B' },
  prioBtn_high: { backgroundColor: '#EF4444' },
  prioText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  prioTextActive: { color: '#FFF' },
  assignScroll: { flexDirection: 'row' },
  assigneeBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 6 },
  assigneeBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  assigneeText: { fontSize: 11, color: '#64748B' },
  assigneeTextActive: { color: '#FFF', fontWeight: '600' },
  saveBtn: { marginTop: 24, marginBottom: 40 }
});

export default BulkTaskCreation;
