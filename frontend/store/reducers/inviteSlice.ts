import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inviteAPI, chatUtils } from '../../lib/api';
import type { Invite, APIResponse, PaginatedResponse } from '../../lib/api';

// Types
interface InviteStats {
  pendingReceived: number;
  pendingSent: number;
  acceptedReceived: number;
  acceptedSent: number;
  totalPending: number;
  totalAccepted: number;
}

interface InvitePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface InviteState {
  // Received invites
  receivedInvites: Invite[];
  receivedLoading: boolean;
  receivedError: string | null;
  receivedPagination: InvitePagination | null;

  // Sent invites
  sentInvites: Invite[];
  sentLoading: boolean;
  sentError: string | null;
  sentPagination: InvitePagination | null;

  // Statistics
  stats: InviteStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // Send invite
  sendLoading: boolean;
  sendError: string | null;

  // Action states
  actionLoading: { [inviteId: string]: boolean };
  actionErrors: { [inviteId: string]: string };

  // UI state
  selectedInvite: Invite | null;
  showInviteModal: boolean;
  inviteModalRecipient: {
    id: string;
    name: string;
    userType: string;
  } | null;
}

const initialState: InviteState = {
  receivedInvites: [],
  receivedLoading: false,
  receivedError: null,
  receivedPagination: null,

  sentInvites: [],
  sentLoading: false,
  sentError: null,
  sentPagination: null,

  stats: null,
  statsLoading: false,
  statsError: null,

  sendLoading: false,
  sendError: null,

  actionLoading: {},
  actionErrors: {},

  selectedInvite: null,
  showInviteModal: false,
  inviteModalRecipient: null,
};

// Async Thunks
export const fetchReceivedInvites = createAsyncThunk(
  'invites/fetchReceived',
  async (params: { status?: string; page?: number; limit?: number } = {}) => {
    const response = await inviteAPI.getReceived(params);
    return response;
  }
);

export const fetchSentInvites = createAsyncThunk(
  'invites/fetchSent',
  async (params: { status?: string; page?: number; limit?: number } = {}) => {
    const response = await inviteAPI.getSent(params);
    return response;
  }
);

export const fetchInviteStats = createAsyncThunk(
  'invites/fetchStats',
  async () => {
    const response = await inviteAPI.getStats();
    return response;
  }
);

export const sendInvite = createAsyncThunk(
  'invites/send',
  async ({ recipientId, message }: { recipientId: string; message: string }) => {
    const response = await chatUtils.sendInviteWithFeedback(recipientId, message);
    return response;
  }
);

export const acceptInvite = createAsyncThunk(
  'invites/accept',
  async (inviteId: string) => {
    const response = await chatUtils.acceptInviteAndCreateChat(inviteId);
    return { inviteId, ...response };
  }
);

export const declineInvite = createAsyncThunk(
  'invites/decline',
  async (inviteId: string) => {
    const response = await inviteAPI.decline(inviteId);
    return { inviteId, ...response };
  }
);

export const cancelInvite = createAsyncThunk(
  'invites/cancel',
  async (inviteId: string) => {
    const response = await inviteAPI.cancel(inviteId);
    return { inviteId, ...response };
  }
);

export const checkInviteEligibility = createAsyncThunk(
  'invites/checkEligibility',
  async (recipientId: string) => {
    const response = await inviteAPI.checkEligibility(recipientId);
    return response;
  }
);

