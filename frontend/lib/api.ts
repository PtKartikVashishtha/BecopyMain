import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

console.log('API Base URL:', process.env.NEXT_PUBLIC_BACKEND_API_URL);

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to attach auth token if available
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Generic request handler (optional wrapper for consistent error handling)
const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await api.request(config);
    return response.data;
  } catch (error: any) {
    console.error('API request failed:', config.url, error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Job API methods
export const jobAPI = {
  getAll: () => request({ url: '/api/jobs', method: 'GET' }),
  get: (id: string) => request({ url: `/api/jobs/${id}`, method: 'GET' }),
  create: (data: any) => request({ url: '/api/jobs/new', method: 'POST', data }),
  update: (id: string, data: any) => request({ url: `/api/jobs/${id}`, method: 'PUT', data }),
  apply: (formData: FormData) =>
    request({
      url: '/api/upload/apply',
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  togglePin: (id: string) => request({ url: `/api/jobs/${id}/toggle-pin`, method: 'PATCH' }),
  updateStatus: (id: string, status: string) =>
    request({ url: `/api/jobs/${id}/status`, method: 'PATCH', data: { status } }),
  accept: (id: string) => request({ url: '/api/jobs/accept', method: 'POST', data: { id } }),
  reject: (id: string) => request({ url: '/api/jobs/reject', method: 'POST', data: { id } }),
  delete: (id: string) => request({ url: '/api/jobs/delete', method: 'POST', data: { id } }),
};

// Recruiter API methods
export const recruiterAPI = {
  getAll: () => request({ url: '/api/recruiters', method: 'GET' }),
};

export default api;
