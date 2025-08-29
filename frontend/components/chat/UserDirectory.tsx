'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast } from '@/components/ui/toast'; // ✅ use toast instead of Toast
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Users,
  RefreshCw,
  Clock,
  Loader2
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'user' | 'recruiter';
  isActive: boolean;
  createdAt: string;
}

interface DirectoryState {
  users: User[];
  filteredUsers: User[];
  loading: boolean;
  searchQuery: string;
  userTypeFilter: string;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  existingInvites: Set<string>;
}

interface UserDirectoryProps {
  onUserSelect?: (user: User) => void;
  showInviteButton?: boolean;
  className?: string;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({
  onUserSelect,
  showInviteButton = true,
  className = ''
}) => {
  const { user: currentUser } = useSelector((state: any) => state.auth);
  
  const [state, setState] = useState<DirectoryState>({
    users: [],
    filteredUsers: [],
    loading: true,
    searchQuery: '',
    userTypeFilter: '',
    currentPage: 1,
    totalPages: 1,
    hasMore: true,
    existingInvites: new Set()
  });

  useEffect(() => {
    loadUsers();
    loadExistingInvites();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [state.searchQuery, state.userTypeFilter, state.users]);

  const loadUsers = async (page = 1, append = false) => {
    try {
      setState(prev => ({ ...prev, loading: !append }));

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/users/directory?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const { data } = await response.json();
        
        setState(prev => ({
          ...prev,
          users: append ? [...prev.users, ...data.users] : data.users,
          currentPage: page,
          totalPages: data.totalPages,
          hasMore: page < data.totalPages,
          loading: false
        }));
      } else {
        throw new Error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setState(prev => ({ ...prev, loading: false }));
      Toast({
        title: 'Failed to load users',
        variant: 'destructive'
      });
    }
  };

  const loadExistingInvites = async () => {
    try {
      const [receivedResponse, sentResponse] = await Promise.all([
        fetch('/api/invites', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/invites/sent', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const receivedData = receivedResponse.ok ? await receivedResponse.json() : { data: [] };
      const sentData = sentResponse.ok ? await sentResponse.json() : { data: [] };

      const inviteUserIds = new Set([
        ...receivedData.data.filter((inv: any) => inv.status === 'pending').map((inv: any) => inv.sender._id),
        ...sentData.data.filter((inv: any) => inv.status === 'pending').map((inv: any) => inv.recipient._id)
      ]);

      setState(prev => ({ ...prev, existingInvites: inviteUserIds }));
    } catch (error) {
      console.warn('Failed to load existing invites:', error);
    }
  };

  const filterUsers = useCallback(() => {
    let filtered = [...state.users];

    // Exclude current user
    filtered = filtered.filter(user => user._id !== currentUser?._id);

    // Search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // User type filter
    if (state.userTypeFilter) {
      filtered = filtered.filter(user => user.userType === state.userTypeFilter);
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    setState(prev => ({ ...prev, filteredUsers: filtered }));
  }, [state.users, state.searchQuery, state.userTypeFilter, currentUser?._id]);

  const handleLoadMore = () => {
    if (state.hasMore && !state.loading) {
      loadUsers(state.currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setState(prev => ({ ...prev, currentPage: 1, hasMore: true }));
    loadUsers(1);
    loadExistingInvites();
  };

  const handleSearchChange = (value: string) => {
    setState(prev => ({ ...prev, searchQuery: value }));
  };

  const handleUserTypeFilter = (value: string) => {
    setState(prev => ({ ...prev, userTypeFilter: value }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      searchQuery: '',
      userTypeFilter: ''
    }));
  };

  const hasActiveFilters = state.searchQuery || state.userTypeFilter;

  return (
    <div className={`w-full ${className}`}>
      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={state.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={state.userTypeFilter} onValueChange={handleUserTypeFilter}>
              <SelectTrigger>
                <Users className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="recruiter">Recruiters</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex-1"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={state.loading}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {state.loading && state.users.length === 0 
            ? 'Loading...' 
            : `${state.filteredUsers.length} users found`
          }
        </p>
        
        {hasActiveFilters && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Filter className="h-3 w-3" />
            <span>Filters applied</span>
          </div>
        )}
      </div>

      {/* User Grid */}
      {state.loading && state.users.length === 0 ? (
        <UserGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.filteredUsers.map((user) => (
              <UserCard
                key={user._id}
                user={user}
                onSelect={onUserSelect}
                showInviteButton={showInviteButton}
                hasExistingInvite={state.existingInvites.has(user._id)}
                currentUserId={currentUser?._id}
              />
            ))}
          </div>

          {/* Load More */}
          {state.hasMore && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={handleLoadMore}
                variant="outline"
                size="lg"
                disabled={state.loading}
              >
                {state.loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Users'
                )}
              </Button>
            </div>
          )}

          {/* No Results */}
          {state.filteredUsers.length === 0 && !state.loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or filters
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// User Card Component
interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  showInviteButton: boolean;
  hasExistingInvite: boolean;
  currentUserId: string;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  onSelect, 
  showInviteButton,
  hasExistingInvite,
  currentUserId
}) => {
  const isCurrentUser = user._id === currentUserId;
  
  const handleInviteClick = () => {
    if (onSelect) {
      onSelect(user);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold"
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mb-3">
              <Badge 
                variant={user.userType === 'recruiter' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {user.userType}
              </Badge>
              {user.isActive && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>
          
          {showInviteButton && !isCurrentUser && (
            <div>
              {hasExistingInvite ? (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Invite Pending
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  onClick={handleInviteClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              )}
            </div>
          )}

          {isCurrentUser && (
            <Badge variant="outline" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton for User Grid
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          
          <div className="flex space-x-2 mb-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>

          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default UserDirectory;
