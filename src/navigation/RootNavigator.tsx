import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import LeaderNavigator from './LeaderNavigator';
import MemberNavigator from './MemberNavigator';

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
