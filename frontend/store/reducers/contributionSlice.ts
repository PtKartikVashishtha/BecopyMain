import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { create } from 'node:domain';
// Define your data types
interface FeedbackState {
  items: any[];
  savedContributions: any[];
  loading: boolean;
  error: string | null;
}

const initialState: FeedbackState = {
  items: [],
  savedContributions: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const newContributions = createAsyncThunk(
  'contributions/newContributions',
  async (data: any) => {
    const response = await api.post('/api/contributions/new', data);
    return response.data;
  }
);

export const savedContributions = createAsyncThunk(
  'contributions/savedContributions',
  async (id: String) => {
    const response = await api.get(`/api/contributions/${id}/savedContributions`);
    return response.data;
  }
)

const contributionSlice = createSlice({
  name: 'contribution',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(newContributions.pending, (state) => {
        state.loading = true;
      })
      .addCase(newContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(newContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(savedContributions.pending, (state) => {
        state.loading = true;
      }).addCase(savedContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.savedContributions = action.payload.data;
        state.error = null;
      }).addCase(savedContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default contributionSlice.reducer;