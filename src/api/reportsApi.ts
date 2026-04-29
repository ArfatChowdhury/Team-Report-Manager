import client from './client';

export const getAllReports = async () => {
  const response = await client.get('/reports');
  return response.data;
};

export const getDailyStats = async () => {
  const response = await client.get('/reports/daily');
  return response.data;
};
