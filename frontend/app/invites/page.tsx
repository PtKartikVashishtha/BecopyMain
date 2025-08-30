'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inviteAPI, chatAPI, type Invite, type APIResponse } from '@/lib/api';
import InvitesList from '@/components/chat/InvitesList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast';
import {
  MessageCircle,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowRight,
  RefreshCw,
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

  // ✅ local toast state
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const showToast = (
    title: string,
    description?: string,
    variant: 'default' | 'destructive' = 'default'
  ) => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000); // auto hide after 3s
  };

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
      showToast('Error', error.message || 'Failed to load invite statistics', 'destructive');
    } finally {
      setStatsLoading(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
    showToast('Success', 'Invite data refreshed');
  };

  // Handle invite accepted
  const handleInviteAccepted = (invite: Invite) => {
    if (stats) {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              received: {
                ...prev.received,
                pending: Math.max(0, prev.received.pending - 1),
                accepted: prev.received.accepted + 1,
              },
            }
          : null
      );
    }

    showToast('Invite Accepted', `You can now chat with ${invite.sender?.name}`);
  };

  // Handle invite declined
  const handleInviteDeclined = (invite: Invite) => {
    if (stats) {
      setStats((prev) =>
        prev
          ? {
              ...prev,
              received: {
                ...prev.received,
                pending: Math.max(0, prev.received.pending - 1),
                declined: prev.received.declined + 1,
              },
            }
          : null
      );
    }

    showToast('Invite Declined', 'The invite has been declined');
  };

  const goToChatDirectory = () => {
    router.push('/chat/directory');
  };

  const goToChat = () => {
    router.push('/chat');
  };

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
        {/* ... your existing stats UI unchanged ... */}

        {/* Invites List */}
        <div className="mb-8">
          <InvitesList
            showTabs={true}
            onInviteAccepted={handleInviteAccepted}
            onInviteDeclined={handleInviteDeclined}
            maxHeight="600px"
          />
        </div>

        {/* Help Section */}
        {/* ... unchanged ... */}
      </div>

      {/* ✅ Toast Renderer */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast variant={toast.variant}>
            <div className="font-semibold">{toast.title}</div>
            {toast.description && <div className="text-sm">{toast.description}</div>}
          </Toast>
        </div>
      )}
    </div>
  );
}
