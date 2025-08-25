import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';

// Define your data types
interface DashboardStringState {
  dashboardString: {
    dashString: string,
    fontSize: number,
  },
  loading: boolean;
  error: string | null;
}

const initialState: DashboardStringState = {
  dashboardString: {
    dashString: '',
    fontSize: 10,
  },
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchDashboardString = createAsyncThunk(
  'dashboardstring/fetchDashboardString',
  async () => {
    const response = await api.get('/api/dashboardstring/');
    return response.data;
  }
);

export const updateDashboardString = createAsyncThunk(
  'dashboardstring/updateDashboardString',
  async (dashString: any) => {
    const response = await api.post('/api/dashboardstring/', dashString);
    return response.data;
  }
);

const dashStringSlice = createSlice({
  name: 'dashboardstring',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardString.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardString.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardString = action.payload.data;
        state.error = null;
      })
      .addCase(fetchDashboardString.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      })
      .addCase(updateDashboardString.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDashboardString.fulfilled, (state, action) => {
        state.loading = false;
        console.log(action.payload.data);
        state.dashboardString = action.payload.data;
      })
      .addCase(updateDashboardString.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default dashStringSlice.reducer;