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
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import CustomDateTimePicker from '../../components/common/CustomDateTimePicker';
import client from '../../api/client';
import { getAllProjects } from '../../api/projectsApi';
import { getLeaders } from '../../api/usersApi';

const { width, height } = Dimensions.get('window');

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [projectModalVisible, setProjectModalVisible] = useState(false);

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

  const selectedProjName = projects.find(p => p._id === selectedProject)?.title || 'Choose a project...';

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>AI Roadmap Generator</Text>
        <Text style={styles.subtitle}>Transform project goals into actionable tasks.</Text>

        <Text style={styles.label}>1. Target Project</Text>
        <TouchableOpacity 
          style={styles.dropdownTrigger} 
          onPress={() => setProjectModalVisible(true)}
        >
          <Text style={[styles.dropdownText, !selectedProject && styles.dropdownPlaceholder]}>
            {selectedProjName}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <Text style={styles.label}>2. Project Scope & Goals</Text>
        <View style={styles.goalInputWrapper}>
          <TextInput 
            placeholder="Describe what you want to achieve... (e.g. Build a high-performance landing page)"
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={6}
            style={styles.goalInput}
            value={projectGoal}
            onChangeText={setProjectGoal}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.label}>3. Roadmap Deadline (Optional)</Text>
        <TouchableOpacity 
          style={styles.dateSelector} 
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, !dueDate && styles.datePlaceholder]}>
            {dueDate || 'Select deadline for all tasks'}
          </Text>
        </TouchableOpacity>

        <CustomDateTimePicker 
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          initialDate={date}
          onConfirm={(selectedDate) => {
            setDate(selectedDate);
            const formatted = selectedDate.toISOString().replace('T', ' ').substring(0, 16);
            setDueDate(formatted);
            setShowDatePicker(false);
          }}
        />

        <Button 
          title={generatedTasks.length > 0 ? "✨ Re-generate Roadmap" : "✨ Generate AI Roadmap"} 
          onPress={handleGenerate}
          style={styles.genBtn}
        />

        {generatedTasks.length > 0 && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewHeader}>
               <Text style={styles.sectionTitle}>Refine Your Roadmap</Text>
               <Badge label={`${generatedTasks.length} Tasks`} status="in-progress" />
            </View>
            
            {generatedTasks.map((task, idx) => (
              <Card key={idx} style={styles.taskCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.taskIndex}>TASK #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => setGeneratedTasks(generatedTasks.filter((_, i) => i !== idx))}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>

                <TextInput 
                  style={styles.taskTitleInput}
                  value={task.title}
                  placeholder="Task title..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  onChangeText={(v) => updateTask(idx, { title: v })}
                />
                <TextInput 
                  style={styles.taskDescInput}
                  value={task.description}
                  placeholder="Description..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  onChangeText={(v) => updateTask(idx, { description: v })}
                  textAlignVertical="top"
                />
                
                <View style={styles.taskControls}>
                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Priority</Text>
                    <View style={styles.priorityRow}>
                      {(['low', 'medium', 'high'] as const).map(p => (
                        <TouchableOpacity 
                          key={p} 
                          onPress={() => updateTask(idx, { priority: p })}
                          style={[styles.prioBtn, task.priority === p && styles[`prioBtn_${p}`]]}
                        >
                          <Text style={[styles.prioText, task.priority === p && styles.prioTextActive]}>
                            {p.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.controlGroup}>
                    <Text style={styles.controlLabel}>Assign Responsible Leader</Text>
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
              title={`Confirm & Launch Roadmap`}
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        )}
      </ScrollView>

      {/* Project Selection Modal */}
      <Modal
        visible={projectModalVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setProjectModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeaderTitle}>Select Project</Text>
            <FlatList
              data={projects}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, selectedProject === item._id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedProject(item._id);
                    setProjectModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedProject === item._id && styles.modalItemTextActive]}>
                    {item.title}
                  </Text>
                  {selectedProject === item._id && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles: any = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#020617' 
  },
  scrollContent: { 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#F8FAFC' 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#94A3B8', 
    marginBottom: 20,
    marginTop: 4 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#F8FAFC', 
    marginBottom: 10, 
    marginTop: 24 
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  dropdownText: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  dropdownPlaceholder: {
    color: '#64748B',
    fontWeight: '400',
  },
  dropdownIcon: {
    fontSize: 10,
    color: '#64748B',
  },
  goalInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  goalInput: { 
    minHeight: 120, 
    padding: 16,
    fontSize: 15,
    color: '#F8FAFC',
  },
  dateSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  dateText: { 
    fontSize: 14, 
    color: '#F8FAFC' 
  },
  datePlaceholder: { 
    color: '#64748B' 
  },
  genBtn: { 
    marginTop: 30,
    backgroundColor: '#38BDF8',
  },
  reviewSection: { 
    marginTop: 40,
    marginBottom: 40 
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: '#F8FAFC' 
  },
  taskCard: { 
    marginBottom: 20, 
    padding: 20, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIndex: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
  },
  removeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  taskTitleInput: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#F8FAFC', 
    marginBottom: 6,
    padding: 0, 
  },
  taskDescInput: { 
    fontSize: 14, 
    color: '#94A3B8', 
    marginBottom: 20,
    padding: 0,
    lineHeight: 20,
  },
  taskControls: { 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 255, 255, 0.1)', 
    paddingTop: 20 
  },
  controlGroup: { 
    marginBottom: 16 
  },
  controlLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#64748B', 
    marginBottom: 10, 
    textTransform: 'uppercase',
    letterSpacing: 0.5 
  },
  priorityRow: { 
    flexDirection: 'row' 
  },
  prioBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 10, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)' 
  },
  prioBtn_low: { 
    backgroundColor: 'rgba(16, 185, 129, 0.15)', 
    borderColor: '#10B981' 
  },
  prioBtn_medium: { 
    backgroundColor: 'rgba(245, 158, 11, 0.15)', 
    borderColor: '#F59E0B' 
  },
  prioBtn_high: { 
    backgroundColor: 'rgba(239, 68, 68, 0.15)', 
    borderColor: '#EF4444' 
  },
  prioText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#64748B' 
  },
  prioTextActive: { 
    color: '#F8FAFC' 
  },
  assignScroll: { 
    flexDirection: 'row' 
  },
  assigneeBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 7, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.05)', 
    marginRight: 8, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)' 
  },
  assigneeBtnActive: { 
    backgroundColor: 'rgba(56, 189, 248, 0.15)', 
    borderColor: '#38BDF8' 
  },
  assigneeText: { 
    fontSize: 12, 
    color: '#64748B',
    fontWeight: '600' 
  },
  assigneeTextActive: { 
    color: '#38BDF8', 
    fontWeight: '800' 
  },
  saveBtn: { 
    marginTop: 10, 
    marginBottom: 40,
    height: 56, 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalItemActive: {
    borderBottomColor: '#38BDF8',
  },
  modalItemText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  modalItemTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  checkIcon: {
    color: '#38BDF8',
    fontWeight: '800',
  }
});

export default BulkTaskCreation;
