'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { inviteAPI, Invite, APIResponse, PaginatedResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  MailOpen,
  Check, 
  X, 
  Clock,
  Send,
  Inbox,
  RefreshCw,
  MessageCircle,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface InvitesListProps {
  onInviteAccepted?: (invite: Invite) => void;
  onInviteDeclined?: (invite: Invite) => void;
  showTabs?: boolean;
  maxHeight?: string;
  className?: string;
}

export default function InvitesList({ 
  onInviteAccepted, 
  onInviteDeclined, 
  showTabs = true, 
  maxHeight, 
  className 
}: InvitesListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('received');
  
  const [receivedPagination, setReceivedPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const [sentPagination, setSentPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Load received invites
  const loadReceivedInvites = useCallback(async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setLoading(true);
      }
      
      const response: PaginatedResponse<Invite> = await inviteAPI.getReceived({
        page,
        limit: receivedPagination.limit
      });
      
      if (response.success) {
        const newInvites = response.data.invites || [];
        setReceivedInvites(resetData ? newInvites : [...receivedInvites, ...newInvites]);
        setReceivedPagination(response.data.pagination);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load received invites',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading received invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load received invites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [receivedPagination.limit, toast]);

  // Load sent invites
  const loadSentInvites = useCallback(async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setLoading(true);
      }
      
      const response: PaginatedResponse<Invite> = await inviteAPI.getSent({
        page,
        limit: sentPagination.limit
      });
      
      if (response.success) {
        const newInvites = response.data.invites || [];
        setSentInvites(resetData ? newInvites : [...sentInvites, ...newInvites]);
        setSentPagination(response.data.pagination);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load sent invites',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading sent invites:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sent invites',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sentPagination.limit, toast]);

  // Handle invite response
  const handleInviteResponse = useCallback(async (inviteId: string, action: 'accept' | 'decline') => {
    try {
      setActionLoading(inviteId);
      
      const response: APIResponse = action === 'accept' 
        ? await inviteAPI.accept(inviteId)
        : await inviteAPI.decline(inviteId);
      
      if (response.success) {
        // Update the invite in the list
        setReceivedInvites(prev => prev.map(invite => 
          invite.id === inviteId 
            ? { ...invite, status: action === 'accept' ? 'accepted' : 'declined' }
            : invite
        ));
        
        toast({
          title: 'Success',
          description: `Invite ${action}ed successfully!`
        });
        
        // Notify parent component
        if (action === 'accept') {
          const acceptedInvite = receivedInvites.find(inv => inv.id === inviteId);
          if (acceptedInvite) {
            onInviteAccepted?.(acceptedInvite);
          }
        } else if (action === 'decline') {
          const declinedInvite = receivedInvites.find(inv => inv.id === inviteId);
          if (declinedInvite) {
            onInviteDeclined?.(declinedInvite);
          }
        }
      } else {
        toast({
          title: 'Error',
          description: response.error || `Failed to ${action} invite`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing invite:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} invite`,
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }, [receivedInvites, onInviteAccepted, onInviteDeclined, toast]);

  // Refresh data
  const refreshData = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'received') {
      setReceivedPagination(prev => ({ ...prev, page: 1 }));
      loadReceivedInvites(1, true);
    } else {
      setSentPagination(prev => ({ ...prev, page: 1 }));
      loadSentInvites(1, true);
    }
  }, [activeTab, loadReceivedInvites, loadSentInvites]);

  // Load more invites
  const loadMore = useCallback((type: 'received' | 'sent') => {
    if (type === 'received' && receivedPagination.page < receivedPagination.pages && !loading) {
      loadReceivedInvites(receivedPagination.page + 1, false);
    } else if (type === 'sent' && sentPagination.page < sentPagination.pages && !loading) {
      loadSentInvites(sentPagination.page + 1, false);
    }
  }, [receivedPagination, sentPagination, loading, loadReceivedInvites, loadSentInvites]);

  // Load initial data
  useEffect(() => {
    loadReceivedInvites(1, true);
    loadSentInvites(1, true);
  }, []);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="default" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
            <Check className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="destructive" className="gap-1">
            <X className="h-3 w-3" />
            Declined
          </Badge>
        );
      default:
        return null;
    }
  };

  // Render invite item
  const renderInviteItem = (invite: Invite, type: 'received' | 'sent') => {
    const otherUser = type === 'received' ? invite.sender : invite.recipient;
    const isActionable = type === 'received' && invite.status === 'pending';
    
    return (
      <Card key={invite.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {otherUser.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900 truncate">
                    {otherUser.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(invite.status)}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(invite.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                {type === 'received' ? (
                  <Inbox className="h-4 w-4 text-blue-600" />
                ) : (
                  <Send className="h-4 w-4 text-green-600" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {invite.message}
              </p>
              
              {isActionable && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleInviteResponse(invite.id, 'accept')}
                    disabled={actionLoading === invite.id}
                    className="gap-1"
                  >
                    {actionLoading === invite.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInviteResponse(invite.id, 'decline')}
                    disabled={actionLoading === invite.id}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Decline
                  </Button>
                </div>
              )}
              
              {invite.status === 'accepted' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => {
                    // Navigate to chat or trigger chat opening
                    onInviteAccepted?.(invite);
                  }}
                >
                  <MessageCircle className="h-3 w-3" />
                  Start Chat
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = (type: 'received' | 'sent') => (
    <Card>
      <CardContent className="p-12 text-center">
        {type === 'received' ? (
          <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        ) : (
          <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No {type} invites
        </h3>
        <p className="text-gray-600">
          {type === 'received'
            ? "You haven't received any chat invites yet"
            : "You haven't sent any chat invites yet"}
        </p>
      </CardContent>
    </Card>
  );

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Chat Invites
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="gap-2">
                <Inbox className="h-4 w-4" />
                Received ({receivedInvites.filter(inv => inv.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <Send className="h-4 w-4" />
                Sent ({sentInvites.filter(inv => inv.status === 'pending').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="received" className="mt-6">
              {loading && receivedInvites.length === 0 ? (
                renderLoadingSkeleton()
              ) : receivedInvites.length === 0 ? (
                renderEmptyState('received')
              ) : (
                <>
                  <div className="space-y-4">
                    {receivedInvites.map(invite => renderInviteItem(invite, 'received'))}
                  </div>
                  
                  {receivedPagination.page < receivedPagination.pages && (
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => loadMore('received')}
                        disabled={loading}
                        className="gap-2"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="sent" className="mt-6">
              {loading && sentInvites.length === 0 ? (
                renderLoadingSkeleton()
              ) : sentInvites.length === 0 ? (
                renderEmptyState('sent')
              ) : (
                <>
                  <div className="space-y-4">
                    {sentInvites.map(invite => renderInviteItem(invite, 'sent'))}
                  </div>
                  
                  {sentPagination.page < sentPagination.pages && (
                    <div className="text-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => loadMore('sent')}
                        disabled={loading}
                        className="gap-2"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}