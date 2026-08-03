import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { habitsAPI } from '../../services/api';

export const fetchHabits = createAsyncThunk('habits/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const { data } = await habitsAPI.getAll(params);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to fetch habits');
  }
});

export const createHabit = createAsyncThunk('habits/create', async (habitData, { rejectWithValue }) => {
  try {
    const { data } = await habitsAPI.create(habitData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to create habit');
  }
});

export const updateHabit = createAsyncThunk('habits/update', async ({ id, ...habitData }, { rejectWithValue }) => {
  try {
    const { data } = await habitsAPI.update(id, habitData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to update habit');
  }
});

export const deleteHabit = createAsyncThunk('habits/delete', async (id, { rejectWithValue }) => {
  try {
    await habitsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to delete habit');
  }
});

export const logHabit = createAsyncThunk('habits/log', async ({ id, ...logData }, { rejectWithValue }) => {
  try {
    const { data } = await habitsAPI.log(id, logData);
    return { habitId: id, log: data.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Failed to log habit');
  }
});

const habitsSlice = createSlice({
  name: 'habits',
  initialState: {
    list: [],
    selectedHabit: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabits.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchHabits.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createHabit.fulfilled, (state, action) => { state.list.unshift(action.payload); })

      .addCase(updateHabit.fulfilled, (state, action) => {
        const idx = state.list.findIndex(h => h._id === action.payload._id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      .addCase(deleteHabit.fulfilled, (state, action) => {
        state.list = state.list.filter(h => h._id !== action.payload);
      })

      .addCase(logHabit.fulfilled, (state, action) => {
        const habit = state.list.find(h => h._id === action.payload.habitId);
        if (habit) habit.totalCompletions = (habit.totalCompletions || 0) + 1;
      });
  },
});

export const { clearError } = habitsSlice.actions;
export default habitsSlice.reducer;
