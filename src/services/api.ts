import axios from 'axios';
import { env } from '@/utils/env';
import { store } from '@/store';

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Optionally dispatch logout or token refresh
      // store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
