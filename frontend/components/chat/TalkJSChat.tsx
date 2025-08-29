'use client';

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, MessageCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Talk: any;
    talkSession: any;
  }
}

interface TalkJSChatProps {
  conversationId: string;
  userId: string;
  height?: string;
  className?: string;
}

interface ChatState {
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  session: any;
  conversation: any;
  chatbox: any;
}

const TalkJSChat: React.FC<TalkJSChatProps> = ({
  conversationId,
  userId,
  height = '600px',
  className = ''
}) => {
  const { user } = useSelector((state: any) => state.auth);
  const chatboxRef = useRef<HTMLDivElement>(null);
  const initializationRef = useRef(false);
  
  const [state, setState] = useState<ChatState>({
    isLoading: true,
    error: null,
    isInitialized: false,
    session: null,
    conversation: null,
    chatbox: null
  });

  useEffect(() => {
    if (!conversationId || !userId || !user || initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    initializeTalkJS();

    return () => {
      if (state.chatbox) {
        try {
          state.chatbox.destroy();
        } catch (error) {
          console.warn('Error destroying TalkJS chatbox:', error);
        }
      }
    };
  }, [conversationId, userId, user]);

  const loadTalkJSScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Talk) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.talkjs.com/talk.js';
      script.async = true;
      
      script.onload = () => {
        window.Talk.ready.then(() => {
          resolve();
        }).catch(reject);
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load TalkJS script'));
      };

      document.head.appendChild(script);
    });
  };

  const createTalkJSSession = async () => {
    try {
      // Get session token from your backend
      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          conversationId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create chat session');
      }

      const { data } = await response.json();
      
      // Initialize TalkJS session with token from backend
      const session = new window.Talk.Session({
        appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID,
        me: new window.Talk.User({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.userType,
          photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`
        }),
        signature: data.signature
      });

      return { session, conversationData: data.conversation };
    } catch (error) {
      console.error('Error creating TalkJS session:', error);
      throw error;
    }
  };

  const initializeTalkJS = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Load TalkJS script
      await loadTalkJSScript();

      // Create session
      const { session, conversationData } = await createTalkJSSession();

      // Create conversation
      const conversation = session.getOrCreateConversation(conversationId);
      
      // Set conversation properties
      conversation.setAttributes({
        subject: conversationData.subject || 'Chat',
        photoUrl: conversationData.photoUrl,
        welcomeMessages: conversationData.welcomeMessages || []
      });

      // Add participants
      if (conversationData.participants) {
        conversationData.participants.forEach((participant: any) => {
          if (participant.id !== user._id) {
            const talkUser = new window.Talk.User({
              id: participant.id,
              name: participant.name,
              email: participant.email,
              role: participant.role || 'user',
              photoUrl: participant.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=random`
            });
            conversation.setParticipant(talkUser);
          }
        });
      }

      // Create chatbox
      const chatbox = session.createChatbox();
      chatbox.select(conversation);

      // Mount chatbox
      if (chatboxRef.current) {
        chatbox.mount(chatboxRef.current);
      }

      // Set up event listeners
      chatbox.onSendMessage(() => {
        // Update last activity in your database
        updateLastActivity();
      });

      setState(prev => ({
        ...prev,
        session,
        conversation,
        chatbox,
        isInitialized: true,
        isLoading: false
      }));

    } catch (error) {
      console.error('TalkJS initialization error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize chat',
        isLoading: false
      }));
    }
  };

  const updateLastActivity = async () => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/activity`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.warn('Failed to update chat activity:', error);
    }
  };

  const retryInitialization = () => {
    initializationRef.current = false;
    setState({
      isLoading: true,
      error: null,
      isInitialized: false,
      session: null,
      conversation: null,
      chatbox: null
    });
    initializeTalkJS();
  };

  if (state.error) {
    return (
      <Card className={`h-full ${className}`}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chat Unavailable
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {state.error}
            </p>
            <Button onClick={retryInitialization}>
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (state.isLoading) {
    return (
      <Card className={`h-full ${className}`}>
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Loading chat...
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`h-full ${className}`} style={{ height }}>
      <div 
        ref={chatboxRef} 
        className="h-full w-full rounded-lg overflow-hidden"
        style={{ 
          height: '100%',
          minHeight: height 
        }}
      />
    </div>
  );
};

export default TalkJSChat;