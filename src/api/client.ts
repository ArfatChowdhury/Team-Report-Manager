import axios from 'axios';
import { API_BASE_URL } from '@env';
import { store } from '../store';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔌 API Base URL:', API_BASE_URL);


// Request Interceptor: Attach Token
client.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or unauthorized
    if (error.response && error.response.status === 401) {
      // Potentially dispatch logout or handle session expiry
      console.warn('Unauthorized or token expired');
    }
    return Promise.reject(error);
  }
);

export default client;
