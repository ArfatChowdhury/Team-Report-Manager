import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import WaterRipple from '../../components/common/WaterRipple';
import { loginWithFirebase } from '../../api/authApi';
import { setCredentials, setError, setLoading } from '../../store/slices/authSlice';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));

    try {
      const data = await loginWithFirebase(email, password);
      
      // Store in Redux (this will trigger RootNavigator to switch to the dashboard)
      dispatch(setCredentials({
        user: data.user,
        token: data.token
      }));
      
    } catch (error: any) {
      console.error(error);
      let message = 'An error occurred during login';
      if (error.code === 'auth/user-not-found') message = 'No user found with this email';
      if (error.code === 'auth/wrong-password') message = 'Incorrect password';
      
      Alert.alert('Login Failed', message);
      dispatch(setError(message));
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <WaterRipple />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Team Manager</Text>
            <Text style={styles.subtitle}>Sign in to start reporting</Text>
          </View>
          
          <View style={styles.form}>
            <Input 
              label="Email Address"
              placeholder="admin@teamreport.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <Input 
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <Button 
              title="Sign In" 
              onPress={handleLogin} 
              loading={isSubmitting}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Need help? Contact your administrator
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981', // Emerald Primary
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 24,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

export default LoginScreen;
