import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
// Update the import path to the correct location of your store file
import { RootState } from '../store/store';
import { 
  addReceivedInvite, 
  updateInviteStatus, 
  removeInvite 
} from '../store/reducers/inviteSlice';
import { 
  addNewChatSession,
  updateChatSessionActivity
} from '../store/reducers/chatSlice';

interface ChatInviteData {
  inviteId: string;
  fromUserId: string;
  senderName: string;
  inviteMessage: string;
  timestamp: string;
}

interface InviteResponseData {
  inviteId: string;
  toUserId: string;
  accepterName?: string;
  declinerName?: string;
  timestamp: string;
}

interface ChatSessionData {
  sessionId: string;
  participants: string[];
  timestamp: string;
}

interface UserStatusData {
  userId: string;
  online: boolean;
}

interface NotificationData {
  id: string;
  type: 'invite_received' | 'invite_accepted' | 'invite_declined' | 'chat_session_created';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
}

// Import the actual types from your API
import type { Invite, ChatSession } from '';

export const useSocket = () => {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  
  // Get user data from Redux store
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

   useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      setToken(storedToken);
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
          // Create a mock user for development
          const mockUser = {
            id: '507f1f77bcf86cd799439011',
            name: 'Test User',
            email: 'test@example.com',
            userType: 'user'
          };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      } else {
        // Create a mock user for development
        const mockUser = {
          id: '507f1f77bcf86cd799439011',
          name: 'Test User',
          email: 'test@example.com',
          userType: 'user'
        };
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
      }
    }
  }, []);
  // Initialize socket connection
  useEffect(() => {
    if (!user?.id || !token){ console.log('No user or token available for socket connection');
      return;
    } 

    const serverUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000';
    
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to socket server:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Register user for chat notifications
      socket.emit('register-user', user.id);
    });

    socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from socket server:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Chat invite event handlers
    socket.on('chat-invite-received', (data: ChatInviteData) => {
      console.log('Chat invite received:', data);
      
      // Add invite to Redux store - match the actual Invite interface from your API
      dispatch(addReceivedInvite({
        id: data.inviteId,
        fromUserId: data.fromUserId,
        toUserId: user.id, // Add the missing toUserId field
        message: data.inviteMessage,
        status: 'pending' as const,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
        // Add sender information based on your API structure
        sender: {
          id: data.fromUserId,
          name: data.senderName,
          // Add other required sender fields based on your User type
        }
      } as Invite));

      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('New Chat Invite', {
          body: `${data.senderName} wants to chat with you`,
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('chat-invite-accepted', (data: InviteResponseData) => {
      console.log('Chat invite accepted:', data);
      
      // Update invite status in Redux
      dispatch(updateInviteStatus({
        inviteId: data.inviteId,
        status: 'accepted' as const
      }));

      // Show browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Invite Accepted', {
          body: `${data.accepterName || 'Someone'} accepted your chat invite`,
          icon: '/favicon.ico'
        });
      }
    });

    socket.on('chat-invite-declined', (data: InviteResponseData) => {
      console.log('Chat invite declined:', data);
      
      // Update invite status in Redux
      dispatch(updateInviteStatus({
        inviteId: data.inviteId,
        status: 'declined' as const
      }));

      // Show browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Invite Declined', {
          body: `${data.declinerName || 'Someone'} declined your chat invite`,
          icon: '/favicon.ico'
        });
      }
    });

    // Chat session events
    socket.on('new-chat-session', (data: ChatSessionData) => {
      console.log('New chat session created:', data);
      
      // Add chat session using the correct ChatSession structure
      const chatSession: ChatSession = {
        id: data.sessionId,
        participants: data.participants,
        createdAt: data.timestamp,
        updatedAt: data.timestamp,
        status: 'active',
        lastActivity: data.timestamp,
        messageCount: 0,
        // Add other required fields based on your ChatSession type
        lastMessage: null,
        // Add participant details if required by your API
      };

      dispatch(addNewChatSession(chatSession));

      // Show browser notification
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Chat Ready', {
          body: 'Your chat session is now active',
          icon: '/favicon.ico'
        });
      }
    });

    // User presence events - store in local state since no Redux actions exist
    socket.on('user-online', (data: UserStatusData) => {
      setOnlineUsers(prev => new Set([...Array.from(prev), data.userId]));
      console.log('User online:', data.userId);
    });

    socket.on('user-offline', (data: UserStatusData) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      console.log('User offline:', data.userId);
    });

    // Typing indicators (optional feature)
    socket.on('user-typing-update', (data: any) => {
      // Handle typing indicators if needed
      console.log('User typing update:', data);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user?.id, token, dispatch]);

  // Socket utility functions
  const sendChatInvite = (inviteData: {
    fromUserId: string;
    toUserId: string;
    inviteId: string;
    inviteMessage: string;
    senderName: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send-chat-invite', inviteData);
    }
  };

  const acceptChatInvite = (inviteData: {
    inviteId: string;
    fromUserId: string;
    toUserId: string;
    accepterName: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('accept-chat-invite', inviteData);
    }
  };

  const declineChatInvite = (inviteData: {
    inviteId: string;
    fromUserId: string;
    toUserId: string;
    declinerName: string;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('decline-chat-invite', inviteData);
    }
  };

  const createChatSession = (sessionData: {
    sessionId: string;
    participants: string[];
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat-session-created', sessionData);
    }
  };

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-conversation', conversationId);
    }
  };

  const sendTypingIndicator = (data: {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
  }) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user-typing', data);
    }
  };

  // Reconnect function
  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  return {
    // Connection state
    isConnected,
    connectionError,
    onlineUsers,
    user,
    
    // Socket utility functions
    sendChatInvite,
    acceptChatInvite,
    declineChatInvite,
    createChatSession,
    joinConversation,
    leaveConversation,
    sendTypingIndicator,
    reconnect,
    
    // Helper functions
    isUserOnline: (userId: string) => onlineUsers.has(userId),
    
    // Socket instance (if needed for advanced usage)
    socket: socketRef.current
  };
};

export default useSocket;