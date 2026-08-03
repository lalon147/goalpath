import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalsAPI, milestonesAPI } from '../../services/api';

export const fetchGoals = createAsyncThunk('goals/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.getAll(params);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

export const fetchGoal = createAsyncThunk('goals/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.getOne(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

export const createGoal = createAsyncThunk('goals/create', async (goalData, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.create(goalData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

export const updateGoal = createAsyncThunk('goals/update', async ({ id, ...goalData }, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.update(id, goalData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

export const deleteGoal = createAsyncThunk('goals/delete', async (id, { rejectWithValue }) => {
  try {
    await goalsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

export const completeMilestone = createAsyncThunk('goals/completeMilestone', async ({ goalId, milestoneId }, { rejectWithValue }) => {
  try {
    await milestonesAPI.complete(goalId, milestoneId);
    const { data } = await goalsAPI.getOne(goalId);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed');
  }
});

const goalsSlice = createSlice({
  name: 'goals',
  initialState: { list: [], selectedGoal: null, pagination: null, loading: false, error: null },
  reducers: {
    clearSelectedGoal: (state) => { state.selectedGoal = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.goals || [];
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchGoals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchGoal.pending, (state) => { state.loading = true; })
      .addCase(fetchGoal.fulfilled, (state, action) => { state.loading = false; state.selectedGoal = action.payload; })
      .addCase(fetchGoal.rejected, (state) => { state.loading = false; })
      .addCase(createGoal.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createGoal.fulfilled, (state, action) => { state.loading = false; state.list.unshift(action.payload); })
      .addCase(createGoal.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const idx = state.list.findIndex(g => g._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedGoal?._id === action.payload._id) state.selectedGoal = action.payload;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.list = state.list.filter(g => g._id !== action.payload);
        if (state.selectedGoal?._id === action.payload) state.selectedGoal = null;
      })
      .addCase(completeMilestone.fulfilled, (state, action) => {
        const idx = state.list.findIndex(g => g._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.selectedGoal = action.payload;
      });
  },
});

export const { clearSelectedGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
