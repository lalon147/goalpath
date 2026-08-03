import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

export const fetchDashboard = createAsyncThunk('analytics/dashboard', async (_, { rejectWithValue }) => {
  try {
    const { data } = await analyticsAPI.dashboard();
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch dashboard');
  }
});

export const fetchGoalProgress = createAsyncThunk('analytics/goalProgress', async (id, { rejectWithValue }) => {
  try {
    const { data } = await analyticsAPI.goalProgress(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch goal progress');
  }
});

export const fetchHabitStats = createAsyncThunk('analytics/habitStats', async ({ id, params }, { rejectWithValue }) => {
  try {
    const { data } = await analyticsAPI.habitStats(id, params);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch habit stats');
  }
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    dashboard: null,
    goalProgress: null,
    habitStats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.loading = false; state.dashboard = action.payload; })
      .addCase(fetchDashboard.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchGoalProgress.fulfilled, (state, action) => { state.goalProgress = action.payload; })
      .addCase(fetchHabitStats.fulfilled, (state, action) => { state.habitStats = action.payload; });
  },
});

export default analyticsSlice.reducer;
