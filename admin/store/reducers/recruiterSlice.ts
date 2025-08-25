import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Define your data types
interface RecruiterState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: RecruiterState = {
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

export const newRecruiter = createAsyncThunk(
  'recruiters/newRecruiter',
  async (recruiter: any) => {
    const response = await api.post('/api/recruiters/new', recruiter);
    return response.data;
  }
);

export const toggleRecruiterPinned = createAsyncThunk(
  'recruiters/toggleRecruiterPinned',
  async (id: any) => {
    const response = await api.get(`/api/recruiters/${id}/pinned`);
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
      })
      .addCase(newRecruiter.pending, (state) => {
        state.loading = true;
      })
      .addCase(newRecruiter.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(newRecruiter.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }).addCase(toggleRecruiterPinned.pending, (state) => {
        state.loading = true;
      }).addCase(toggleRecruiterPinned.fulfilled, (state, action) => {  
        state.loading = false;
        
      }   ).addCase(toggleRecruiterPinned.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }
      );
  },
});

export default recruiterSlice.reducer;