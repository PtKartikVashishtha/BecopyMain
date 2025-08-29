// import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// console.log('API Base URL:', process.env.NEXT_PUBLIC_BACKEND_API_URL);

// const api: AxiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000',
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Add interceptor to attach auth token if available
// api.interceptors.request.use((config) => {
//   const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // Generic request handler (optional wrapper for consistent error handling)
// const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
//   try {
//     const response: AxiosResponse<T> = await api.request(config);
//     return response.data;
//   } catch (error: any) {
//     console.error('API request failed:', config.url, error.response?.data || error.message);
//     throw error.response?.data || error;
//   }
// };

// // Job API methods
// export const jobAPI = {
//   getAll: () => request({ url: '/api/jobs', method: 'GET' }),
//   get: (id: string) => request({ url: `/api/jobs/${id}`, method: 'GET' }),
//   create: (data: any) => request({ url: '/api/jobs/new', method: 'POST', data }),
//   update: (id: string, data: any) => request({ url: `/api/jobs/${id}`, method: 'PUT', data }),
//   apply: (formData: FormData) =>
//     request({
//       url: '/api/upload/apply',
//       method: 'POST',
//       data: formData,
//       headers: { 'Content-Type': 'multipart/form-data' },
//     }),
//   togglePin: (id: string) => request({ url: `/api/jobs/${id}/toggle-pin`, method: 'PATCH' }),
//   updateStatus: (id: string, status: string) =>
//     request({ url: `/api/jobs/${id}/status`, method: 'PATCH', data: { status } }),
//   accept: (id: string) => request({ url: '/api/jobs/accept', method: 'POST', data: { id } }),
//   reject: (id: string) => request({ url: '/api/jobs/reject', method: 'POST', data: { id } }),
//   delete: (id: string) => request({ url: '/api/jobs/delete', method: 'POST', data: { id } }),
// };

// // Recruiter API methods
// export const recruiterAPI = {
//   getAll: () => request({ url: '/api/recruiters', method: 'GET' }),
// };

// export default api;


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

// Chat Invite API methods
export const inviteAPI = {
  // Send invite
  send: (data: { recipientId: string; message: string }) => 
    request({ url: '/api/invites', method: 'POST', data }),
  
  // Get received invites
  getReceived: (params?: { status?: string; page?: number; limit?: number }) =>
    request({ url: '/api/invites', method: 'GET', params }),
  
  // Get sent invites
  getSent: (params?: { status?: string; page?: number; limit?: number }) =>
    request({ url: '/api/invites/sent', method: 'GET', params }),
  
  // Accept invite
  accept: (id: string) => 
    request({ url: `/api/invites/${id}/accept`, method: 'PUT' }),
  
  // Decline invite
  decline: (id: string) => 
    request({ url: `/api/invites/${id}/decline`, method: 'PUT' }),
  
  // Cancel sent invite
  cancel: (id: string) => 
    request({ url: `/api/invites/${id}`, method: 'DELETE' }),
  
  // Get invite statistics
  getStats: () => 
    request({ url: '/api/invites/stats', method: 'GET' }),
  
  // Check if can send invite to user
  checkEligibility: (recipientId: string) => 
    request({ url: `/api/invites/check/${recipientId}`, method: 'GET' }),
};

// Chat API methods
export const chatAPI = {
  // Get user directory
  getUserDirectory: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    userType?: string; 
    country?: string; 
  }) =>
    request({ url: '/api/chat/users', method: 'GET', params }),
  
  // Search users
  searchUsers: (searchTerm: string) =>
    request({ url: '/api/chat/users/search', method: 'GET', params: { q: searchTerm } }),
  
  // Create chat session
  createSession: (data: { inviteId: string }) =>
    request({ url: '/api/chat/session', method: 'POST', data }),
  
  // Get user's chat sessions
  getSessions: (params?: { status?: string; page?: number; limit?: number }) =>
    request({ url: '/api/chat/sessions', method: 'GET', params }),
  
  // Get specific chat session
  getSession: (id: string) =>
    request({ url: `/api/chat/sessions/${id}`, method: 'GET' }),
  
  // Archive chat session
  archiveSession: (id: string) =>
    request({ url: `/api/chat/sessions/${id}/archive`, method: 'PUT' }),
  
  // Block chat session
  blockSession: (id: string) =>
    request({ url: `/api/chat/sessions/${id}/block`, method: 'PUT' }),
  
  // Get TalkJS session token
  getTalkJSToken: () =>
    request({ url: '/api/chat/token', method: 'GET' }),
};

// Combined chat & invite utilities
export const chatUtils = {
  // Get complete user data for chat (directory + invite statuses)
  getUsersForChat: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    userType?: string; 
    country?: string; 
  }) => {
    return chatAPI.getUserDirectory(params);
  },
  
  // Send invite and handle response
  sendInviteWithFeedback: async (recipientId: string, message: string) => {
    try {
      // Check eligibility first
      const eligibility = await inviteAPI.checkEligibility(recipientId);
      if (!eligibility.success || !eligibility.data.canSendInvite) {
        throw new Error(eligibility.data.reason || 'Cannot send invite to this user');
      }
      
      // Send invite
      return await inviteAPI.send({ recipientId, message });
    } catch (error) {
      console.error('Send invite error:', error);
      throw error;
    }
  },
  
  // Accept invite and create chat session
  acceptInviteAndCreateChat: async (inviteId: string) => {
    try {
      // Accept invite
      const inviteResult = await inviteAPI.accept(inviteId);
      
      // Create chat session
      const chatResult = await chatAPI.createSession({ inviteId });
      
      return {
        invite: inviteResult,
        chatSession: chatResult
      };
    } catch (error) {
      console.error('Accept invite and create chat error:', error);
      throw error;
    }
  },
  
  // Get user's complete chat overview
  getChatOverview: async () => {
    try {
      const [inviteStats, activeSessions, pendingInvites] = await Promise.all([
        inviteAPI.getStats(),
        chatAPI.getSessions({ status: 'active', limit: 10 }),
        inviteAPI.getReceived({ status: 'pending', limit: 10 })
      ]);
      
      return {
        stats: inviteStats.data,
        activeSessions: activeSessions.data,
        pendingInvites: pendingInvites.data
      };
    } catch (error) {
      console.error('Get chat overview error:', error);
      throw error;
    }
  }
};

// Type definitions for better TypeScript support
export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'user' | 'recruiter';
  country: string;
  isFeatured?: boolean;
  isPinned?: boolean;
  createdAt?: string;
  inviteStatus?: {
    id: string;
    status: 'pending' | 'accepted' | 'declined';
    direction: 'sent' | 'received';
    createdAt?: string;
    expiresAt?: string;
  };
}

export interface Invite {
  id: string;
  sender?: {
    id: string;
    name: string;
    userType: string;
  };
  recipient?: {
    id: string;
    name: string;
    userType: string;
  };
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  expiresAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
}

export interface ChatSession {
  id: string;
  talkjsConversationId: string;
  otherParticipant: {
    id: string;
    name: string;
    userType: string;
  };
  status: 'active' | 'archived' | 'blocked';
  lastActivity?: string;
  lastMessage?: string;
  messageCount?: number;
  createdAt: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: {
    [key: string]: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default api;