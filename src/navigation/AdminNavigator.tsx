import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ManageUsers from '../screens/admin/ManageUsers';
import CreateUser from '../screens/admin/CreateUser';
import ManageProjects from '../screens/admin/ManageProjects';
import CreateProject from '../screens/admin/CreateProject';
import EditProject from '../screens/admin/EditProject';

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1E293B',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
        options={{ title: 'Admin Panel', headerShown: false }}
      />
      <Stack.Screen 
        name="ManageUsers" 
        component={ManageUsers} 
        options={{ title: 'Manage Team' }}
      />
      <Stack.Screen 
        name="CreateUser" 
        component={CreateUser} 
        options={{ title: 'New User' }}
      />
      <Stack.Screen 
        name="ManageProjects" 
        component={ManageProjects} 
        options={{ title: 'Projects' }}
      />
      <Stack.Screen 
        name="CreateProject" 
        component={CreateProject} 
        options={{ title: 'New Project' }}
      />
      <Stack.Screen 
        name="EditProject" 
        component={EditProject} 
        options={{ title: 'Edit Project' }}
      />
    </Stack.Navigator>
  );
};

export default AdminNavigator;
