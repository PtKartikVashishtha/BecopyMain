import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async () => {
    const response = await axios.get('/api/notifications');
    return response.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string) => {
    const response = await axios.put(`/api/notifications/${id}/read`);
    return response.data;
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    // ... handle async actions
  }
});

export default notificationSlice.reducer; 