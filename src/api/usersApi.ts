import client from './client';

export const getAllUsers = async () => {
  const response = await client.get('/users');
  return response.data;
};

export const createUser = async (userData: any) => {
  const response = await client.post('/users', userData);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await client.delete(`/users/${userId}`);
  return response.data;
};

export const getLeaders = async () => {
  const response = await client.get('/users?role=leader');
  return response.data;
};