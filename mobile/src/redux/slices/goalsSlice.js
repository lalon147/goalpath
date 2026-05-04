import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { goalsAPI, milestonesAPI } from '../../services/api';

export const fetchGoals = createAsyncThunk('goals/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.getAll(params);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch goals');
  }
});

export const fetchGoal = createAsyncThunk('goals/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.getOne(id);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch goal');
  }
});

export const createGoal = createAsyncThunk('goals/create', async (goalData, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.create(goalData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to create goal');
  }
});

export const updateGoal = createAsyncThunk('goals/update', async ({ id, ...goalData }, { rejectWithValue }) => {
  try {
    const { data } = await goalsAPI.update(id, goalData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to update goal');
  }
});

export const deleteGoal = createAsyncThunk('goals/delete', async (id, { rejectWithValue }) => {
  try {
    await goalsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete goal');
  }
});

export const createMilestone = createAsyncThunk('goals/createMilestone', async ({ goalId, ...data }, { rejectWithValue }) => {
  try {
    const { data: res } = await milestonesAPI.create(goalId, data);
    return { goalId, milestone: res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to create milestone');
  }
});

export const completeMilestone = createAsyncThunk('goals/completeMilestone', async ({ goalId, milestoneId }, { rejectWithValue }) => {
  try {
    await milestonesAPI.complete(goalId, milestoneId);
    const { data } = await goalsAPI.getOne(goalId);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to complete milestone');
  }
});

const goalsSlice = createSlice({
  name: 'goals',
  initialState: {
    list: [],
    pagination: null,
    selectedGoal: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSelectedGoal: (state) => { state.selectedGoal = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.goals;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchGoals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchGoal.fulfilled, (state, action) => { state.selectedGoal = action.payload; })

      .addCase(createGoal.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })

      .addCase(updateGoal.fulfilled, (state, action) => {
        const idx = state.list.findIndex(g => g._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedGoal?._id === action.payload._id) state.selectedGoal = action.payload;
      })

      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.list = state.list.filter(g => g._id !== action.payload);
      })

      .addCase(completeMilestone.fulfilled, (state, action) => {
        const idx = state.list.findIndex(g => g._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
        state.selectedGoal = action.payload;
      });
  },
});

export const { clearError, clearSelectedGoal } = goalsSlice.actions;
export default goalsSlice.reducer;
