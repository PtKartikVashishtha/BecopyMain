import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

// Define your data types
interface JobState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: JobState = {
  items: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchJobs = createAsyncThunk("jobs/fetchJobs", async () => {
  const response = await api.get("/api/jobs");
  return response.data;
});

export const newjob = createAsyncThunk("jobs/newjob", async (job: any) => {
  const response = await api.post("/api/jobs/new", job);
  return response.data;
});

const jobSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      })
      .addCase(newjob.pending, (state) => {
        state.loading = true;
      })
      .addCase(newjob.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(newjob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default jobSlice.reducer;
