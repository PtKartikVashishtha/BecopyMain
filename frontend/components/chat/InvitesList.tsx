'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  MessageCircle, 
  Check, 
  X, 
  Clock, 
  Send, 
  Trash2, 
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { inviteAPI, chatUtils, type Invite, type PaginatedResponse, type APIResponse } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import { RootState } from '@/store/store';

interface InvitesListProps {
  maxHeight?: string;
  showTabs?: boolean;
  onInviteAccepted?: (invite: Invite) => void;
  onInviteDeclined?: (invite: Invite) => void;
}

export default function InvitesList({ 
  maxHeight = "500px",
  showTabs = true,
  onInviteAccepted,
  onInviteDeclined 
}: InvitesListProps) {
  // State
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Redux state
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const receivedInvites = useSelector((state: RootState) => state.invites.receivedInvites);
  const sentInvites = useSelector((state: RootState) => state.invites.sentInvites);

  // Socket for real-time updates
  const { acceptChatInvite, declineChatInvite, isUserOnline } = useSocket();

  // Toast for notifications
  const { toast } = useToast();

  // API hooks
  const { data: receivedData, loading: receivedLoading, error: receivedError, execute: fetchReceived } = useApi<PaginatedResponse<Invite>>();
  const { data: sentData, loading: sentLoading, error: sentError, execute: fetchSent } = useApi<PaginatedResponse<Invite>>();
  const { data: acceptData, loading: acceptLoading, execute: executeAccept } = useApi<APIResponse<any>>();
  const { data: declineData, loading: declineLoading, execute: executeDecline } = useApi<APIResponse<any>>();
  const { data: cancelData, loading: cancelLoading, execute: executeCancel } = useApi<APIResponse<any>>();

  // Fetch received invites
  const fetchReceivedInvites = async () => {
    const params = {
      page: activeTab === 'received' ? currentPage : 1,
      limit: 10,
      ...(statusFilter !== 'all' && { status: statusFilter })
    };

    try {
      await fetchReceived(inviteAPI.getReceived(params));
    } catch (err) {
      console.error('Failed to fetch received invites:', err);
    }
  };

  // Fetch sent invites
  const fetchSentInvites = async () => {
    const params = {
      page: activeTab === 'sent' ? currentPage : 1,
      limit: 10,
      ...(statusFilter !== 'all' && { status: statusFilter })
    };

    try {
      await fetchSent(inviteAPI.getSent(params));
    } catch (err) {
      console.error('Failed to fetch sent invites:', err);
    }
  };

  // Fetch invites based on active tab
  useEffect(() => {
    if (activeTab === 'received') {
      fetchReceivedInvites();
    } else {
      fetchSentInvites();
    }
  }, [activeTab, currentPage, statusFilter]);

  // Reset page when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter]);

  // Get current data and loading state
  const currentData = activeTab === 'received' ? receivedData : sentData;
  const currentLoading = activeTab === 'received' ? receivedLoading : sentLoading;
  const currentError = activeTab === 'received' ? receivedError : sentError;
  const invites = currentData?.data?.invites || [];
  const pagination = currentData?.data?.pagination;

  // Handle accept invite
  const handleAcceptInvite = async (invite: Invite) => {
    if (!currentUser || acceptLoading) return;

    try {
      // Accept via API
      const response = await executeAccept(inviteAPI.accept(invite.id));

      if (response.success) {
        // Send socket notification
        if (invite.sender) {
          acceptChatInvite({
            inviteId: invite.id,
            fromUserId: invite.sender.id,
            toUserId: currentUser.id,
            accepterName: currentUser.name
          });
        }

        // Try to create chat session
        try {
          await chatUtils.acceptInviteAndCreateChat(invite.id);
          toast({
            title: "Invite Accepted",
            description: `You can now chat with ${invite.sender?.name}. Chat session has been created.`,
          });
        } catch (chatError) {
          toast({
            title: "Invite Accepted",
            description: `Invite accepted successfully. Chat session will be available shortly.`,
          });
        }

        // Refresh invites
        fetchReceivedInvites();
        
        // Call callback
        if (onInviteAccepted) {
          onInviteAccepted(invite);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle decline invite
  const handleDeclineInvite = async (invite: Invite) => {
    if (!currentUser || declineLoading) return;

    try {
      // Decline via API
      const response = await executeDecline(inviteAPI.decline(invite.id));

      if (response.success) {
        // Send socket notification
        if (invite.sender) {
          declineChatInvite({
            inviteId: invite.id,
            fromUserId: invite.sender.id,
            toUserId: currentUser.id,
            declinerName: currentUser.name
          });
        }

        toast({
          title: "Invite Declined",
          description: "The invite has been declined.",
        });

        // Refresh invites
        fetchReceivedInvites();
        
        // Call callback
        if (onInviteDeclined) {
          onInviteDeclined(invite);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to decline invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle cancel sent invite
  const handleCancelInvite = async (invite: Invite) => {
    if (cancelLoading) return;

    try {
      const response = await executeCancel(inviteAPI.cancel(invite.id));

      if (response.success) {
        toast({
          title: "Invite Cancelled",
          description: "Your invite has been cancelled.",
        });

        // Refresh sent invites
        fetchSentInvites();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to cancel invite. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Render invite item
  const renderInviteItem = (invite: Invite) => {
    const otherUser = activeTab === 'received' ? invite.sender : invite.recipient;
    const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
    const isPending = invite.status === 'pending';
    
    return (
      <div key={invite.id} className="p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {otherUser ? getUserInitials(otherUser.name) : '?'}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {activeTab === 'received' ? 'From: ' : 'To: '}
                    {otherUser?.name || 'Unknown User'}
                  </span>
                  {isOnline && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Online
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={`text-xs ${getStatusColor(invite.status)}`}>
                    {invite.status}
                  </Badge>
                  <span>•</span>
                  <span>{formatDate(invite.createdAt)}</span>
                  {invite.expiresAt && isPending && (
                    <>
                      <span>•</span>
                      <span className="text-orange-600">
                        Expires {formatDate(invite.expiresAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground italic">
                "{invite.message}"
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {activeTab === 'received' && isPending && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptInvite(invite)}
                    disabled={acceptLoading}
                    className="gap-2"
                  >
                    {acceptLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeclineInvite(invite)}
                    disabled={declineLoading}
                    className="gap-2"
                  >
                    {declineLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Decline
                  </Button>
                </>
              )}

              {activeTab === 'sent' && isPending && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancelInvite(invite)}
                  disabled={cancelLoading}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  {cancelLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Cancel
                </Button>
              )}

              {invite.status === 'accepted' && (
                <Badge variant="default" className="gap-1">
                  <MessageCircle className="w-3 h-3" />
                  Chat Available
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="flex items-start space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="p-8 text-center text-muted-foreground">
      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>
        {activeTab === 'received' 
          ? "No invites received yet" 
          : "No invites sent yet"
        }
      </p>
      {statusFilter !== 'all' && (
        <p className="text-sm mt-2">Try changing the status filter</p>
      )}
    </div>
  );

  // Main content
  const content = (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-auto min-w-[120px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              {activeTab === 'sent' && (
                <SelectItem value="cancelled">Cancelled</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={activeTab === 'received' ? fetchReceivedInvites : fetchSentInvites}
          disabled={currentLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${currentLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div style={{ maxHeight, overflowY: 'auto' }}>
        {currentError ? (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>
              Failed to load invites. Please try again.
            </AlertDescription>
          </Alert>
        ) : currentLoading && invites.length === 0 ? (
          renderLoading()
        ) : invites.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="divide-y">
            {invites.map(renderInviteItem)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {pagination.pages} ({pagination.total} total)
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || currentLoading}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= pagination.pages || currentLoading}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return showTabs ? (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat Invites
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'received' | 'sent')}>
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="gap-2">
                <Clock className="w-4 h-4" />
                Received
                {receivedInvites.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {receivedInvites.filter(inv => inv.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="gap-2">
                <Send className="w-4 h-4" />
                Sent
                {sentInvites.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {sentInvites.filter(inv => inv.status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="received" className="m-0">
            {content}
          </TabsContent>
          
          <TabsContent value="sent" className="m-0">
            {content}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  ) : (
    <Card className="w-full">
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
}