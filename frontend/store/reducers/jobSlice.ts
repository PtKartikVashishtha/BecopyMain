import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { jobAPI } from '@/lib/api';

// Define Job type based on your API response structure
export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  [key: string]: any;
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

// ✅ Unified fetchJobs with optional geo params
export const fetchJobs = createAsyncThunk<
  Job[],
  {
    lat?: number;
    lng?: number;
    radius?: number;
    userCountry?: string;
    userCity?: string;
    geoMode?: boolean;
  } | void,
  { rejectValue: string }
>(
  'jobs/fetchJobs',
  async (geoParams, { rejectWithValue }) => {
    try {
      let url = '/api/jobs';

      if (geoParams && geoParams.geoMode) {
        const params = new URLSearchParams({
          lat: geoParams.lat?.toString() || '0',
          lng: geoParams.lng?.toString() || '0',
          radius: geoParams.radius?.toString() || '250',
          geoMode: 'true',
          userCountry: geoParams.userCountry || '',
          userCity: geoParams.userCity || '',
        });
        url += `?${params}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      return data.data as Job[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

// Optional dedicated geo fetch (kept separate if you want)
export const fetchGeoJobs = createAsyncThunk<
  Job[],
  { lat: number; lng: number; radius?: number; userCountry?: string; userCity?: string },
  { rejectValue: string }
>(
  'jobs/fetchGeoJobs',
  async ({ lat, lng, radius = 250, userCountry = '', userCity = '' }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        geoMode: 'true',
        userCountry,
        userCity,
      });

      const response = await fetch(`/api/jobs/near?${params}`);
      const data = await response.json();
      return data.data as Job[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch geo jobs');
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
      return response;
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
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        state.currentJob = action.payload;
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.currentJob && state.currentJob._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })
      .addCase(applyToJob.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(toggleJobPin.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(fetchGeoJobs.fulfilled, (state, action) => {
        state.items = action.payload || [];
      });
  },
});

export const { clearJobError, setJobFilters, clearJobFilters, setPagination, clearCurrentJob } =
  jobSlice.actions;

export default jobSlice.reducer;
