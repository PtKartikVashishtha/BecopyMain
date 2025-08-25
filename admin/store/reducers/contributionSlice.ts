import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Define your data types
interface ContributionState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ContributionState = {
  items: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchContributions = createAsyncThunk(
  'contributions/fetchContributions',
  async () => {
    const response = await api.get('/api/contributions');
    return response.data;
  }
);

export const accpetContribution = createAsyncThunk(
  'contributions/accpetContribution',
  async (contribution: any) => {
    const response = await api.post('/api/contributions/accept', contribution);
    return response.data;
  }
);

export const rejectContribution = createAsyncThunk(
  'contributions/rejectContribution',
  async (contribution: any) => {
    const response = await api.post('/api/contributions/reject', contribution);
    return response.data;
  }
);
export const deleteContribution = createAsyncThunk(
  'contributions/deleteContribution',
  async (contribution: any) => {
    const response = await api.post('/api/contributions/delete', contribution);
    return response.data;
  }
);
export const fetchStatus = createAsyncThunk(
  'contributions/fetchStatus',
  async (contribution: any) => {
    const response = await api.post('/api/contributions/status', contribution);
    return response.data;
  }
);

export const togglePinnedContribution = createAsyncThunk(
  'contributions/togglePinnedContribution',
  async (id: any) => {
    const response = await api.get(`/api/contributions/${id}/pinned`, );
    return response.data;
  }
);


const contributionSlice = createSlice({
  name: 'contributions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContributions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchContributions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(accpetContribution.pending, (state) => {
        state.loading = true;
      })
      .addCase(accpetContribution.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(accpetContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(rejectContribution.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectContribution.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(rejectContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(deleteContribution.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteContribution.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items.splice(index, 1);
        }
        state.error = null;
      })
      .addCase(deleteContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.loading = false;
        const newStatus = action.payload.data;
        const index = state.items.findIndex(item => item._id === newStatus._id);
        if (index !== -1) {
          state.items[index] = newStatus;
        }
        state.error = null;
      }).addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }).addCase(togglePinnedContribution.pending, (state) => {
        state.loading = true;
      })
      .addCase(togglePinnedContribution.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(togglePinnedContribution.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong'
      })
      ;
  },
});

export default contributionSlice.reducer;