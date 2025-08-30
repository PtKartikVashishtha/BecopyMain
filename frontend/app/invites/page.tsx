'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inviteAPI, chatAPI, type Invite, type APIResponse, type PaginatedResponse } from '@/lib/api';
import InvitesList from '@/components/chat/InvitesList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface InviteStats {
  received: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
  };
  sent: {
    total: number;
    pending: number;
    accepted: number;
    declined: number;
    cancelled: number;
  };
  todayActivity: {
    invitesReceived: number;
    invitesSent: number;
    invitesAccepted: number;
  };
}

export default function InvitesPage() {
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  // Load invite statistics
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response: APIResponse<InviteStats> = await inviteAPI.getStats();
      
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error('Failed to load stats');
      }
    } catch (error: any) {
      console.error('Load stats error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load invite statistics',
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Invite data refreshed',
    });
  };

  // Handle invite accepted
  const handleInviteAccepted = (invite: Invite) => {
    // Update stats
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        received: {
          ...prev.received,
          pending: Math.max(0, prev.received.pending - 1),
          accepted: prev.received.accepted + 1
        }
      } : null);
    }

    toast({
      title: 'Invite Accepted',
      description: `You can now chat with ${invite.sender?.name}`,
    });
  };

  // Handle invite declined
  const handleInviteDeclined = (invite: Invite) => {
    // Update stats
    if (stats) {
      setStats(prev => prev ? {
        ...prev,
        received: {
          ...prev.received,
          pending: Math.max(0, prev.received.pending - 1),
          declined: prev.received.declined + 1
        }
      } : null);
    }

    toast({
      title: 'Invite Declined',
      description: 'The invite has been declined',
    });
  };

  // Navigate to chat directory
  const goToChatDirectory = () => {
    router.push('/chat/directory');
  };

  // Navigate to main chat page
  const goToChat = () => {
    router.push('/chat');
  };

  // Load data on mount
  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Chat Invites</h1>
                <p className="text-gray-600 mt-1">
                  Manage your incoming and outgoing chat invitations
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
              
              <Button onClick={goToChatDirectory} className="gap-2">
                <Users className="h-4 w-4" />
                Find Users
              </Button>
              
              <Button variant="outline" onClick={goToChat} className="gap-2">
                <MessageCircle className="h-4 w-4" />
                My Chats
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              {/* Pending Received */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Invites</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.received.pending}
                      </p>
                      <p className="text-xs text-gray-500">Awaiting your response</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Accepted Invites */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Chats</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.received.accepted + stats.sent.accepted}
                      </p>
                      <p className="text-xs text-gray-500">Total chat connections</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Sent Invites */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sent Pending</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.sent.pending}
                      </p>
                      <p className="text-xs text-gray-500">Awaiting responses</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              {/* Today's Activity */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Activity</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.todayActivity.invitesReceived + stats.todayActivity.invitesSent}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.todayActivity.invitesAccepted} accepted today
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            // Error state
            <div className="col-span-full">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load invite statistics. Please refresh the page.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Detailed Statistics */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Received Invites Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Received Invites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.received.pending}
                    </p>
                    <p className="text-sm text-orange-700">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.received.accepted}
                    </p>
                    <p className="text-sm text-green-700">Accepted</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {stats.received.declined}
                    </p>
                    <p className="text-sm text-red-700">Declined</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.received.total}
                    </p>
                    <p className="text-sm text-gray-700">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sent Invites Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Sent Invites
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.sent.pending}
                    </p>
                    <p className="text-sm text-blue-700">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.sent.accepted}
                    </p>
                    <p className="text-sm text-green-700">Accepted</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {stats.sent.declined}
                    </p>
                    <p className="text-sm text-red-700">Declined</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">
                      {stats.sent.total}
                    </p>
                    <p className="text-sm text-gray-700">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center gap-3"
                  onClick={goToChatDirectory}
                >
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="text-center">
                    <p className="font-medium">Browse Users</p>
                    <p className="text-sm text-gray-600">Find new people to chat with</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center gap-3"
                  onClick={goToChat}
                >
                  <MessageCircle className="h-8 w-8 text-green-600" />
                  <div className="text-center">
                    <p className="font-medium">Active Chats</p>
                    <p className="text-sm text-gray-600">View your ongoing conversations</p>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center gap-3"
                  onClick={refreshData}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-8 w-8 text-purple-600 ${refreshing ? 'animate-spin' : ''}`} />
                  <div className="text-center">
                    <p className="font-medium">Refresh Data</p>
                    <p className="text-sm text-gray-600">Update invite information</p>
                  </div>
                  {!refreshing && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Invites List */}
        <div className="mb-8">
          <InvitesList
            showTabs={true}
            onInviteAccepted={handleInviteAccepted}
            onInviteDeclined={handleInviteDeclined}
            maxHeight="600px"
          />
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle>How Chat Invites Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Sending Invites</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Browse the user directory to find people to chat with</li>
                  <li>• Send a personalized invite message</li>
                  <li>• Track your sent invites and their status</li>
                  <li>• Cancel pending invites if needed</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Receiving Invites</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Get notified when someone wants to chat</li>
                  <li>• Read their invite message before deciding</li>
                  <li>• Accept to start chatting or decline politely</li>
                  <li>• Invites expire after 7 days if not responded to</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}