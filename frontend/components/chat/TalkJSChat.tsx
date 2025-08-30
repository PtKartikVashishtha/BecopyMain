'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Talk from 'talkjs';
import {
  initializeTalkJS,
  createTalkJSSession,
  createTalkJSConversation,
  getChatboxOptions,
  getPopupOptions,
  getInboxOptions,
  getConversationId,
  isMobileDevice,
  cleanupTalkJSSession,
  handleTalkJSError
} from '../../lib/talkjs';
import {
  selectCurrentSession,
  selectTalkJSSession,
  fetchTalkJSToken,
  updateChatSessionActivity,
  setActiveChatId,
  fetchChatSession
} from '../../store/reducers/chatSlice';
import type { ChatSession } from '../../lib/api';

interface TalkJSChatProps {
  // Chat session data
  chatSession?: ChatSession;
  conversationId?: string; // Added to support passing session ID directly
  
  // Display modes
  mode?: 'chatbox' | 'popup' | 'inbox';
  
  // Layout options
  height?: string | number;
  width?: string | number;
  className?: string;
  
  // Behavior options
  showWelcomeMessage?: boolean;
  welcomeMessage?: string;
  autoFocus?: boolean;
  
  // Event handlers
  onReady?: (session: Talk.Session) => void;
  onMessage?: (message: Talk.Message) => void;
  onError?: (error: Error) => void;
  
  // Mobile optimization
  isMobile?: boolean;
  
  // Advanced options
  customTheme?: Talk.StyleSet;
  enableFileSharing?: boolean;
  enableReactions?: boolean;
}

