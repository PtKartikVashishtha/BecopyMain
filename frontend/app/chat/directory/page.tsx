'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import  api  from '@/lib/api';

// Dynamic import for invite modal
const InviteModal = dynamic(
  () => import('@/components/chat/InviteModel'),
  { ssr: false }
);

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
  selectedUser: User | null;
  showInviteModal: boolean;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

const UserDirectoryPage = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  const [state, setState] = useState<DirectoryState>({
    users: [],
    filteredUsers: [],
    loading: true,
    searchQuery: '',
    userTypeFilter: 'all', // ✅ Changed from empty string to 'all'
    selectedUser: null,
    showInviteModal: false,
    currentPage: 1,
    totalPages: 1,
    hasMore: true
  });

  useEffect(() => {
    if (loading) return; // ✅ wait until auth state is known
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    // loadInitialData();
  }, [loading, isAuthenticated]);

  useEffect(() => {
    filterUsers();
  }, [state.searchQuery, state.userTypeFilter, state.users]);

  const loadUsers = async (page = 1) => {
    try {
      setState(prev => ({ ...prev, loading: page === 1 }));

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      const response = await api.get(`/api/users/directory?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response;

    //   if (response.ok) {
    //     const { data } = await response.json();

    //     setState(prev => ({
    //       ...prev,
    //       users: page === 1 ? data.users : [...prev.users, ...data.users],
    //       currentPage: page,
    //       totalPages: data.totalPages,
    //       hasMore: page < data.totalPages,
    //       loading: false
    //     }));
    //   }
    } catch (error) {
      console.error('Error loading users:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const filterUsers = () => {
    let filtered = [...state.users];

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    // ✅ Updated filter logic to handle 'all' instead of empty string
    if (state.userTypeFilter && state.userTypeFilter !== 'all') {
      filtered = filtered.filter(user => user.userType === state.userTypeFilter);
    }

    setState(prev => ({ ...prev, filteredUsers: filtered }));
  };

  const handleLoadMore = () => {
    if (state.hasMore && !state.loading) {
      loadUsers(state.currentPage + 1);
    }
  };

  const handleInviteUser = (user: User) => {
    setState(prev => ({
      ...prev,
      selectedUser: user,
      showInviteModal: true
    }));
  };

  const handleInviteModalClose = () => {
    setState(prev => ({
      ...prev,
      selectedUser: null,
      showInviteModal: false
    }));
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
      userTypeFilter: 'all' // ✅ Reset to 'all' instead of empty string
    }));
  };

  // Show loading screen while checking auth
//   if (authLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         Checking authentication...
//       </div>
//     );
//   }

//   if (!isAuthenticated) {
//     return null;
//   }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/chat">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Directory
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Find and connect with other users
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={state.userTypeFilter} onValueChange={handleUserTypeFilter}>
                <SelectTrigger>
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All User Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem> {/* ✅ Changed from "" to "all" */}
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="recruiter">Recruiters</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {state.loading ? 'Loading...' : `${state.filteredUsers.length} users found`}
          </p>
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
                  onInvite={() => handleInviteUser(user)}
                  currentUserId={user?._id || ''} // ✅ Fixed this prop as well
                />
              ))}
            </div>

            {/* Load More */}
            {state.hasMore && !state.loading && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handleLoadMore}
                  variant="outline"
                  size="lg"
                >
                  Load More Users
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
                  Try adjusting your search criteria
                </p>
                <Button onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Modal */}
      {state.showInviteModal && state.selectedUser && (
        <InviteModal
          user={state.selectedUser}
          isOpen={state.showInviteModal}
          onClose={handleInviteModalClose}
          onInviteSent={handleInviteModalClose}
        />
      )}
    </div>
  );
};

// User Card Component
const UserCard = ({
  user,
  onInvite,
  currentUserId
}: {
  user: User;
  onInvite: () => void;
  currentUserId: string;
}) => {
  const isCurrentUser = user._id === currentUserId;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {user.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {user.email}
            </p>
            <div className="flex items-center space-x-2">
              <Badge
                variant={user.userType === 'recruiter' ? 'default' : 'secondary'}
              >
                {user.userType}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>

          {!isCurrentUser && (
            <Button
              size="sm"
              onClick={onInvite}
              className="ml-4"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton for User Grid
const UserGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <div className="flex space-x-2">
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
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

export default UserDirectoryPage;