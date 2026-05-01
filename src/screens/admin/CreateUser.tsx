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
import { createUser, getLeaders } from '../../api/usersApi';

const CreateUser = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'member',
    assignedLeader: ''
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
    if (!formData.name || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare payload: Only send assignedLeader if role is member and it's not empty
      const payload = {
        ...formData,
        assignedLeader: formData.role === 'member' && formData.assignedLeader !== '' 
          ? formData.assignedLeader 
          : undefined
      };

      await createUser(payload);
      Alert.alert('Success', 'User created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to create user';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const roles = ['admin', 'leader', 'member'];

  return (
    <SafeAreaView style={styles.container}>
      <Loader visible={loading} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Full Name</Text>
        <Input 
          placeholder="John Doe"
          value={formData.name}
          onChangeText={(v) => setFormData({...formData, name: v})}
        />

        <Text style={styles.label}>Email Address</Text>
        <Input 
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(v) => setFormData({...formData, email: v})}
        />

        <Text style={styles.label}>Password</Text>
        <Input 
          placeholder="Minimum 6 characters"
          secureTextEntry
          value={formData.password}
          onChangeText={(v) => setFormData({...formData, password: v})}
        />

        <Text style={styles.label}>Select Role</Text>
        <View style={styles.roleGrid}>
          {roles.map(r => (
            <TouchableOpacity 
              key={r}
              style={[styles.roleChip, formData.role === r && styles.roleChipActive]}
              onPress={() => setFormData({...formData, role: r})}
            >
              <Text style={[styles.roleText, formData.role === r && styles.roleTextActive]}>
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {formData.role === 'member' && (
          <>
            <Text style={styles.label}>Assign to Leader</Text>
            <View style={styles.leaderList}>
              {leaders.length === 0 ? (
                <Text style={styles.helperText}>No leaders found. Create a leader first.</Text>
              ) : (
                leaders.map(l => (
                  <TouchableOpacity 
                    key={l._id}
                    style={[styles.leaderItem, formData.assignedLeader === l._id && styles.leaderItemActive]}
                    onPress={() => setFormData({...formData, assignedLeader: l._id})}
                  >
                    <Text style={[styles.leaderName, formData.assignedLeader === l._id && styles.leaderTextActive]}>
                      {l.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}

        <Button 
          title="Create User Account" 
          onPress={handleCreate} 
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { padding: 24 },
  label: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', marginBottom: 8, marginTop: 16 },
  roleGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  roleChip: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  roleChipActive: { backgroundColor: '#38BDF8', borderColor: '#38BDF8' },
  roleText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
  roleTextActive: { color: '#020617' },
  leaderList: { marginTop: 8 },
  leaderItem: { 
    padding: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8 
  },
  leaderItemActive: { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38BDF8' },
  leaderName: { fontSize: 14, color: '#94A3B8' },
  leaderTextActive: { color: '#38BDF8', fontWeight: '700' },
  helperText: { fontSize: 12, color: '#64748B', fontStyle: 'italic' },
  submitBtn: { marginTop: 32 },
});

export default CreateUser;
