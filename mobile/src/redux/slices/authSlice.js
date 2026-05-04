import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../../services/api';

export const signin = createAsyncThunk('auth/signin', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.signin(credentials);
    await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Sign in failed');
  }
});

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.signup(userData);
    await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
    await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Sign up failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await authAPI.logout(refreshToken);
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  } catch (err) {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) return rejectWithValue('No token');
    const { data } = await userAPI.getProfile();
    return data.data;
  } catch (err) {
    return rejectWithValue('Session expired');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await userAPI.updateProfile(profileData);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error?.message || 'Update failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    initializing: true,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(signin.pending, pending)
      .addCase(signin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signin.rejected, rejected)

      .addCase(signup.pending, pending)
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(signup.rejected, rejected)

      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })

      .addCase(loadUser.pending, (state) => { state.initializing = true; })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.initializing = false;
      })
      .addCase(loadUser.rejected, (state) => {
        state.isAuthenticated = false;
        state.initializing = false;
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
