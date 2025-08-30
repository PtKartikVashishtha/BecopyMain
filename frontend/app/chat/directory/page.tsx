'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { chatAPI, inviteAPI, User, APIResponse, PaginatedResponse } from '@/lib/api';
import UserDirectory from '@/components/chat/UserDirectory';
import InviteModal from '@/components/chat/InviteModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';



export default function ChatDirectoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20, // Increased limit to show more users
    total: 0,
    pages: 0
  });

  // Load users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Debug: Check authentication state
      console.log('Auth state:', { isAuthenticated, user });
      console.log('Token:', localStorage.getItem('token'));
      
      const response: PaginatedResponse<User> = await chatAPI.getUserDirectory({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setUsers(response.data.users || []);
        setPagination(response.data.pagination);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error: any) {
      console.error('Load users error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url
      });
      toast({
        title: 'Error',
        description: error.message || 'Failed to load user directory',
        variant: 'destructive',
      });
      setUsers([]);
      setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, toast, isAuthenticated, user]);

  // Refresh users
  const refreshUsers = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'User directory refreshed',
    });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle invite user
  const handleInviteUser = (user: User) => {
    setSelectedUser(user);
    setInviteModalOpen(true);
  };

  // Handle send invite
  const handleSendInvite = async () => {
    if (!selectedUser) return;
    console.log('Invite sent successfully!');
  };

  // Load users on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadUsers();
    }
  }, [isAuthenticated, authLoading, loadUsers]);

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
          <p className="text-gray-600 mb-6">Please log in to access the user directory.</p>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Don't render anything while checking authentication
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



  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">User Directory</h1>
          </div>
          <p className="text-gray-600">
            Discover and connect with other users. Send chat invites to start conversations.
          </p>
        </div>

        {/* Filters and Search */}
        {/* Removed Filters and Search section */}

        {/* Results Info */}
        {!loading && (
          <div className="mb-6 flex justify-between items-center">
            <p className="text-gray-600">
              {pagination.total > 0 
                ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} users`
                : 'No users found'
              }
            </p>
          </div>
        )}

        {/* User Directory */}
        <UserDirectory
          onUserSelect={(user) => {
            console.log('Selected user:', user);
          }}
          showInviteButton={true}
          users={users}
          pagination={pagination}
          loading={loading}
          onRefresh={refreshUsers}
        />

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, index) => {
                  const pageNum = index + Math.max(1, pagination.page - 2);
                  if (pageNum > pagination.pages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                disabled={pagination.page >= pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600 mb-4">
              There are no users available in the directory at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {selectedUser && (
        <InviteModal
          isOpen={inviteModalOpen}
          onClose={() => {
            setInviteModalOpen(false);
            setSelectedUser(null);
          }}
          recipientUser={selectedUser} 
          onInviteSent={handleSendInvite}  
        />
      )}
    </div>
  );
}