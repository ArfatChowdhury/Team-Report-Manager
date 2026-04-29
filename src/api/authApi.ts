import auth from '@react-native-firebase/auth';
import client from './client';

export const loginWithFirebase = async (email: string, pass: string) => {
  try {
    // 1. Sign in with Firebase
    const userCredential = await auth().signInWithEmailAndPassword(email, pass);
    const firebaseUser = userCredential.user;
    
    // 2. Get the ID Token
    const token = await firebaseUser.getIdToken();
    
    // 3. Get user profile from our backend (role, etc.)
    const response = await client.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return {
      user: response.data,
      token: token
    };
  } catch (error: any) {
    console.error('Login Error:', error);
    throw error;
  }
};

export const logout = async () => {
  await auth().signOut();
};
