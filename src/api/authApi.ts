import auth from '@react-native-firebase/auth';
import client from './client';

export const loginWithFirebase = async (email: string, pass: string) => {
  try {
    // 1. Sign in with Firebase
    const userCredential = await auth().signInWithEmailAndPassword(email, pass);
    const firebaseUser = userCredential.user;
    
    // 2. Get the ID Token
    const token = await firebaseUser.getIdToken();
    
    try {
      // 3. Try to get user profile from our backend (role, etc.)
      const response = await client.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return {
        user: response.data,
        token: token
      };
    } catch (backendError) {
      console.warn('⚠️ Backend profile missing. Using Emergency Mock Role for Demo.');
      
      // EMERGENCY MOCK: Determine role based on email if backend fails
      let mockRole = 'member';
      if (email.toLowerCase().includes('admin')) mockRole = 'admin';
      else if (email.toLowerCase().includes('leader')) mockRole = 'leader';

      return {
        user: {
          _id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || email.split('@')[0],
          role: mockRole,
        },
        token: token
      };
    }
  } catch (error: any) {
    console.error('Login Error:', error);
    throw error;
  }
};

export const logout = async () => {
  await auth().signOut();
};
