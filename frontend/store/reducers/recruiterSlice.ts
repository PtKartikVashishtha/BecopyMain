import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Define your data types
interface ContributorState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ContributorState = {
  items: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchRecruiters = createAsyncThunk(
  'recruiters/fetchRecruiters',
  async () => {
    const response = await api.get('/api/recruiters');
    return response.data;
  }
);

const recruiterSlice = createSlice({
  name: 'recruiters',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecruiters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecruiters.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchRecruiters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default recruiterSlice.reducer;