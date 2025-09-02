'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatAPI, ChatSession } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageCircle, 
  AlertTriangle, 
  RefreshCw,
  ArrowLeft,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface TalkJSChatProps {
  sessionId?: string;
  onSessionChange?: (session: ChatSession | null) => void;
}

export default function TalkJSChat({ sessionId, onSessionChange }: TalkJSChatProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const chatboxRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [talkjsLoaded, setTalkjsLoaded] = useState(false);
  const [chatbox, setChatbox] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);

  // Load TalkJS SDK
  useEffect(() => {
    const loadTalkJS = async () => {
      try {
        // Check if TalkJS is already loaded
        if (typeof window !== 'undefined' && (window as any).Talk) {
          console.log('TalkJS already loaded');
          setTalkjsLoaded(true);
          return;
        }

        console.log('Loading TalkJS SDK...');
        
        // Load TalkJS SDK
        const script = document.createElement('script');
        script.src = 'https://cdn.talkjs.com/talk.js';
        script.async = true;
        
        script.onload = () => {
          console.log('TalkJS SDK loaded successfully');
          setTalkjsLoaded(true);
        };
        
        script.onerror = (error) => {
          console.error('Failed to load TalkJS SDK:', error);
          setError('Failed to load TalkJS SDK');
          setLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (error: any) {
        console.error('Error loading TalkJS:', error);
        setError('Failed to initialize chat');
        setLoading(false);
      }
    };

    loadTalkJS();
  }, []);

  // Load chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      console.log('Loading chat session:', sessionId);
      setLoading(true);
      setError(null);
      
      const response = await chatAPI.getSession(sessionId);
      
      if (response.success && response.data && response.data.session) {
        console.log('Chat session loaded:', response.data.session);
        setSession(response.data.session);
        onSessionChange?.(response.data.session);
      } else {
        console.error('Failed to load session:', response);
        setError(response.error || 'Failed to load chat session');
      }
    } catch (error: any) {
      console.error('Error loading chat session:', error);
      setError('Failed to load chat session');
    } finally {
      setLoading(false);
    }
  };

  // Initialize TalkJS chat
  const initializeChat = async () => {
    if (!talkjsLoaded || !session || !user || !chatboxRef.current) {
      console.log('Chat initialization skipped - missing dependencies:', {
        talkjsLoaded,
        hasSession: !!session,
        hasUser: !!user,
        hasRef: !!chatboxRef.current
      });
      return;
    }

    try {
      console.log('=== INITIALIZING TALKJS CHAT ===');
      setLoading(true);
      setError(null);

      const Talk = (window as any).Talk;
      
      if (!Talk) {
        throw new Error('TalkJS SDK not loaded');
      }

      console.log('Getting TalkJS token from backend...');
      
      // Get TalkJS token from backend
      const tokenResponse = await chatAPI.getTalkJSToken();
      
      if (!tokenResponse.success || !tokenResponse.data?.token) {
        console.error('Token response:', tokenResponse);
        throw new Error('Failed to get TalkJS token');
      }

      console.log('Token received, length:', tokenResponse.data.token.length);

      // Wait for TalkJS to be ready
      console.log('Waiting for TalkJS to be ready...');
      await Talk.ready;
      console.log('TalkJS is ready');
      
      // Create Talk.User instance for the current user
      const me = new Talk.User({
        id: user.id,
        name: user.name,
        email: user.email || '',
        role: 'default',
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          user.name
        )}&background=0D8ABC&color=fff&size=128`
      });

      console.log('Creating TalkJS session with:', {
        appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID,
        userId: user.id,
        tokenExists: !!tokenResponse.data.token
      });
      
      const talkSession = new Talk.Session({
        appId: process.env.NEXT_PUBLIC_TALKJS_APP_ID,
        me: me,
        signature: tokenResponse.data.token
      });

      console.log('TalkJS session created');

      // Create conversation
      if (!session.otherParticipant) {
        throw new Error('Other participant data is missing');
      }
      
      console.log('Creating conversation:', session.talkjsConversationId);
      console.log('Other participant:', session.otherParticipant);
      
      // Get or create the conversation
      const conversation = talkSession.getOrCreateConversation(session.talkjsConversationId);
      
      // Set conversation participants
      conversation.setParticipant(me);
      
      // Create and add other participant
      const otherUser = new Talk.User({
        id: session.otherParticipant.id,
        name: session.otherParticipant.name,
        
        email: '', // Email is not available in otherParticipant type
        role: 'default',
        photoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          session.otherParticipant.name
        )}&background=0D8ABC&color=fff&size=128`
      });
      
      conversation.setParticipant(otherUser);

      console.log('Conversation participants set');

      // Create chatbox with options
      const options = {
        showChatHeader: false, // We're using custom header
        showOnlineStatus: true,
        messageSizeLimit: 1024 * 1024 * 5, // 5MB
        enableFileSharing: true
      };
      
      console.log('Creating chatbox...');
      const newChatbox = talkSession.createChatbox(conversation, options);
      
      console.log('Mounting chatbox...');
      newChatbox.mount(chatboxRef.current);
      
      setChatbox(newChatbox);
      setLoading(false);
      
      console.log('TalkJS chat initialized successfully');
      
    } catch (error: any) {
      console.error('=== TALKJS INITIALIZATION ERROR ===');
      
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      setError(`Chat initialization failed: ${error?.message || 'Unknown error'}`);
      setLoading(false);
      
      toast({
        title: 'Chat Error',
        description: error?.message || 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Retry initialization
  const retryInitialization = async () => {
    console.log('Retrying TalkJS initialization...');
    setRetrying(true);
    setError(null);
    
    // Clean up existing chatbox
    if (chatbox) {
      try {
        chatbox.destroy();
        setChatbox(null);
      } catch (e: any) {
        console.log('Error destroying previous chatbox:', e);
      }
    }
    
    if (sessionId) {
      await loadChatSession(sessionId);
    }
    
    setRetrying(false);
  };

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadChatSession(sessionId);
    } else {
      setSession(null);
      setLoading(false);
    }
  }, [sessionId]);

  // Initialize chat when dependencies are ready
  useEffect(() => {
    if (talkjsLoaded && session && user) {
      console.log('All dependencies ready, initializing chat...');
      initializeChat();
    }
  }, [talkjsLoaded, session, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatbox) {
        try {
          console.log('Cleaning up chatbox on unmount');
          chatbox.destroy();
        } catch (error: any) {
          console.error('Error destroying chatbox:', error);
        }
      }
    };
  }, [chatbox]);

  // No session selected
  if (!sessionId) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center p-12">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Chat Selected
            </h3>
            <p className="text-gray-600 mb-6">
              Select a chat session to start messaging
            </p>
            <Button
              onClick={() => router.push('/chat/directory')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Browse Users
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="h-full p-6">
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center space-x-3 pb-4 border-b">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            
            {/* Messages skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs space-y-2 ${i % 2 === 0 ? 'order-1' : 'order-2'}`}>
                    <Skeleton className="h-16 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input skeleton */}
            <div className="absolute bottom-6 left-6 right-6">
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                {retrying ? 'Retrying...' : 'Initializing chat...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chat Error
            </h3>
            <Alert className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/chat')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
              <Button
                onClick={retryInitialization}
                disabled={retrying}
                className="gap-2"
              >
                {retrying ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {retrying ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Chat interface
  return (
    <Card className="h-full">
      <CardContent className="h-full p-0">
        {/* Chat Header */}
        {session && (
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {String(session.otherParticipant?.name || 'Unknown User')}
                </h3>
                <p className="text-sm text-gray-500">
                  {String(session.otherParticipant?.userType || 'User')}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/chat')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        )}
        
        {/* TalkJS Chat Container */}
        <div 
          ref={chatboxRef} 
          className="h-full w-full"
          style={{ 
            minHeight: session ? 'calc(100% - 73px)' : '100%',
            height: session ? 'calc(100% - 73px)' : '100%'
          }}
        />
      </CardContent>
    </Card>
  );
}