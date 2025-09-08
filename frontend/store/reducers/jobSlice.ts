import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { jobAPI } from '@/lib/api';
import { RootState } from '../store';

// Define Job type based on your API response structure
export interface Job {
  _id: string;
  title: string;
  company: string;
  location?: string;
  jobLocation?: string;
  salary?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  deadline?: string;
  howtoapply?: string;
  status?: 'pending' | 'approved' | 'rejected';
  isVisible?: boolean;
  isPinned?: boolean;
  remoteWork?: boolean;
  jobType?: string;
  experienceLevel?: string;
  // Location fields
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  // Meta fields
  createdAt?: string;
  updatedAt?: string;
  recruiter?: {
    _id: string;
    name: string;
    companyName?: string;
    companyLogo?: string;
    email?: string;
  };
  distance?: number; // Added by geo queries
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
  geoFiltered: boolean; // Track if current results are geo-filtered
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
  geoFiltered: false,
};

// ✅ Enhanced fetchJobs with geo support
export const fetchJobs = createAsyncThunk<
  { jobs: Job[]; geoFiltered: boolean; count: number },
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let url = `${baseUrl}/api/jobs/`;

      if (geoParams && geoParams.geoMode && geoParams.lat && geoParams.lng) {
        const params = new URLSearchParams({
          lat: geoParams.lat.toString(),
          lng: geoParams.lng.toString(),
          radius: geoParams.radius?.toString() || '50',
          geoMode: 'true',
          userCountry: geoParams.userCountry || '',
          userCity: geoParams.userCity || '',
        });
        url += `?${params}`;
      }

      console.log('Fetching jobs from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      return {
        jobs: data.data || [],
        geoFiltered: data.geoFiltered || false,
        count: data.count || 0,
      };
    } catch (error: any) {
      console.error('fetchJobs error:', error);
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

// ✅ Dedicated geo jobs fetch
export const fetchGeoJobs = createAsyncThunk<
  { jobs: Job[]; count: number },
  { lat: number; lng: number; radius?: number; userCountry?: string; userCity?: string },
  { rejectValue: string }
>(
  'jobs/fetchGeoJobs',
  async ({ lat, lng, radius = 50, userCountry = '', userCity = '' }, { rejectWithValue }) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
        userCountry,
        userCity,
      });

      const url = `${baseUrl}/api/jobs/near?${params}`;
      console.log('Fetching geo jobs from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      return {
        jobs: data.data || [],
        count: data.count || 0,
      };
    } catch (error: any) {
      console.error('fetchGeoJobs error:', error);
      return rejectWithValue(error.message || 'Failed to fetch geo jobs');
    }
  }
);

// ✅ Fetch single job
export const fetchJob = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/fetchJob',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobAPI.get(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch job');
      }
      return response.data as Job;
    } catch (error: any) {
      console.error('fetchJob error:', error);
      return rejectWithValue(error.message || 'Failed to fetch job');
    }
  }
);

// ✅ Create job with location support
export const createJob = createAsyncThunk<Job, Partial<Job>, { rejectValue: string; state: RootState }>(
  'jobs/createJob',
  async (jobData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { userLocation } = state.geo;

      // Include location data if available
      const enhancedJobData = {
        ...jobData,
        ...(userLocation && userLocation.latitude && userLocation.longitude && {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          country: userLocation.country,
          countryCode: userLocation.countryCode,
          region: userLocation.region,
          city: userLocation.city,
          timezone: userLocation.timezone,
        }),
      };

      console.log('Creating job with enhanced data:', enhancedJobData);

      const response = await jobAPI.create(enhancedJobData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create job');
      }
      return response.data as Job;
    } catch (error: any) {
      console.error('createJob error:', error);
      return rejectWithValue(error.message || 'Failed to create job');
    }
  }
);

// ✅ Enhanced newjob with location support
export const newjob = createAsyncThunk<
  Job,
  any,
  { rejectValue: { message: string; requiresRecruiterSetup?: boolean } }
