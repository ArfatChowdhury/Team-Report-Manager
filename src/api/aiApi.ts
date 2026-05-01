import client from './client';

export const suggestTasks = async (title: string, description: string) => {
  const response = await client.post('/ai/suggest-tasks', { title, description });
  return response.data;
};

export const improveTask = async (title: string, description: string) => {
  const response = await client.post('/ai/improve-task', { title, description });
  return response.data;
};
