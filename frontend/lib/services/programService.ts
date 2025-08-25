import api from '../api';

export const programService = {
  async getAllPrograms() {
    try {
      const response = await api.get('/api/programs');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async getProgram(id: string) {
    try {
      const response = await api.get(`/api/programs/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  },

  async submitFeedback(data: {
    type: 'bug' | 'suggestion';
    programId: string;
    code: string;
    description: string;
  }) {
    try {
      const response = await api.post('/api/feedback', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || error.message;
    }
  }
}; 