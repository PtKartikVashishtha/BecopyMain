'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { chatAPI, inviteAPI, User, APIResponse, PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import InviteModal from '@/components/chat/InviteModal';
import { 
  Users, 
  Search, 
  MessageCircle, 
  Filter,
  RefreshCw,
  ArrowLeft,
  UserPlus,
  Globe,
  Briefcase
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DirectoryFilters {
  search: string;
  userType: string;
  country: string;
}

export default function ChatDirectoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState<DirectoryFilters>({
    search: '',
    userType: '',
    country: ''
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [creatingChat, setCreatingChat] = useState<string | null>(null);

  // Load users directory
  const loadUsers = useCallback(async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setLoading(true);
      }
      
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.userType && { userType: filters.userType }),
        ...(filters.country && { country: filters.country })
      };

      const response: PaginatedResponse<User> = await chatAPI.getUserDirectory(params);
      
      if (response.success) {
        const newUsers = response.data.users || [];
        setUsers(resetData ? newUsers : [...users, ...newUsers]);
        setPagination(response.data.pagination);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load users directory',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users directory',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit, toast]);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof DirectoryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Refresh data
  const refreshData = useCallback(() => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(1, true);
  }, [loadUsers]);

  // Load more users (pagination)
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !loading) {
      loadUsers(pagination.page + 1, false);
    }
  }, [pagination.page, pagination.pages, loading, loadUsers]);

  // Handle send invite
  const handleSendInvite = useCallback(async (recipientId: string, message: string) => {
    try {
      setSendingInvite(true);
      
      const response: APIResponse = await inviteAPI.send({
        recipientId,
        message
      });
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Invite sent successfully!'
        });
        
        // Update user's invite status in the list
        setUsers(prev => prev.map(u => 
          u.id === recipientId 
            ? { ...u, inviteStatus: { 
                id: response.data.id,
                status: 'pending',
                direction: 'sent',
                createdAt: new Date().toISOString()
              }}
            : u
        ));
        
        setShowInviteModal(false);
        setSelectedUser(null);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to send invite',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invite',
        variant: 'destructive'
      });
    } finally {
      setSendingInvite(false);
    }
  }, [toast]);

  // Open invite modal
  const openInviteModal = useCallback((user: User) => {
    setSelectedUser(user);
    setShowInviteModal(true);
  }, []);

  // Handle start chat for accepted invites
  const handleStartChat = async (userItem: User) => {
    if (!userItem.inviteStatus?.id) {
      toast({
        title: 'Error',
        description: 'No invite found for this user',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreatingChat(userItem.id);
      
      // Create chat session using the accepted invite
      const response = await chatAPI.createSession({ 
        inviteId: userItem.inviteStatus.id 
      });
      
      if (response.success) {
        // Redirect to chat page with the session selected
        const sessionId = response.data.chatSession.id;
        router.push(`/chat?session=${sessionId}`);
      } else {
        throw new Error(response.error || 'Failed to create chat session');
      }
    } catch (error: any) {
      console.error('Start chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start chat',
        variant: 'destructive',
      });
    } finally {
      setCreatingChat(null);
    }
  };

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadUsers(1, true);
    }
  }, [isAuthenticated, filters]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/chat')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Chat
              </Button>
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Directory</h1>
                <p className="text-gray-600 mt-1">
                  Find and connect with other users
                </p>
              </div>
            </div>
            
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* User Type Filter */}
              <Select
                value={filters.userType}
                onValueChange={(value) => handleFilterChange('userType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All User Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User Types</SelectItem>
                  <SelectItem value="user">Regular Users</SelectItem>
                  <SelectItem value="recruiter">Recruiters</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Country Filter */}
              <Select
                value={filters.country}
                onValueChange={(value) => handleFilterChange('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="CN">China</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="BR">Brazil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {loading && users.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.userType || filters.country
                  ? 'Try adjusting your search filters'
                  : 'No users available at the moment'}
              </p>
              {(filters.search || filters.userType || filters.country) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({ search: '', userType: '', country: '' });
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((userItem) => {
                // Don't show current user
                if (userItem.id === user?.id) return null;
                
                const canSendInvite = !userItem.inviteStatus || 
                  userItem.inviteStatus.status === 'declined';
                
                return (
                  <Card key={userItem.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {userItem.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {userItem.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {userItem.userType === 'recruiter' ? (
                              <Badge variant="secondary" className="gap-1">
                                <Briefcase className="h-3 w-3" />
                                Recruiter
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Users className="h-3 w-3" />
                                User
                              </Badge>
                            )}
                            {userItem.country && (
                              <Badge variant="outline" className="gap-1">
                                <Globe className="h-3 w-3" />
                                {userItem.country}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Invite Status */}
                      {userItem.inviteStatus && (
                        <div className="mb-4">
                          {userItem.inviteStatus.status === 'pending' && (
                            <Alert>
                              <AlertDescription>
                                {userItem.inviteStatus.direction === 'sent'
                                  ? 'Invite sent - waiting for response'
                                  : 'You have a pending invite from this user'}
                              </AlertDescription>
                            </Alert>
                          )}
                          {userItem.inviteStatus.status === 'accepted' && (
                            <Alert>
                              <AlertDescription className="text-green-600">
                                You can now chat with this user!
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                      
                      {/* Action Button */}
                      {canSendInvite ? (
                        <Button
                          onClick={() => openInviteModal(userItem)}
                          className="w-full gap-2"
                          disabled={sendingInvite}
                        >
                          <UserPlus className="h-4 w-4" />
                          Send Invite
                        </Button>
                      ) : userItem.inviteStatus?.status === 'accepted' ? (
                        <Button
                          onClick={() => handleStartChat(userItem)}
                          variant="outline"
                          className="w-full gap-2"
                          disabled={creatingChat === userItem.id}
                        >
                          {creatingChat === userItem.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                          {creatingChat === userItem.id ? 'Creating Chat...' : 'Start Chat'}
                        </Button>
                      ) : (
                        <Button disabled className="w-full">
                          {userItem.inviteStatus?.direction === 'sent'
                            ? 'Invite Sent'
                            : 'Invite Received'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Load More */}
            {pagination.page < pagination.pages && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
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
      </div>
      
      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSendInvite={handleSendInvite}
        loading={sendingInvite}
      />
    </div>
  );
}