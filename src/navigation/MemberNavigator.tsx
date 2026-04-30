import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MemberDashboard from '../screens/member/MemberDashboard';
import TaskDetails from '../screens/common/TaskDetails';

const Stack = createStackNavigator();

const MemberNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1E293B',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen 
        name="MemberDashboard" 
        component={MemberDashboard} 
        options={{ title: 'My Tasks', headerShown: false }}
      />
      <Stack.Screen 
        name="TaskDetails" 
        component={TaskDetails} 
        options={{ title: 'Task Details', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default MemberNavigator;
