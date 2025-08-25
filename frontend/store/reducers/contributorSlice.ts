import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/lib/api";

// Define your data types
interface ContributorState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ContributorState = {
  items: [],
  loading: false,
  error: null,
};

// Create async thunk for fetching data
export const fetchContributors = createAsyncThunk(
  "contributors/fetchContributors",
  async () => {
    const response = await api.get("/api/contributors");
    return response.data;
  }
);

const contributorSlice = createSlice({
  name: "contributors",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContributors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchContributors.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.error = null;
      })
      .addCase(fetchContributors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default contributorSlice.reducer;
