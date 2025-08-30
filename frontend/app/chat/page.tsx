'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { chatAPI, inviteAPI, ChatSession, Invite, APIResponse, PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  Bell, 
  Search,
  Plus,
  ArrowRight,
  RefreshCw,
  Archive,
  MoreHorizontal,
  Clock
} from 'lucide-react';

// Dynamic import for TalkJS component to prevent SSR issues
const TalkJSChat = dynamic(
  () => import('@/components/chat/TalkJSChat'),
  { 
    ssr: false,
    loading: () => <ChatLoadingSkeleton />
  }
);

interface ChatOverview {
  activeSessions: ChatSession[];
  pendingInvites: Invite[];
  stats: {
    totalChats: number;
    totalMessages: number;
    pendingInvites: number;
  };
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalChats: 0,
    totalMessages: 0,
    pendingInvites: 0
  });

  // Load chat overview data
  const loadChatOverview = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load active chat sessions
      const sessionsResponse: PaginatedResponse<ChatSession> = await chatAPI.getSessions({ 
        status: 'active',
        limit: 20 
      });
      
      if (sessionsResponse.success) {
        setChatSessions(sessionsResponse.data.sessions || []);
      }

      // Load pending invites
      const invitesResponse: PaginatedResponse<Invite> = await inviteAPI.getReceived({ 
        status: 'pending',
        limit: 10 
      });
      
      if (invitesResponse.success) {
        setPendingInvites(invitesResponse.data.invites || []);
      }

      // Load stats
      const statsResponse: APIResponse = await inviteAPI.getStats();
      if (statsResponse.success) {
        setStats({
          totalChats: sessionsResponse.data?.sessions?.length || 0,
          totalMessages: statsResponse.data.totalMessages || 0,
          pendingInvites: invitesResponse.data?.invites?.length || 0
        });
      }

    } catch (error: any) {
      console.error('Load chat overview error:', error);
      toast({
        title: error.message || 'Failed to load chat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await loadChatOverview();
    setRefreshing(false);
    toast({
      title: 'Success',
    });
  };

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadChatOverview();
    }
  }, [isAuthenticated, authLoading, loadChatOverview]);

  // Handle session selection from URL parameter
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    if (sessionParam && chatSessions.length > 0) {
      // Find the session that matches the parameter
      const targetSession = chatSessions.find(session => 
          session.talkjsConversationId === sessionParam || session.id === sessionParam
        );
        if (targetSession) {
          setSelectedSessionId(targetSession.id);
        // Clear the URL parameter
        router.replace('/chat', { scroll: false });
      }
    }
  }, [searchParams, chatSessions, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the chat.</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Handle session selection
  const handleSessionSelect = (session: ChatSession) => {
    setSelectedSessionId(session.id);
  };

  // Archive session
  const handleArchiveSession = async (sessionId: string) => {
    try {
      const response: APIResponse = await chatAPI.archiveSession(sessionId);
      if (response.success) {
        setChatSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSessionId === sessionId) {
          setSelectedSessionId(null);
        }
        toast({
          title: 'Chat archived successfully',
        });
      }
    } catch (error: any) {
      toast({
        title: error.message || 'Failed to archive chat',
        variant: 'destructive',
      });
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format last activity time
  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chat Center</h1>
                <p className="text-gray-600 mt-1">
                  Manage your conversations and connect with other users
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/chat/directory">
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Browse Users</h3>
                  <p className="text-sm text-gray-600">Find new people to chat with</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/invites">
            <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
              <CardContent className="flex items-center space-x-4 p-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">Invites</h3>
                    {stats.pendingInvites > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {stats.pendingInvites}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Manage pending invites</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Card className="opacity-75">
            <CardContent className="flex items-center space-x-4 p-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Search className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Search Chats</h3>
                <p className="text-sm text-gray-600">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.totalChats}
              </div>
              <p className="text-gray-600">Active Conversations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.pendingInvites}
              </div>
              <p className="text-gray-600">Pending Invites</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.totalMessages}
              </div>
              <p className="text-gray-600">Total Messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Conversations</span>
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <ConversationsSkeleton />
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No active conversations yet</p>
                    <Link href="/chat/directory">
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Start Chatting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {chatSessions.map((session) => {
                      const isSelected = selectedSessionId === session.id;
                      
                      return (
                        <div
                          key={session.id}
                          onClick={() => handleSessionSelect(session)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>
                                {getUserInitials(session.otherParticipant?.name || 'Unknown')}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {session.otherParticipant?.name || 'Unknown User'}
                                </h4>
                                {session.otherParticipant?.userType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {String(session.otherParticipant.userType)}
                                  </Badge>
                                )}
                              </div>
                              
                              {session.lastMessage && (
                                <p className="text-sm text-gray-500 truncate mb-1">
                                  {String(session.lastMessage)}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>
                                  {session.messageCount || 0} messages
                                </span>
                                {session.lastActivity && (
                                  <span>
                                    {formatLastActivity(session.lastActivity)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveSession(session.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invites Summary */}
            {pendingInvites.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>Pending Invites</span>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingInvites.slice(0, 3).map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{String(invite.sender?.name || 'Unknown')}</span>
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      </div>
                    ))}
                    {pendingInvites.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{pendingInvites.length - 3} more invites
                      </p>
                    )}
                    <Link href="/invites">
                      <Button size="sm" variant="outline" className="w-full mt-2">
                        View All Invites
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {selectedSessionId ? (
                  <TalkJSChat 
                    sessionId={selectedSessionId}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Choose a conversation from the left to start chatting
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/chat/directory">
                          <Button className="gap-2">
                            <Users className="h-4 w-4" />
                            Find New Users
                          </Button>
                        </Link>
                        
                        {pendingInvites.length > 0 && (
                          <Link href="/invites">
                            <Button variant="outline" className="gap-2">
                              <Bell className="h-4 w-4" />
                              Check Invites ({pendingInvites.length})
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeletons
const ChatLoadingSkeleton = () => (
  <div className="h-full p-4 space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
    <div className="space-y-2 mt-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

const ConversationsSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-3 rounded-lg border">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      </div>
    ))}
  </div>
);