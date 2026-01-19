import axios from 'axios';

// Support both env keys from docs/code and provide a sensible default
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (import.meta as any).env?.VITE_API_URL ||
  'http://localhost:3000';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
});

// Thêm token vào header cho mỗi request
httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
