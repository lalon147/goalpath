import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import goalsReducer from './slices/goalsSlice';
import habitsReducer from './slices/habitsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    goals: goalsReducer,
    habits: habitsReducer,
    analytics: analyticsReducer,
  },
});
