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
import { getLeaders } from '../../api/usersApi';
import client from '../../api/client';

const EditProject = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { project } = route.params;

  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: project.title,
    description: project.description,
    leader: project.leader?._id || project.leader
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

  const handleUpdate = async () => {
    if (!formData.title || !formData.leader) {
      Alert.alert('Error', 'Project title and leader are required');
      return;
    }

    setLoading(true);
    try {
      await client.put(`/projects/${project._id}`, formData);
      Alert.alert('Success', 'Project updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update project';
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
          placeholder="Project Title"
          value={formData.title}
          onChangeText={(v) => setFormData({...formData, title: v})}
        />

        <Text style={styles.label}>Description</Text>
        <Input 
          placeholder="Description"
          multiline
          numberOfLines={3}
          style={{ height: 100 }}
          value={formData.description}
          onChangeText={(v) => setFormData({...formData, description: v})}
        />

        <Text style={styles.label}>Update Leader</Text>
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
          title="Update Project" 
          onPress={handleUpdate} 
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
  leaderItem: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  leaderItemActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  leaderName: { fontSize: 14, color: '#1E293B' },
  leaderTextActive: { color: '#1E40AF', fontWeight: '600' },
  submitBtn: { marginTop: 32 },
});

export default EditProject;
