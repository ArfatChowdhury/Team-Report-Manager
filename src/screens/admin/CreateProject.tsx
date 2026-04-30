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

const CreateProject = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '', // Backend expects 'title'
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

  const handleCreate = async () => {
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
        <Input 
          placeholder="YYYY-MM-DD (e.g. 2026-05-01)"
          value={formData.deadline}
          onChangeText={(v) => setFormData({...formData, deadline: v})}
        />

        <Text style={styles.label}>Assign a Leader</Text>
        <View style={styles.leaderList}>
          {leaders.length === 0 ? (
            <Text style={styles.helperText}>No leaders available. Create a leader first.</Text>
          ) : (
            leaders.map(l => (
              <TouchableOpacity 
                key={l._id}
                style={[styles.leaderItem, formData.leader === l._id && styles.leaderItemActive]}
                onPress={() => setFormData({...formData, leader: l._id})}
              >
                <Text style={[styles.leaderName, formData.leader === l._id && styles.leaderTextActive]}>
                  {l.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Button 
          title="Create Project" 
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
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 16 },
  leaderList: { marginTop: 8 },
  leaderItem: { 
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 8 
  },
  leaderItemActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  leaderName: { fontSize: 14, color: '#1E293B' },
  leaderTextActive: { color: '#1E40AF', fontWeight: '600' },
  helperText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  submitBtn: { marginTop: 32 },
});

export default CreateProject;
