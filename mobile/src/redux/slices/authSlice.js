import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getToken, setToken, clearTokens } from '../../services/tokenStore';
import { authAPI, userAPI } from '../../services/api';

// A timed-out or unreachable request has no `response`, so falling straight
// through to the generic message hid the difference between "the server said
// no" and "the server never answered". The waking-up wording matters because
// the backend sleeps when idle and the retry usually succeeds.
const errorMessage = (err, fallback) => {
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.code === 'ECONNABORTED') return 'Server is waking up — please try again in a moment';
  if (!err.response) return 'Cannot reach the server — check your connection and try again';
  return fallback;
};

export const signin = createAsyncThunk('auth/signin', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.signin(credentials);
    await setToken('accessToken', data.data.tokens.accessToken);
    await setToken('refreshToken', data.data.tokens.refreshToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Sign in failed'));
  }
});

export const signup = createAsyncThunk('auth/signup', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.signup(userData);
    await setToken('accessToken', data.data.tokens.accessToken);
    await setToken('refreshToken', data.data.tokens.refreshToken);
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Sign up failed'));
  }
});

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = await getToken('refreshToken');
    await authAPI.logout(refreshToken);
    await clearTokens();
  } catch (err) {
    await clearTokens();
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = await getToken('accessToken');
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
    return rejectWithValue(errorMessage(err, 'Update failed'));
  }
});

// The backend clears every refresh token on a successful change, so the caller
// is expected to send the user back to sign-in rather than keep a session that
// will die the moment the access token expires.
export const changePassword = createAsyncThunk('auth/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await userAPI.changePassword(payload);
    return data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not change password'));
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
    // Held here rather than in the signup screen's local state because signing
    // up flips isAuthenticated, which swaps the whole navigator out from under
    // that screen. Parking it in the store lets the navigator show the code and
    // makes it impossible to walk past — losing it means losing the account.
    recoveryCode: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    acknowledgeRecoveryCode: (state) => { state.recoveryCode = null; },
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
        state.recoveryCode = action.payload.recoveryCode || null;
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

export const { clearError, acknowledgeRecoveryCode } = authSlice.actions;
export default authSlice.reducer;
