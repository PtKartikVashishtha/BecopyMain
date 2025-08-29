import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getUserLocation, UserLocation } from '@/lib/geo';

interface GeoState {
  geoMode: boolean;
  userLocation: UserLocation | null;
  loading: boolean;
  error: string | null;
  radiusKm: number;
  lastFetch: number | null;
  isDetecting: boolean;
}

const initialState: GeoState = {
  geoMode: false,
  userLocation: null,
  loading: false,
  error: null,
  radiusKm: 250,
  lastFetch: null,
  isDetecting: false,
};

export const fetchUserLocation = createAsyncThunk<
  UserLocation,
  void,
  { rejectValue: string }
>(
  'geo/fetchUserLocation',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { geo: GeoState };
      const now = Date.now();

      if (
        state.geo.lastFetch &&
        now - state.geo.lastFetch < 15 * 60 * 1000 &&
        state.geo.userLocation &&
        state.geo.userLocation.country !== 'Unknown'
      ) {
        return state.geo.userLocation;
      }

      console.log('Fetching fresh location data...');
      const location = await getUserLocation();

      console.log('Location fetched:', location);

      // Never reject hard — return fallback if needed
      if (!location || location.country === 'Unknown') {
        return {
          country: 'Unknown',
          countryCode: 'XX',
          region: 'Unknown',
          city: 'Unknown',
          latitude: 0,
          longitude: 0,
          timezone: 'UTC',
          isp: 'Unknown',
          accuracy: 1000,
        };
      }

      return location;
    } catch (error: any) {
      console.error('Location fetch error:', error);
      return rejectWithValue(error?.message || 'Failed to fetch user location');
    }
  }
);

const geoSlice = createSlice({
  name: 'geo',
  initialState,
  reducers: {
    toggleGeoMode(state) {
      state.geoMode = !state.geoMode;
      console.log('Geo mode toggled to:', state.geoMode);
    },
    setGeoMode(state, action: PayloadAction<boolean>) {
      state.geoMode = action.payload;
    },
    setRadius(state, action: PayloadAction<number>) {
      state.radiusKm = action.payload;
      console.log('Radius set to:', action.payload);
    },
    clearGeoError(state) {
      state.error = null;
    },
    resetGeoLocation(state) {
      state.userLocation = null;
      state.lastFetch = null;
      state.error = null;
      state.loading = false;
    },
    setDetecting(state, action: PayloadAction<boolean>) {
      state.isDetecting = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserLocation.pending, (state) => {
        state.loading = true;
        state.isDetecting = true;
        state.error = null;
        console.log('Starting location detection...');
      })
      .addCase(fetchUserLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.isDetecting = false;
        state.userLocation = action.payload;
        state.lastFetch = Date.now();
        state.error = null;
        console.log('Location detection successful:', action.payload);
      })
      .addCase(fetchUserLocation.rejected, (state, action) => {
        state.loading = false;
        state.isDetecting = false;
        state.error = action.payload || 'Failed to fetch user location';
        console.error('Location detection failed:', action.payload);
      });
  },
});

export const {
  toggleGeoMode,
  setGeoMode,
  setRadius,
  clearGeoError,
  resetGeoLocation,
  setDetecting,
} = geoSlice.actions;

export default geoSlice.reducer;
