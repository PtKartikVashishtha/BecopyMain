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
export const fetchContributors = createAsyncThunk(
  'contributors/fetchContributors',
  async () => {
    const response = await api.get('/api/contributors');
    return response.data;
  }
);

export const newContributor = createAsyncThunk(
  'contributors/newContributor',
  async (contributor: any) => {
    const response = await api.post('/api/contributors/new', contributor);
    return response.data;
  }
);
export const toggleContributorPinned = createAsyncThunk(
  'contributors/toggleContributorPinned',
  async (id: any) => {
    const response = await api.get(`/api/contributors/${id}/pinned`);
    return response.data;
  }
);

const contributorSlice = createSlice({
  name: 'contributors',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContributors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchContributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(newContributor.pending, (state) => {
        state.loading = true;
      })
      .addCase(newContributor.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(newContributor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }).addCase(toggleContributorPinned.pending, (state) => {
        state.loading = true; 
      }).addCase(toggleContributorPinned.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      }).addCase(toggleContributorPinned.rejected, (state, action) => {   
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }
      );
  },
});

export default contributorSlice.reducer;