// Slice
const inviteSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    // UI actions
    setSelectedInvite: (state, action: PayloadAction<Invite | null>) => {
      state.selectedInvite = action.payload;
    },
    showInviteModal: (state, action: PayloadAction<{ id: string; name: string; userType: string }>) => {
      state.showInviteModal = true;
      state.inviteModalRecipient = action.payload;
      state.sendError = null;
    },
    hideInviteModal: (state) => {
      state.showInviteModal = false;
      state.inviteModalRecipient = null;
      state.sendError = null;
    },
    
    // Clear errors
    clearSendError: (state) => {
      state.sendError = null;
    },
    clearReceivedError: (state) => {
      state.receivedError = null;
    },
    clearSentError: (state) => {
      state.sentError = null;
    },
    clearActionError: (state, action: PayloadAction<string>) => {
      delete state.actionErrors[action.payload];
    },

    // Real-time updates (for Socket.IO events)
    addReceivedInvite: (state, action: PayloadAction<Invite>) => {
      const existingIndex = state.receivedInvites.findIndex(
        invite => invite.id === action.payload.id
      );
      if (existingIndex === -1) {
        state.receivedInvites.unshift(action.payload);
        if (state.stats) {
          state.stats.pendingReceived += 1;
          state.stats.totalPending += 1;
        }
      }
    },

    updateInviteStatus: (state, action: PayloadAction<{ inviteId: string; status: string; timestamp?: string }>) => {
      const { inviteId, status, timestamp } = action.payload;
      
      // Update in received invites
      const receivedIndex = state.receivedInvites.findIndex(invite => invite.id === inviteId);
      if (receivedIndex !== -1) {
        state.receivedInvites[receivedIndex].status = status as any;
        if (status === 'accepted' && timestamp) {
          state.receivedInvites[receivedIndex].acceptedAt = timestamp;
        } else if (status === 'declined' && timestamp) {
          state.receivedInvites[receivedIndex].declinedAt = timestamp;
        }
      }

      // Update in sent invites
      const sentIndex = state.sentInvites.findIndex(invite => invite.id === inviteId);
      if (sentIndex !== -1) {
        state.sentInvites[sentIndex].status = status as any;
        if (status === 'accepted' && timestamp) {
          state.sentInvites[sentIndex].acceptedAt = timestamp;
        } else if (status === 'declined' && timestamp) {
          state.sentInvites[sentIndex].declinedAt = timestamp;
        }
      }

      // Update stats
      if (state.stats && status !== 'pending') {
        state.stats.pendingReceived = Math.max(0, state.stats.pendingReceived - 1);
        state.stats.totalPending = Math.max(0, state.stats.totalPending - 1);
        if (status === 'accepted') {
          state.stats.acceptedReceived += 1;
          state.stats.totalAccepted += 1;
        }
      }
    },

    removeInvite: (state, action: PayloadAction<string>) => {
      const inviteId = action.payload;
      state.receivedInvites = state.receivedInvites.filter(invite => invite.id !== inviteId);
      state.sentInvites = state.sentInvites.filter(invite => invite.id !== inviteId);
    },

    // Reset states
    resetReceivedInvites: (state) => {
      state.receivedInvites = [];
      state.receivedPagination = null;
      state.receivedError = null;
    },
    resetSentInvites: (state) => {
      state.sentInvites = [];
      state.sentPagination = null;
      state.sentError = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch received invites
    builder
      .addCase(fetchReceivedInvites.pending, (state) => {
        state.receivedLoading = true;
        state.receivedError = null;
      })
      .addCase(fetchReceivedInvites.fulfilled, (state, action) => {
        state.receivedLoading = false;
        state.receivedInvites = action.payload.data.invites;
        state.receivedPagination = action.payload.data.pagination;
      })
      .addCase(fetchReceivedInvites.rejected, (state, action) => {
        state.receivedLoading = false;
        state.receivedError = action.error.message || 'Failed to fetch received invites';
      })

    // Fetch sent invites
    builder
      .addCase(fetchSentInvites.pending, (state) => {
        state.sentLoading = true;
        state.sentError = null;
      })
      .addCase(fetchSentInvites.fulfilled, (state, action) => {
        state.sentLoading = false;
        state.sentInvites = action.payload.data.invites;
        state.sentPagination = action.payload.data.pagination;
      })
      .addCase(fetchSentInvites.rejected, (state, action) => {
        state.sentLoading = false;
        state.sentError = action.error.message || 'Failed to fetch sent invites';
      })

    // Fetch stats
    builder
      .addCase(fetchInviteStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchInviteStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.data.stats;
      })
      .addCase(fetchInviteStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.error.message || 'Failed to fetch invite stats';
      })

    // Send invite
    builder
      .addCase(sendInvite.pending, (state) => {
        state.sendLoading = true;
        state.sendError = null;
      })
      .addCase(sendInvite.fulfilled, (state, action) => {
        state.sendLoading = false;
        state.showInviteModal = false;
        state.inviteModalRecipient = null;
        // Add to sent invites
        if (action.payload.data.invite) {
          state.sentInvites.unshift(action.payload.data.invite);
          if (state.stats) {
            state.stats.pendingSent += 1;
            state.stats.totalPending += 1;
          }
        }
      })
      .addCase(sendInvite.rejected, (state, action) => {
        state.sendLoading = false;
        state.sendError = action.error.message || 'Failed to send invite';
      })

    // Accept invite
    builder
      .addCase(acceptInvite.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
        delete state.actionErrors[action.meta.arg];
      })
      .addCase(acceptInvite.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload.inviteId];
        // Update invite status
        const invite = state.receivedInvites.find(inv => inv.id === action.payload.inviteId);
        if (invite) {
          invite.status = 'accepted';
          invite.acceptedAt = action.payload.invite.data.invite.acceptedAt;
        }
        if (state.stats) {
          state.stats.pendingReceived = Math.max(0, state.stats.pendingReceived - 1);
          state.stats.acceptedReceived += 1;
          state.stats.totalPending = Math.max(0, state.stats.totalPending - 1);
          state.stats.totalAccepted += 1;
        }
      })
      .addCase(acceptInvite.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
        state.actionErrors[action.meta.arg] = action.error.message || 'Failed to accept invite';
      })

    // Decline invite
    builder
      .addCase(declineInvite.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
        delete state.actionErrors[action.meta.arg];
      })
      .addCase(declineInvite.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload.inviteId];
        // Update invite status
        const invite = state.receivedInvites.find(inv => inv.id === action.payload.inviteId);
        if (invite) {
          invite.status = 'declined';
          invite.declinedAt = action.payload.invite.data.invite.declinedAt;
        }
        if (state.stats) {
          state.stats.pendingReceived = Math.max(0, state.stats.pendingReceived - 1);
          state.stats.totalPending = Math.max(0, state.stats.totalPending - 1);
        }
      })
      .addCase(declineInvite.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
        state.actionErrors[action.meta.arg] = action.error.message || 'Failed to decline invite';
      })

    // Cancel invite
    builder
      .addCase(cancelInvite.pending, (state, action) => {
        state.actionLoading[action.meta.arg] = true;
        delete state.actionErrors[action.meta.arg];
      })
      .addCase(cancelInvite.fulfilled, (state, action) => {
        delete state.actionLoading[action.payload.inviteId];
        // Remove from sent invites
        state.sentInvites = state.sentInvites.filter(inv => inv.id !== action.payload.inviteId);
        if (state.stats) {
          state.stats.pendingSent = Math.max(0, state.stats.pendingSent - 1);
          state.stats.totalPending = Math.max(0, state.stats.totalPending - 1);
        }
      })
      .addCase(cancelInvite.rejected, (state, action) => {
        delete state.actionLoading[action.meta.arg];
        state.actionErrors[action.meta.arg] = action.error.message || 'Failed to cancel invite';
      });
  },
});

export const {
  setSelectedInvite,
  showInviteModal,
  hideInviteModal,
  clearSendError,
  clearReceivedError,
  clearSentError,
  clearActionError,
  addReceivedInvite,
  updateInviteStatus,
  removeInvite,
  resetReceivedInvites,
  resetSentInvites,
} = inviteSlice.actions;

// Selectors
export const selectReceivedInvites = (state: { invites: InviteState }) => state.invites.receivedInvites;
export const selectSentInvites = (state: { invites: InviteState }) => state.invites.sentInvites;
export const selectInviteStats = (state: { invites: InviteState }) => state.invites.stats;
export const selectPendingReceivedInvites = (state: { invites: InviteState }) => 
  state.invites.receivedInvites.filter(invite => invite.status === 'pending');
export const selectInviteLoading = (state: { invites: InviteState }) => 
  state.invites.receivedLoading || state.invites.sentLoading || state.invites.sendLoading;
export const selectInviteModalState = (state: { invites: InviteState }) => ({
  show: state.invites.showInviteModal,
  recipient: state.invites.inviteModalRecipient,
  loading: state.invites.sendLoading,
  error: state.invites.sendError,
});

export default inviteSlice.reducer;