>(
  'jobs/newjob',
  async (jobData, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const { userLocation } = state.geo;

      // Include location data from geo state if available
      const enhancedJobData = {
        ...jobData,
        ...(userLocation && userLocation.latitude && userLocation.longitude && {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          country: userLocation.country,
          countryCode: userLocation.countryCode,
          region: userLocation.region,
          city: userLocation.city,
          timezone: userLocation.timezone,
        }),
      };

      console.log('Posting job with location data:', enhancedJobData);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enhancedJobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (errorData.requiresRecruiterSetup) {
          return rejectWithValue({
            message: errorData.details || errorData.error,
            requiresRecruiterSetup: true
          });
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        if (data.requiresRecruiterSetup) {
          return rejectWithValue({
            message: data.details || data.error,
            requiresRecruiterSetup: true
          });
        }
        throw new Error(data.error || 'Failed to create job');
      }

      return data.data as Job;
    } catch (error: any) {
      console.error('newjob error:', error);
      return rejectWithValue({
        message: error.message || 'Failed to create job'
      });
    }
  }
);


// ✅ Update job
export const updateJob = createAsyncThunk<Job, { id: string; data: Partial<Job> }, { rejectValue: string }>(
  'jobs/updateJob',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await jobAPI.update(id, data);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update job');
      }
      return response.data as Job;
    } catch (error: any) {
      console.error('updateJob error:', error);
      return rejectWithValue(error.message || 'Failed to update job');
    }
  }
);

// ✅ Apply to job
export const applyToJob = createAsyncThunk<any, FormData, { rejectValue: string }>(
  'jobs/applyToJob',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await jobAPI.apply(formData);
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply to job');
      }
      return response;
    } catch (error: any) {
      console.error('applyToJob error:', error);
      return rejectWithValue(error.message || 'Failed to apply to job');
    }
  }
);

// ✅ Toggle job pin
export const toggleJobPin = createAsyncThunk<Job, string, { rejectValue: string }>(
  'jobs/toggleJobPin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await jobAPI.togglePin(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to toggle job pin');
      }
      return response.data as Job;
    } catch (error: any) {
      console.error('toggleJobPin error:', error);
      return rejectWithValue(error.message || 'Failed to toggle job pin');
    }
  }
);

// ✅ Job slice
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
    setRecruiterSetupRequired(state) {
      state.error = 'Recruiter profile setup required';
      state.loading = false;
    } ,
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
    setCurrentJob(state, action: PayloadAction<Job | null>) {
      state.currentJob = action.payload;
    },
    clearJobs(state) {
      state.items = [];
      state.geoFiltered = false;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchJobs cases
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(newjob.rejected, (state, action) => {
        state.loading = false;
        if (action.payload && typeof action.payload === 'object') {
          state.error = action.payload.message || 'Failed to create job';
          // You can access action.payload.requiresRecruiterSetup if needed
        } else {
          state.error = action.payload || 'Failed to create job';
        }
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.jobs || [];
        state.geoFiltered = action.payload.geoFiltered || false;
        state.lastFetched = Date.now();
        state.error = null;
        state.pagination.totalItems = action.payload.count || 0;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch jobs';
      })

      // fetchGeoJobs cases
      .addCase(fetchGeoJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGeoJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.jobs || [];
        state.geoFiltered = true;
        state.lastFetched = Date.now();
        state.error = null;
        state.pagination.totalItems = action.payload.count || 0;
      })
      .addCase(fetchGeoJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch geo jobs';
      })

      // fetchJob cases
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

      // createJob cases
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

      // newjob cases
      .addCase(newjob.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(newjob.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.items.unshift(action.payload);
        }
        state.error = null;
      })

      // updateJob cases
      .addCase(updateJob.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentJob && state.currentJob._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      })

      // applyToJob cases
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

      // toggleJobPin cases
      .addCase(toggleJobPin.fulfilled, (state, action) => {
        const index = state.items.findIndex((job) => job._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentJob && state.currentJob._id === action.payload._id) {
          state.currentJob = action.payload;
        }
      });
  },
});

export const { 
  clearJobError, 
  setJobFilters, 
  clearJobFilters, 
  setPagination, 
  clearCurrentJob,
  setCurrentJob,
  clearJobs ,
  setRecruiterSetupRequired
} = jobSlice.actions;

export default jobSlice.reducer;