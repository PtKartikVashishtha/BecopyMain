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
    const response = await api.get('/api/programs?all=true');

    return response.data;
  }
);

export const acceptProgram = createAsyncThunk(
  'programs/acceptProgram',
  async (program: any) => {
    const response = await api.post('/api/programs/accept', { id: program });
    return response.data;
  }
);


export const rejectProgram = createAsyncThunk(
  'programs/rejectProgram',
  async (program: any) => {
    const response = await api.post('/api/programs/reject', { id: program });
    return response.data;
  }
);

export const fetchStatus = createAsyncThunk(
  'programs/fetchStatus',
  async (program: any) => {
    const response = await api.post('/api/programs/status', { id: program });
    return response.data;
  }
);

export const togglePinnedProgram = createAsyncThunk(
  'programs/togglePinnedProgram',
  async (id: any) => {
    const response = await api.get(`/api/programs/${id}/pinned`);
    return response.data;
  }
);

export const aproveProgram = createAsyncThunk(
  'programs/aproveProgram',
  async (id: any) => {
    const response = await api.get(`/api/programs/aprrove?id=${id}`);
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
      .addCase(acceptProgram.pending, (state) => {
        state.loading = true;
      })
      .addCase(acceptProgram.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(acceptProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(rejectProgram.pending, (state) => {
        state.loading = true;
      })
      .addCase(rejectProgram.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(rejectProgram.rejected, (state, action) => {
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
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      }).addCase(togglePinnedProgram.pending, (state) => {
        state.loading = true;
      })
      .addCase(togglePinnedProgram.fulfilled, (state, action) => {
        state.loading = false;
        const newStatus = action.payload.data;

      }).addCase(aproveProgram.fulfilled, (state, action) => {
        state.loading == false;

        let newStatus = action.payload.data
        const index = state.items.findIndex(item => item._id === newStatus._id);

        if(index !== 1) {
          state.items[index] = newStatus
        }

      })
      .addCase(togglePinnedProgram.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default programSlice.reducer;