const TalkJSChat: React.FC<TalkJSChatProps> = ({
  chatSession,
  conversationId,
  mode = 'chatbox',
  height = '500px',
  width = '100%',
  className = '',
  showWelcomeMessage = true,
  welcomeMessage = 'Welcome to the chat! Feel free to start a conversation.',
  autoFocus = true,
  onReady,
  onMessage,
  onError,
  isMobile = false,
  customTheme,
  enableFileSharing = true,
  enableReactions = true
}) => {
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<Talk.Session | null>(null);
  const uiRef = useRef<Talk.Chatbox | Talk.Popup | Talk.Inbox | null>(null);
  
  // Redux state
  const currentSession = useSelector(selectCurrentSession);
  const talkjsSession = useSelector(selectTalkJSSession);
  
  // Local state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  
  // Use chatSession prop if provided, otherwise fall back to currentSession
  const activeSession = chatSession || currentSession;
  
  // Detect mobile if not explicitly set
  const isMobileView = isMobile || (typeof window !== 'undefined' && isMobileDevice());
  
  // Fetch session if only conversationId is provided
  useEffect(() => {
    if (conversationId && !chatSession && !currentSession) {
      dispatch(fetchChatSession(conversationId));
    }
  }, [conversationId, chatSession, currentSession, dispatch]);
  
  // Initialize TalkJS session
  const initializeSession = useCallback(async () => {
    if (!activeSession || !talkjsSession) {
      setError('No active chat session or TalkJS session available');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize TalkJS
      await initializeTalkJS();
      
      // Create TalkJS session with authenticated user
      const session = await createTalkJSSession(
        talkjsSession.user,
        talkjsSession.token
      );
      
      sessionRef.current = session;
      
      // Create conversation with other participant
      const conversationIdToUse = conversationId || getConversationId(activeSession.id);
      const conversation = createTalkJSConversation(
        session,
        conversationIdToUse,
        [
          talkjsSession.user,
          {
            id: activeSession.otherParticipant.id,
            name: activeSession.otherParticipant.name,
            email: `${activeSession.otherParticipant.id}@placeholder.com`,
            userType: activeSession.otherParticipant.userType
          }
        ],
        {
          subject: `Chat with ${activeSession.otherParticipant.name}`,
          welcomeMessages: showWelcomeMessage ? [welcomeMessage] : undefined
        }
      );
      
      // Set up message listeners
      conversation.onMessage((message) => {
        setMessageCount(prev => prev + 1);
        
        // Update Redux state with new message activity
        dispatch(updateChatSessionActivity({
          sessionId: activeSession.id,
          lastMessage: message.text || 'File shared',
          lastActivity: new Date().toISOString(),
          messageCount: messageCount + 1
        }));
        
        // Call external handler
        onMessage?.(message);
      });
      
      // Set active chat ID in Redux
      dispatch(setActiveChatId(activeSession.id));
      
      // Create UI based on mode
      if (containerRef.current) {
        await createChatUI(session, conversation);
      }
      
      setIsInitialized(true);
      setIsLoading(false);
      
      // Call ready handler
      onReady?.(session);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to initialize TalkJS');
      console.error('TalkJS initialization error:', error);
      setError(error.message);
      setIsLoading(false);
      onError?.(error);
    }
  }, [activeSession, talkjsSession, mode, showWelcomeMessage, welcomeMessage, onReady, onMessage, onError, messageCount, dispatch, conversationId]);
  
  // Create TalkJS UI based on mode
  const createChatUI = async (session: Talk.Session, conversation: Talk.ConversationBuilder) => {
    if (!containerRef.current) return;
    
    // Clean up existing UI
    if (uiRef.current) {
      try {
        uiRef.current.destroy();
      } catch (error) {
        console.warn('Error destroying previous TalkJS UI:', error);
      }
    }
    
    // Get mount options
    const baseOptions = {
      ...getChatboxOptions(isMobileView),
      ...(customTheme && { styles: customTheme }),
      enableFileSharing,
      enableReactions
    };
    
    try {
      switch (mode) {
        case 'popup':
          uiRef.current = session.createPopup(conversation, {
            ...getPopupOptions(),
            ...baseOptions
          });
          break;
          
        case 'inbox':
          uiRef.current = session.createInbox({
            ...getInboxOptions(),
            ...baseOptions
          });
          break;
          
        case 'chatbox':
        default:
          uiRef.current = session.createChatbox(conversation, {
            ...baseOptions,
            height: typeof height === 'number' ? `${height}px` : height,
            width: typeof width === 'number' ? `${width}px` : width
          });
          break;
      }
      
      // Mount the UI
      uiRef.current.mount(containerRef.current);
      
      // Auto focus if enabled
      if (autoFocus && mode === 'chatbox') {
        setTimeout(() => {
          const messageInput = containerRef.current?.querySelector('input[type="text"], textarea');
          if (messageInput && 'focus' in messageInput) {
            (messageInput as HTMLElement).focus();
          }
        }, 1000);
      }
      
    } catch (error) {
      handleTalkJSError(error, 'create UI');
    }
  };
  
  // Fetch TalkJS token on mount
  useEffect(() => {
    if (!talkjsSession) {
      dispatch(fetchTalkJSToken());
    }
  }, [dispatch, talkjsSession]);
  
  // Initialize session when dependencies are ready
  useEffect(() => {
    if (activeSession && talkjsSession && !isInitialized) {
      initializeSession();
    }
  }, [activeSession, talkjsSession, isInitialized, initializeSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uiRef.current) {
        try {
          uiRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying TalkJS UI on unmount:', error);
        }
      }
      
      if (sessionRef.current) {
        cleanupTalkJSSession(sessionRef.current);
      }
      
      dispatch(setActiveChatId(null));
    };
  }, [dispatch]);
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    if (!isInitialized || mode !== 'chatbox') return;
    
    const handleResize = () => {
      if (uiRef.current && containerRef.current) {
        // TalkJS handles responsive behavior internally
        // Just ensure container dimensions are updated
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          // Container is hidden, may need to remount when visible
          setTimeout(() => {
            if (containerRef.current && sessionRef.current) {
              // Remount if container becomes visible again
              const newRect = containerRef.current.getBoundingClientRect();
              if (newRect.width > 0 && newRect.height > 0 && !uiRef.current) {
                initializeSession();
              }
            }
          }, 100);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized, mode, initializeSession]);
  
  // Loading state
  if (isLoading || (!activeSession && conversationId)) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-50 rounded-lg border ${className}`}
        style={{ height, width }}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">
            {!activeSession && !conversationId ? 'No active chat session' : 'Loading chat...'}
          </p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-200 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="flex flex-col items-center space-y-3 p-4 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-red-900 mb-1">Chat failed to load</p>
            <p className="text-sm text-red-700 mb-3">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsInitialized(false);
                initializeSession();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Chat container
  return (
    <div className={`talkjs-container ${className}`}>
      <div 
        ref={containerRef}
        className="talkjs-chat-container w-full h-full rounded-lg overflow-hidden border border-gray-200"
        style={{ height, width, minHeight: '300px' }}
      />
      
      {/* Chat session info overlay (optional) */}
      {activeSession && (
        <div className="hidden">
          <span data-testid="chat-session-id">{activeSession.id}</span>
          <span data-testid="chat-participant">{activeSession.otherParticipant.name}</span>
        </div>
      )}
    </div>
  );
};

export default TalkJSChat;