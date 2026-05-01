import client from './client';

export const getProjectTasks = async (projectId: string) => {
  const response = await client.get(`/tasks?project=${projectId}`);
  return response.data;
};

export const createTask = async (taskData: any) => {
  const response = await client.post('/tasks', taskData);
  return response.data;
};

export const createTasksBulk = async (tasks: any[]) => {
  const response = await client.post('/tasks/bulk', { tasks });
  return response.data;
};


export const updateTaskStatus = async (taskId: string, status: string) => {
  const response = await client.put(`/tasks/${taskId}`, { status });
  return response.data;
};

export const carryOverTask = async (taskId: string) => {
  const response = await client.post(`/tasks/${taskId}/carryover`);
  return response.data;
};
