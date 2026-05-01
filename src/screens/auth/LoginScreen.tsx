import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SkiaStoryBackground from '../../components/common/SkiaStoryBackground';
import { loginWithFirebase } from '../../api/authApi';
import { setCredentials, setError } from '../../store/slices/authSlice';

// ── Firebase error → human message ───────────────────────────────────────────
const FIREBASE_MESSAGES: Record<string, string> = {
  // v9 unified code (Firebase Auth SDK ≥ 22 / RNFB ≥ 21)
  'auth/invalid-credential':   'Email or password is incorrect',
  // Legacy codes (kept for older SDK behaviour / emulator)
  'auth/user-not-found':       'No account found with this email',
  'auth/wrong-password':       'Incorrect password',
  // Other common codes
  'auth/invalid-email':        'Please enter a valid email address',
  'auth/user-disabled':        'This account has been disabled',
  'auth/too-many-requests':    'Too many attempts — please try again later',
  'auth/network-request-failed': 'Network error — check your connection',
};

const friendlyMessage = (code?: string) =>
  (code && FIREBASE_MESSAGES[code]) ?? 'An unexpected error occurred';

// ─────────────────────────────────────────────────────────────────────────────

const LoginScreen = () => {
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [emailError,    setEmailError]    = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading,       setLoading]       = useState(false);

  const dispatch = useDispatch();

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) {
      setEmailError('Please enter your email address');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Please enter your password');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const data = await loginWithFirebase(email.trim(), password);

      // Dispatching setCredentials switches RootNavigator to the app stack
      dispatch(setCredentials({ user: data.user, token: data.token }));

    } catch (error: any) {
      const message = friendlyMessage(error?.code);
      dispatch(setError(message));
      
      // Assign specific errors to fields
      if (error?.code === 'auth/invalid-email' || error?.code === 'auth/user-not-found') {
        setEmailError(message);
      } else if (error?.code === 'auth/wrong-password') {
        setPasswordError(message);
      } else if (error?.code === 'auth/invalid-credential') {
        setPasswordError('Email or password is incorrect');
        setEmailError('Email or password is incorrect');
      } else {
        // Fallback for other errors like network failure
        Alert.alert('Sign In Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // BUG FIX 2: SafeAreaView must have a solid background so
    // Android status-bar and iOS home-indicator insets are painted.
    <SafeAreaView style={styles.root}>

      {/* Skia Animated Background for storytelling synergy */}
      <SkiaStoryBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Team Manager</Text>
            <Text style={styles.subtitle}>Sign in to start reporting</Text>
          </View>

          <View style={[styles.form, styles.glassCard]}>
            <Input
              label="Email Address"
              placeholder="admin@teamreport.com"
              value={email}
              onChangeText={(text) => { setEmail(text); setEmailError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={(text) => { setPassword(text); setPasswordError(''); }}
              secureTextEntry
              error={passwordError}
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
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
  // BUG FIX 2: solid background — matches WaterRipple overlay colour so there
  // is no visible seam, but insets are correctly painted on both platforms.
  root: {
    flex: 1,
    backgroundColor: '#080E24',
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
    color: '#10B981',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  form: {
    width: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
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
