import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import AuthNavigator from './AuthNavigator';
import AdminDashboard from '../screens/admin/AdminDashboard';
import LeaderDashboard from '../screens/leader/LeaderDashboard';
import MemberDashboard from '../screens/member/MemberDashboard';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { token, user } = useSelector((state: RootState) => state.auth);

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
              <Stack.Screen name="AdminMain" component={AdminDashboard} />
            )}
            {user?.role === 'leader' && (
              <Stack.Screen name="LeaderMain" component={LeaderDashboard} />
            )}
            {user?.role === 'member' && (
              <Stack.Screen name="MemberMain" component={MemberDashboard} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
