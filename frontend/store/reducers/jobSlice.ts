import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { jobAPI } from '@/lib/api';

// Define Job type based on your API response structure
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  [key: string]: any; // fallback for extra fields
}

interface Filters {
  search: string;
  company: string;
  location: string;
  salary: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  totalItems: number;
}

interface JobState {
  items: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  filters: Filters;
  pagination: Pagination;
}

const initialState: JobState = {
  items: [],
  currentJob: null,
  loading: false,
  error: null,
  lastFetched: null,
  filters: {
    search: '',
    company: '',
    location: '',
    salary: '',
  },
  pagination: {
    page: 1,
    totalPages: 0,
    totalItems: 0,
  },
};

// Async Thunks
export const fetchJobs = createAsyncThunk<Job[], void, { rejectValue: string }>(
  'jobs/fetchJobs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await jobAPI.getAll();
      return response.data as Job[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJob = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/fetchJob',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobAPI.get(id);
      return response.data as Job;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk<Job, Partial<Job>, { rejectValue: string }>(
  'jobs/createJob',
  async (jobData, { rejectWithValue }) => {
    try {
      const response = await jobAPI.create(jobData);
      return response.data as Job;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create job');
    }
  }
);

export const updateJob = createAsyncThunk<Job, { id: string; data: Partial<Job> }, { rejectValue: string }>(
  'jobs/updateJob',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await jobAPI.update(id, data);
      return response.data as Job;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update job');
    }
  }
);

export const applyToJob = createAsyncThunk<any, FormData, { rejectValue: string }>(
  'jobs/applyToJob',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await jobAPI.apply(formData);
      return response; // not typed specifically since it can vary
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to apply to job');
    }
  }
);

export const toggleJobPin = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/toggleJobPin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobAPI.togglePin(id);
      return response.data as Job;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle job pin');
    }
  }
);

export const newjob = createAsyncThunk("jobs/newjob", async (job: any) => {
  const response = await api.post("/api/jobs/new", job);
  return response.data;
});

// Slice

const jobSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobError(state) {
      state.error = null;
    },
    setJobFilters(state, action: PayloadAction<Partial<Filters>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearJobFilters(state) {
      state.filters = {
        search: '',
        company: '',
        location: '',
        salary: '',
      };
    },
    setPagination(state, action: PayloadAction<Partial<Pagination>>) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentJob(state) {
      state.currentJob = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Jobs
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.lastFetched = Date.now();
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch jobs';
        console.error('Failed to fetch jobs:', action.payload);
      })
      // Fetch Single Job
      .addCase(fetchJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        state.loading = false;
        state.currentJob = action.payload;
        state.error = null;
      })
      .addCase(fetchJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch job';
      })
      // Create Job
      .addCase(createJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create job';
      })
      // Update Job
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentJob && state.currentJob._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })
      // Apply to Job
      .addCase(applyToJob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyToJob.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(applyToJob.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to apply to job';
      })
      // Toggle Job Pin
      .addCase(toggleJobPin.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearJobError, setJobFilters, clearJobFilters, setPagination, clearCurrentJob } =
  jobSlice.actions;

export default jobSlice.reducer;

