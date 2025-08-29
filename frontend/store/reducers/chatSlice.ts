import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { chatAPI, chatUtils } from '../../lib/api';
import type { User, ChatSession, APIResponse, PaginatedResponse } from '../../lib/api';

// Types
interface ChatPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface TalkJSSession {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
}

interface ChatOverview {
  stats: any;
  activeSessions: {
    sessions: ChatSession[];
    pagination: ChatPagination;
  };
  pendingInvites: {
    invites: any[];
    pagination: ChatPagination;
  };
}

interface ChatState {
  // User Directory
  userDirectory: User[];
  directoryLoading: boolean;
  directoryError: string | null;
  directoryPagination: ChatPagination | null;
  directoryFilters: {
    search: string;
    userType: string;
    country: string;
  };

  // Chat Sessions
  chatSessions: ChatSession[];
  sessionsLoading: boolean;
  sessionsError: string | null;
  sessionsPagination: ChatPagination | null;

  // Current Chat Session
  currentSession: ChatSession | null;
  currentSessionLoading: boolean;
  currentSessionError: string | null;

  // TalkJS Integration
  talkjsSession: TalkJSSession | null;
  talkjsLoading: boolean;
  talkjsError: string | null;

  // Chat Overview
  overview: ChatOverview | null;
  overviewLoading: boolean;
  overviewError: string | null;

  // Search
  searchResults: User[];
  searchLoading: boolean;
  searchError: string | null;
  searchQuery: string;

  // UI State
  selectedUser: User | null;
  showChatDialog: boolean;
  activeChatId: string | null;
  
  // Action states
  createSessionLoading: boolean;
  createSessionError: string | null;
  sessionActions: {
    [sessionId: string]: {
      archiving?: boolean;
      blocking?: boolean;
      error?: string;
    };
  };
}

const initialState: ChatState = {
  userDirectory: [],
  directoryLoading: false,
  directoryError: null,
  directoryPagination: null,
  directoryFilters: {
    search: '',
    userType: '',
    country: '',
  },

  chatSessions: [],
  sessionsLoading: false,
  sessionsError: null,
  sessionsPagination: null,

  currentSession: null,
  currentSessionLoading: false,
  currentSessionError: null,

  talkjsSession: null,
  talkjsLoading: false,
  talkjsError: null,

  overview: null,
  overviewLoading: false,
  overviewError: null,

  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchQuery: '',

  selectedUser: null,
  showChatDialog: false,
  activeChatId: null,

  createSessionLoading: false,
  createSessionError: null,
  sessionActions: {},
};

// Async Thunks
export const fetchUserDirectory = createAsyncThunk(
  'chat/fetchUserDirectory',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    country?: string;
  } = {}) => {
    const response = await chatAPI.getUserDirectory(params);
    return response;
  }
);

export const searchUsers = createAsyncThunk(
  'chat/searchUsers',
  async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      return { data: { users: [] } };
    }
    const response = await chatAPI.searchUsers(searchTerm);
    return response;
  }
);

export const fetchChatSessions = createAsyncThunk(
  'chat/fetchSessions',
  async (params: { status?: string; page?: number; limit?: number } = {}) => {
    const response = await chatAPI.getSessions(params);
    return response;
  }
);

export const fetchChatSession = createAsyncThunk(
  'chat/fetchSession',
  async (sessionId: string) => {
    const response = await chatAPI.getSession(sessionId);
    return response;
  }
);

export const createChatSession = createAsyncThunk(
  'chat/createSession',
  async (inviteId: string) => {
    const response = await chatAPI.createSession({ inviteId });
    return response;
  }
);

export const fetchTalkJSToken = createAsyncThunk(
  'chat/fetchTalkJSToken',
  async () => {
    const response = await chatAPI.getTalkJSToken();
    return response;
  }
);

export const fetchChatOverview = createAsyncThunk(
  'chat/fetchOverview',
  async () => {
    const response = await chatUtils.getChatOverview();
    return response;
  }
);

export const archiveChatSession = createAsyncThunk(
  'chat/archiveSession',
  async (sessionId: string) => {
    const response = await chatAPI.archiveSession(sessionId);
    return { sessionId, ...response };
  }
);

export const blockChatSession = createAsyncThunk(
  'chat/blockSession',
  async (sessionId: string) => {
    const response = await chatAPI.blockSession(sessionId);
    return { sessionId, ...response };
  }
);

// Slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // UI Actions
    setSelectedUser: (state, action: PayloadAction<User | null>) => {
      state.selectedUser = action.payload;
    },
    showChatDialog: (state) => {
      state.showChatDialog = true;
    },
    hideChatDialog: (state) => {
      state.showChatDialog = false;
      state.selectedUser = null;
    },
    setActiveChatId: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;
    },

    // Filters
    updateDirectoryFilters: (state, action: PayloadAction<Partial<typeof initialState.directoryFilters>>) => {
      state.directoryFilters = { ...state.directoryFilters, ...action.payload };
    },
    clearDirectoryFilters: (state) => {
      state.directoryFilters = {
        search: '',
        userType: '',
        country: '',
      };
    },

    // Search
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      if (action.payload.length < 2) {
        state.searchResults = [];
        state.searchError = null;
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
      state.searchError = null;
    },

    // Clear errors
    clearDirectoryError: (state) => {
      state.directoryError = null;
    },
    clearSessionsError: (state) => {
      state.sessionsError = null;
    },
    clearCurrentSessionError: (state) => {
      state.currentSessionError = null;
    },
    clearTalkJSError: (state) => {
      state.talkjsError = null;
    },
    clearCreateSessionError: (state) => {
      state.createSessionError = null;
    },
    clearSessionActionError: (state, action: PayloadAction<string>) => {
      if (state.sessionActions[action.payload]) {
        delete state.sessionActions[action.payload].error;
      }
    },

    // Real-time updates
    updateUserInviteStatus: (state, action: PayloadAction<{ userId: string; inviteStatus: any }>) => {
      const { userId, inviteStatus } = action.payload;
      
      // Update in directory
      const directoryUser = state.userDirectory.find(user => user.id === userId);
      if (directoryUser) {
        directoryUser.inviteStatus = inviteStatus;
      }

      // Update in search results
      const searchUser = state.searchResults.find(user => user.id === userId);
      if (searchUser) {
        searchUser.inviteStatus = inviteStatus;
      }
    },

    addNewChatSession: (state, action: PayloadAction<ChatSession>) => {
      const existingIndex = state.chatSessions.findIndex(
        session => session.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.chatSessions.unshift(action.payload);
      }
    },

    updateChatSessionActivity: (state, action: PayloadAction<{
      sessionId: string;
      lastMessage?: string;
      lastActivity?: string;
      messageCount?: number;
    }>) => {
      const { sessionId, lastMessage, lastActivity, messageCount } = action.payload;
      const session = state.chatSessions.find(s => s.id === sessionId);
      if (session) {
        if (lastMessage) session.lastMessage = lastMessage;
        if (lastActivity) session.lastActivity = lastActivity;
        if (messageCount) session.messageCount = messageCount;
      }

      if (state.currentSession && state.currentSession.id === sessionId) {
        if (lastMessage) state.currentSession.lastMessage = lastMessage;
        if (lastActivity) state.currentSession.lastActivity = lastActivity;
        if (messageCount) state.currentSession.messageCount = messageCount;
      }
    },

    // Reset states
    resetUserDirectory: (state) => {
      state.userDirectory = [];
      state.directoryPagination = null;
      state.directoryError = null;
    },
    resetChatSessions: (state) => {
      state.chatSessions = [];
      state.sessionsPagination = null;
      state.sessionsError = null;
    },
    resetCurrentSession: (state) => {
      state.currentSession = null;
      state.currentSessionError = null;
    },
    resetTalkJSSession: (state) => {
      state.talkjsSession = null;
      state.talkjsError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch user directory
    builder
      .addCase(fetchUserDirectory.pending, (state) => {
        state.directoryLoading = true;
        state.directoryError = null;
      })
      .addCase(fetchUserDirectory.fulfilled, (state, action) => {
        state.directoryLoading = false;
        state.userDirectory = action.payload.data.users;
        state.directoryPagination = action.payload.data.pagination;
      })
      .addCase(fetchUserDirectory.rejected, (state, action) => {
        state.directoryLoading = false;
        state.directoryError = action.error.message || 'Failed to fetch user directory';
      })

    // Search users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.data.users;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.error.message || 'Failed to search users';
      })

    // Fetch chat sessions
    builder
      .addCase(fetchChatSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(fetchChatSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.chatSessions = action.payload.data.sessions;
        state.sessionsPagination = action.payload.data.pagination;
      })
      .addCase(fetchChatSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.error.message || 'Failed to fetch chat sessions';
      })

    // Fetch current session
    builder
      .addCase(fetchChatSession.pending, (state) => {
        state.currentSessionLoading = true;
        state.currentSessionError = null;
      })
      .addCase(fetchChatSession.fulfilled, (state, action) => {
        state.currentSessionLoading = false;
        state.currentSession = action.payload.data.session;
      })
      .addCase(fetchChatSession.rejected, (state, action) => {
        state.currentSessionLoading = false;
        state.currentSessionError = action.error.message || 'Failed to fetch chat session';
      })

    // Create chat session
    builder
      .addCase(createChatSession.pending, (state) => {
        state.createSessionLoading = true;
        state.createSessionError = null;
      })
      .addCase(createChatSession.fulfilled, (state, action) => {
        state.createSessionLoading = false;
        const newSession = action.payload.data.chatSession;
        // Add to sessions if not already there
        const existingIndex = state.chatSessions.findIndex(s => s.id === newSession.id);
        if (existingIndex === -1) {
          state.chatSessions.unshift(newSession);
        }
        state.currentSession = newSession;
      })
      .addCase(createChatSession.rejected, (state, action) => {
        state.createSessionLoading = false;
        state.createSessionError = action.error.message || 'Failed to create chat session';
      })

    // Fetch TalkJS token
    builder
      .addCase(fetchTalkJSToken.pending, (state) => {
        state.talkjsLoading = true;
        state.talkjsError = null;
      })
      .addCase(fetchTalkJSToken.fulfilled, (state, action) => {
        state.talkjsLoading = false;
        state.talkjsSession = action.payload.data;
      })
      .addCase(fetchTalkJSToken.rejected, (state, action) => {
        state.talkjsLoading = false;
        state.talkjsError = action.error.message || 'Failed to get TalkJS token';
      })

    // Fetch chat overview
    builder
      .addCase(fetchChatOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchChatOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload;
      })
      .addCase(fetchChatOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.error.message || 'Failed to fetch chat overview';
      })

    // Archive session
    builder
      .addCase(archiveChatSession.pending, (state, action) => {
        const sessionId = action.meta.arg;
        if (!state.sessionActions[sessionId]) {
          state.sessionActions[sessionId] = {};
        }
        state.sessionActions[sessionId].archiving = true;
        delete state.sessionActions[sessionId].error;
      })
      .addCase(archiveChatSession.fulfilled, (state, action) => {
        const { sessionId } = action.payload;
        const session = state.chatSessions.find(s => s.id === sessionId);
        if (session) {
          session.status = 'archived';
        }
        if (state.sessionActions[sessionId]) {
          state.sessionActions[sessionId].archiving = false;
        }
      })
      .addCase(archiveChatSession.rejected, (state, action) => {
        const sessionId = action.meta.arg;
        if (state.sessionActions[sessionId]) {
          state.sessionActions[sessionId].archiving = false;
          state.sessionActions[sessionId].error = action.error.message || 'Failed to archive session';
        }
      })

    // Block session
    builder
      .addCase(blockChatSession.pending, (state, action) => {
        const sessionId = action.meta.arg;
        if (!state.sessionActions[sessionId]) {
          state.sessionActions[sessionId] = {};
        }
        state.sessionActions[sessionId].blocking = true;
        delete state.sessionActions[sessionId].error;
      })
      .addCase(blockChatSession.fulfilled, (state, action) => {
        const { sessionId } = action.payload;
        const session = state.chatSessions.find(s => s.id === sessionId);
        if (session) {
          session.status = 'blocked';
        }
        if (state.sessionActions[sessionId]) {
          state.sessionActions[sessionId].blocking = false;
        }
      })
      .addCase(blockChatSession.rejected, (state, action) => {
        const sessionId = action.meta.arg;
        if (state.sessionActions[sessionId]) {
          state.sessionActions[sessionId].blocking = false;
          state.sessionActions[sessionId].error = action.error.message || 'Failed to block session';
        }
      });
  },
});

