'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MessageCircle, 
  Users, 
  Bell, 
  Search,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Dynamic imports to prevent SSR issues
const TalkJSChat = dynamic(
  () => import('@/components/chat/TalkJSChat'),
  { 
    ssr: false,
    loading: () => <ChatSkeleton />
  }
);

interface ChatPageState {
  activeConversations: any[];
  pendingInvites: any[];
  loadingConversations: boolean;
  loadingInvites: boolean;
  selectedConversation: string | null;
  showChat: boolean;
}

const ChatPage = () => {
  const { isAuthenticated, user, loading } = useAuth(); // ✅ assume useAuth gives loading too
  const router = useRouter();
  
  const [state, setState] = useState<ChatPageState>({
    activeConversations: [],
    pendingInvites: [],
    loadingConversations: true,
    loadingInvites: true,
    selectedConversation: null,
    showChat: false
  });

  useEffect(() => {
    if (loading) return; // ✅ wait until auth state is known
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadInitialData();
  }, [loading, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      await Promise.all([loadConversations(), loadPendingInvites()]);
    } catch (error) {
      console.error('Error loading chat data:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setState(prev => ({ ...prev, loadingConversations: true }));
      const response = await fetch('/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const { data } = await response.json();
        setState(prev => ({ 
          ...prev, 
          activeConversations: data || [],
          loadingConversations: false
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setState(prev => ({ ...prev, loadingConversations: false }));
    }
  };

  const loadPendingInvites = async () => {
    try {
      setState(prev => ({ ...prev, loadingInvites: true }));
      const response = await fetch('/api/invites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const { data } = await response.json();
        setState(prev => ({ 
          ...prev, 
          pendingInvites: data || [],
          loadingInvites: false
        }));
      }
    } catch (error) {
      console.error('Error loading invites:', error);
      setState(prev => ({ ...prev, loadingInvites: false }));
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setState(prev => ({
      ...prev,
      selectedConversation: conversationId,
      showChat: true
    }));
  };

  const handleInviteUpdate = () => {
    loadInitialData();
  };

  // ✅ prevent render until auth is checked
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600 dark:text-gray-300">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect already handled
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Chat Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with other users and manage your conversations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/chat/directory">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Find Users
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Browse and send invites
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/invites">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center space-x-3 p-6">
                <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Invites
                    {state.pendingInvites.length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {state.pendingInvites.length}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage pending invites
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-50">
            <CardContent className="flex items-center space-x-3 p-6">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg">
                <Search className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Search Chats
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Chats</span>
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.loadingConversations ? (
                  <ConversationsSkeleton />
                ) : state.activeConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No active conversations yet
                    </p>
                    <Link href="/chat/directory">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Chatting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.activeConversations.map((conversation) => {
                      const otherParticipant = conversation.participants.find(
                        (p: any) => p._id !== user?._id
                      );
                      return (
                        <div
                          key={conversation._id}
                          onClick={() => handleConversationSelect(conversation.talkjsConversationId)}
                          className="p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {otherParticipant?.name}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {otherParticipant?.userType}
                            </Badge>
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {conversation.lastMessage.text}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {conversation.messageCount} messages
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {state.showChat && state.selectedConversation ? (
                  <TalkJSChat 
                    conversationId={state.selectedConversation}
                    userId={user?._id}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Choose a conversation from the left to start chatting
                      </p>
                      <Link href="/chat/directory">
                        <Button>
                          <Users className="h-4 w-4 mr-2" />
                          Find New Users
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Invites Section */}
        {state.pendingInvites.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Pending Invites
                  <Badge variant="destructive" className="ml-2">
                    {state.pendingInvites.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* <InvitesList invites={state.pendingInvites} onInviteUpdate={handleInviteUpdate} /> */}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton Components
const ChatSkeleton = () => (
  <div className="h-full p-4">
    <div className="space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
);

const ConversationsSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-3 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-3 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    ))}
  </div>
);

export default ChatPage;
