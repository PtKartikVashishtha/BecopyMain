import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
// Define your data types
interface ProgramState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ProgramState = {
  items: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchPrograms = createAsyncThunk(
  'programs/fetchPrograms',
  async () => {
    const response = await api.get('/api/programs');
    return response.data;
  }
);

export const copyProgram = createAsyncThunk(
  'programs/copyProgram',
  async (programId: string) => {
    const response = await api.put(`/api/programs/${programId}/copy`);
    return response.data;
  }
);
export const viewProgram = createAsyncThunk(
  'programs/viewProgram',
  async (programId: string) => {
    const response = await api.put(`/api/programs/${programId}/view`);
    return response.data;
  }
);
export const shareProgram = createAsyncThunk(
  'programs/shareProgram',
  async (programId: string) => {
    const response = await api.put(`/api/programs/${programId}/share`);
    return response.data;
  }
);

const programSlice = createSlice({
  name: 'programs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrograms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPrograms.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchPrograms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(copyProgram.pending, (state) => {
        state.loading = true;

      })
      .addCase(copyProgram.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload.item._id);
        if (index !== -1) {
          state.items[index] = action.payload.item;
        }
        state.error = null;
      })
      .addCase(copyProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(viewProgram.pending, (state) => {
        state.loading = true;
      })
      .addCase(viewProgram.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload.item._id);
        if (index !== -1) {
          state.items[index] = action.payload.item;
        }
        state.error = null;
      })
      .addCase(viewProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(shareProgram.pending, (state) => {
        state.loading = true;
      })
      .addCase(shareProgram.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload.item._id);
        if (index !== -1) {
          state.items[index] = action.payload.item;
        }
        state.error = null;
      })
      .addCase(shareProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default programSlice.reducer;