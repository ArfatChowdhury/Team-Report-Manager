import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LeaderDashboard from '../screens/leader/LeaderDashboard';
// import ProjectTasks from '../screens/leader/ProjectTasks';
// import CreateTask from '../screens/leader/CreateTask';

const Stack = createStackNavigator();

const LeaderNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1E293B',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen 
        name="LeaderDashboard" 
        component={LeaderDashboard} 
        options={{ title: 'My Projects', headerShown: false }}
      />
      {/* Screens below will be added as we build them */}
    </Stack.Navigator>
  );
};

export default LeaderNavigator;
