import client from './client';

export const getAllProjects = async () => {
  const response = await client.get('/projects');
  return response.data;
};

export const createProject = async (projectData: any) => {
  const response = await client.post('/projects', projectData);
  return response.data;
};
