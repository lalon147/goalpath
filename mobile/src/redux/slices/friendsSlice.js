import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { friendsAPI, goalMembersAPI } from '../../services/api';

const errorMessage = (err, fallback) => {
  if (err.response?.data?.error?.message) return err.response.data.error.message;
  if (err.code === 'ECONNABORTED') return 'Server is waking up — please try again in a moment';
  if (!err.response) return 'Cannot reach the server — check your connection and try again';
  return fallback;
};

export const fetchFriends = createAsyncThunk('friends/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await friendsAPI.list();
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load friends'));
  }
});

export const fetchRequests = createAsyncThunk('friends/requests', async (_, { rejectWithValue }) => {
  try {
    const { data } = await friendsAPI.requests();
    return data.data;
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Could not load requests'));
  }
});

export const searchUsers = createAsyncThunk('friends/search', async (q, { rejectWithValue }) => {
  try {
    const { data } = await friendsAPI.search(q);
    return { q, results: data.data };
  } catch (err) {
    return rejectWithValue(errorMessage(err, 'Search failed'));
  }
});

export const sendFriendRequest = createAsyncThunk(
  'friends/send',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await friendsAPI.sendRequest(payload);
      return { ...data.data, ...payload };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Could not send request'));
    }
  }
);

export const respondToRequest = createAsyncThunk(
  'friends/respond',
  async ({ friendshipId, accept }, { dispatch, rejectWithValue }) => {
    try {
      await (accept ? friendsAPI.accept(friendshipId) : friendsAPI.decline(friendshipId));
      // Accepting turns a request into a friend, so both lists are now stale.
      dispatch(fetchRequests());
      if (accept) dispatch(fetchFriends());
      return { friendshipId, accept };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Could not answer that request'));
    }
  }
);

export const removeFriend = createAsyncThunk(
  'friends/remove',
  async (friendshipId, { rejectWithValue }) => {
    try {
      await friendsAPI.remove(friendshipId);
      return friendshipId;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Could not remove'));
    }
  }
);

export const fetchGoalInvitations = createAsyncThunk(
  'friends/goalInvitations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await goalMembersAPI.invitations();
      return data.data;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Could not load goal invitations'));
    }
  }
);

export const respondToGoalInvite = createAsyncThunk(
  'friends/respondGoalInvite',
  async ({ goalId, accept }, { dispatch, rejectWithValue }) => {
    try {
      await goalMembersAPI.respond(goalId, accept);
      dispatch(fetchGoalInvitations());
      return { goalId, accept };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Could not answer that invitation'));
    }
  }
);

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    friends: [],
    incoming: [],
    outgoing: [],
    goalInvitations: [],
    results: [],
    query: '',
    loading: false,
    searching: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearSearch: (state) => { state.results = []; state.query = ''; },
    // Held in the store so a slow response can be matched against what the user
    // has typed by the time it lands.
    setQuery: (state, action) => { state.query = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.incoming = action.payload.incoming;
        state.outgoing = action.payload.outgoing;
      })

      .addCase(searchUsers.pending, (state) => { state.searching = true; })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searching = false;
        // Results from a query the user has already typed past would overwrite
        // newer ones, so a stale response is dropped rather than rendered.
        if (action.payload.q === state.query) state.results = action.payload.results;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searching = false;
        state.error = action.payload;
      })

      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        // Reflect it in the open search results immediately; re-fetching just to
        // flip one label would make the button feel unresponsive.
        const { userId, status } = action.payload;
        state.results = state.results.map((r) =>
          String(r.id) === String(userId)
            ? { ...r, relationship: status === 'accepted' ? 'friends' : 'requested' }
            : r
        );
      })
      .addCase(sendFriendRequest.rejected, (state, action) => { state.error = action.payload; })

      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter((f) => String(f.friendshipId) !== String(action.payload));
        state.outgoing = state.outgoing.filter((f) => String(f.friendshipId) !== String(action.payload));
      })

      .addCase(fetchGoalInvitations.fulfilled, (state, action) => {
        state.goalInvitations = action.payload;
      });
  },
});

export const { clearError, clearSearch, setQuery } = friendsSlice.actions;
export default friendsSlice.reducer;
