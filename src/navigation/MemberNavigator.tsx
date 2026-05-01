import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MemberDashboard from '../screens/member/MemberDashboard';
import TaskDetails from '../screens/common/TaskDetails';

const Stack = createStackNavigator();

const MemberNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#020617', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: '#020617' }
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
