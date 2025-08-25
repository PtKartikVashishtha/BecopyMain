import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/api';
// Async thunk to fetch settings
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/setting');
      return response.data; // Already the full settings object
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    item: {
      isPostJob: false,
      isApplyJob: false,
      isAddCode: false,
      isJobs: false,
      htmlHeading: "",
      pythonHeading: "",
      javaHeading: "",
      htmlCode: "",
      pythonCode: "",
      javaCode: "",
      htmlBackgroundColor: "",
      javaBackgroundColor: "",
      pythonBackgroundColor: "",
      htmlFontSize: "",
      javaFontSize: "",
      pythonFontSize: "",
      htmlFooterBackgroundColor: "",
      pythonFooterBackgroundColor: "",
      javaFooterBackgroundColor: ""
    },     // store single setting object here
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state : any) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.item = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload.error || 'Something went wrong';
      });
  },
});

export default settingsSlice.reducer;

