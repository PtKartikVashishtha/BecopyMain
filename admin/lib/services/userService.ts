import api from '../api';

export const userService = {
  async getAllUsers() {
    try {
      const response = await api.get('/api/users');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },
}; 