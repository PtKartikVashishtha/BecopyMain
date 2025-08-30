'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, MessageCircle, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { chatAPI, type User, type PaginatedResponse } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import { RootState } from '@/store/store';
import InviteModal from './InviteModal';

interface UserDirectoryProps {
  onUserSelect?: (user: User) => void;
  showInviteButton?: boolean;
  maxHeight?: string;
  users?: User[]; // Add users prop
  pagination?: any; // Add pagination prop
  loading?: boolean; // Add loading prop
  onRefresh?: () => void; // Add refresh callback
}

export default function UserDirectory({ 
  onUserSelect, 
  showInviteButton = true,
  maxHeight = "600px",
  users: initialUsers = [], // Accept users as prop
  pagination: initialPagination = {}, // Accept pagination as prop
  loading: initialLoading = false, // Accept loading as prop
  onRefresh: onRefreshProp // Accept refresh callback as prop
}: UserDirectoryProps) {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Redux state
    const { user: currentUser, isUserOnline } = useSocket();
  const sentInvites = useSelector((state: RootState) => state.invites.sentInvites || []);
  //const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Socket for real-time updates
  //const { isUserOnline } = useSocket();

  // Use props if provided, otherwise fall back to API hook
  const { data: usersData, loading: apiLoading, error, execute } = useApi<PaginatedResponse<User>>();
  
  useEffect(() => {
    console.log('Current user in UserDirectory:', currentUser);
  }, [currentUser]);
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch users (only if not provided via props)
  const fetchUsers = async () => {
    if (initialUsers.length > 0) return; // Skip if users provided via props
    
    const params = {
      page: currentPage,
      limit: 20,
      ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
      ...(userTypeFilter !== 'all' && { userType: userTypeFilter }),
    };

    try {
      console.log('Fetching users with params:', params);
      await execute(chatAPI.getUserDirectory(params));
      console.log('Users fetched successfully');
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config?.url
      });
    }
  };

  // Fetch users when filters change (only if not provided via props)
  useEffect(() => {
    if (initialUsers.length === 0) {
      fetchUsers();
    }
  }, [debouncedSearchTerm, currentPage, userTypeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, userTypeFilter]);

  // Process users data - use props if available, otherwise use API data
  const users = initialUsers.length > 0 ? initialUsers : (usersData?.data?.users || []);
  const pagination = initialPagination.total ? initialPagination : (usersData?.data?.pagination || {});
  const loading = initialLoading || apiLoading;

  // Debug logging
  console.log('UserDirectory props:', { initialUsers, initialPagination, initialLoading });
  console.log('UserDirectory API data:', { usersData, apiLoading, error });
  console.log('UserDirectory final state:', { users, pagination, loading });

  // Check if user has pending invite
  const hasInviteStatus = (userId: string) => {
    return sentInvites.find(invite => 
      invite.recipient?.id === userId && 
      ['pending', 'accepted'].includes(invite.status)
    );
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  // Handle invite button click
  const handleInviteClick = (user: User) => {
    setSelectedUser(user);
    setIsInviteModalOpen(true);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-destructive mb-4">Failed to load users</p>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Directory
            {pagination && (
              <Badge variant="secondary" className="ml-auto">
                {pagination.total} users
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search users by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-auto min-w-[120px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="recruiter">Recruiters</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <div 
            className="space-y-0 divide-y"
            style={{ maxHeight, overflowY: 'auto' }}
          >
            {loading && users.length === 0 ? (
              // Loading skeletons
              [...Array(5)].map((_, index) => (
                <div key={index} className="p-4 flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
                {(searchTerm || userTypeFilter !== 'all') && (
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                )}
              </div>
            ) : (
              users.map((user) => {
                const inviteStatus = hasInviteStatus(user.id);
                const isOnline = isUserOnline(user.id);
                const isCurrentUser = currentUser?.id === user.id;
                return (
                  <div 
                    key={user.id} 
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="flex items-center justify-between">
                      {/* User Info */}
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback>
                              {getUserInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.name}</h3>
                            {user.isFeatured && (
                              <Badge variant="secondary" className="text-xs">
                                Featured
                              </Badge>
                            )}
                            {user.isPinned && (
                              <Badge variant="outline" className="text-xs">
                                Pinned
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {user.userType === 'recruiter' ? 'Recruiter' : 'User'}
                            </Badge>
                            {user.country && (
                              <>
                                <span>•</span>
                                <span>{user.country}</span>
                              </>
                            )}
                            {isOnline && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">Online</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {showInviteButton && !isCurrentUser && (
                        <div onClick={(e) => e.stopPropagation()}>
                          {inviteStatus ? (
                            <Badge 
                              variant={
                                inviteStatus.status === 'pending' ? 'secondary' : 
                                inviteStatus.status === 'accepted' ? 'default' : 'outline'
                              }
                            >
                              {inviteStatus.status === 'pending' ? 'Invite Pending' :
                               inviteStatus.status === 'accepted' ? 'Connected' : 
                               'Invite Sent'}
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleInviteClick(user)}
                              className="gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Invite
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {users.length} of {pagination.total} users
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  Previous
                </Button>
                
                <span className="text-sm">
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.pages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      {selectedUser && (
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false);
            setSelectedUser(null);
          }}
          recipientUser={selectedUser}
          onInviteSent={() => {
            // Refresh the user list to update invite status
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}