import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { setCredentials } from '../store/slices/authSlice';
import client from '../api/client';
import Loader from '../components/common/Loader';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import LeaderNavigator from './LeaderNavigator';
import MemberNavigator from './MemberNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [initializing, setInitializing] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // If we have a firebase user but no redux state, restore it
          const idToken = await firebaseUser.getIdToken();
          const response = await client.get('/users/profile', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          dispatch(setCredentials({
            user: response.data,
            token: idToken
          }));
        } catch (error) {
          console.error('Failed to restore session:', error);
        }
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, [dispatch]);

  if (initializing) return <Loader visible={true} />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          // 1. If not logged in, show Auth flow
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // 2. If logged in, show the correct dashboard based on role
          <>
            {user?.role === 'admin' && (
              <Stack.Screen name="AdminMain" component={AdminNavigator} />
            )}
            {user?.role === 'leader' && (
              <Stack.Screen name="LeaderMain" component={LeaderNavigator} />
            )}
            {user?.role === 'member' && (
              <Stack.Screen name="MemberMain" component={MemberNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