export const {
  setSelectedUser,
  showChatDialog,
  hideChatDialog,
  setActiveChatId,
  updateDirectoryFilters,
  clearDirectoryFilters,
  setSearchQuery,
  clearSearchResults,
  clearDirectoryError,
  clearSessionsError,
  clearCurrentSessionError,
  clearTalkJSError,
  clearCreateSessionError,
  clearSessionActionError,
  updateUserInviteStatus,
  addNewChatSession,
  updateChatSessionActivity,
  resetUserDirectory,
  resetChatSessions,
  resetCurrentSession,
  resetTalkJSSession,
} = chatSlice.actions;

// Selectors
export const selectUserDirectory = (state: { chat: ChatState }) => state.chat.userDirectory;
export const selectDirectoryLoading = (state: { chat: ChatState }) => state.chat.directoryLoading;
export const selectDirectoryFilters = (state: { chat: ChatState }) => state.chat.directoryFilters;
export const selectChatSessions = (state: { chat: ChatState }) => state.chat.chatSessions;
export const selectCurrentSession = (state: { chat: ChatState }) => state.chat.currentSession;
export const selectTalkJSSession = (state: { chat: ChatState }) => state.chat.talkjsSession;
export const selectChatOverview = (state: { chat: ChatState }) => state.chat.overview;
export const selectSearchResults = (state: { chat: ChatState }) => state.chat.searchResults;
export const selectSearchQuery = (state: { chat: ChatState }) => state.chat.searchQuery;
export const selectActiveChatId = (state: { chat: ChatState }) => state.chat.activeChatId;
export const selectChatDialogState = (state: { chat: ChatState }) => ({
  show: state.chat.showChatDialog,
  selectedUser: state.chat.selectedUser,
});
export const selectChatLoading = (state: { chat: ChatState }) => 
  state.chat.directoryLoading || 
  state.chat.sessionsLoading || 
  state.chat.currentSessionLoading ||
  state.chat.talkjsLoading;

export default chatSlice.reducer;