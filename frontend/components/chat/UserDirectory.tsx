'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatAPI, User, PaginatedResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Users, 
  MessageCircle,
  Filter,
  RefreshCw,
  Globe,
  Building,
  User as UserIcon,
  Mail,
  MapPin
} from 'lucide-react';
import { debounce } from 'lodash';
import InviteModal from './InviteModal';

interface UserDirectoryProps {
  onUserSelect?: (user: User) => void;
  className?: string;
}

export default function UserDirectory({ onUserSelect, className }: UserDirectoryProps) {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  
  const [countries, setCountries] = useState<string[]>([]);
  const [userTypes, setUserTypes] = useState<string[]>([]);

  // Load users with filters
  const loadUsers = useCallback(async (page = 1, resetData = false) => {
    try {
      if (resetData) {
        setLoading(true);
      }
      
      const filters: any = {
        page,
        limit: pagination.limit
      };
      
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      if (userTypeFilter !== 'all') {
        filters.userType = userTypeFilter;
      }
      
      if (countryFilter !== 'all') {
        filters.country = countryFilter;
      }
      
      const response: PaginatedResponse<User> = await chatAPI.getUserDirectory(filters);
      
      if (response.success) {
        const newUsers = response.data.users || [];
        // Filter out current user
        const filteredUsers = newUsers.filter(u => u.id !== currentUser?.id);
        
        setUsers(resetData ? filteredUsers : [...users, ...filteredUsers]);
        setPagination(response.data.pagination);
        
        // Extract unique countries and user types for filters, filtering out empty/null values
        if (resetData) {
          const uniqueCountries = [...new Set(
            newUsers
              .map(u => u.country)
              .filter(c => c && typeof c === 'string' && c.trim() !== '')
          )].filter(Boolean);
          
          const uniqueUserTypes = [...new Set(
            newUsers
              .map(u => u.userType)
              .filter(t => t && typeof t === 'string' && t.trim() !== '')
          )].filter(Boolean);
          
          setCountries(uniqueCountries);
          setUserTypes(uniqueUserTypes);
        }
      } else {
        console.error('Failed to load users:', response.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.limit, searchTerm, userTypeFilter, countryFilter, currentUser?.id]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500),
    []
  );

  // Handle search input
  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (type: 'userType' | 'country', value: string) => {
    if (type === 'userType') {
      setUserTypeFilter(value);
    } else {
      setCountryFilter(value);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Refresh data
  const refreshData = useCallback(() => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    loadUsers(1, true);
  }, [loadUsers]);

  // Load more users
  const loadMore = useCallback(() => {
    if (pagination.page < pagination.pages && !loading) {
      loadUsers(pagination.page + 1, false);
    }
  }, [pagination, loading, loadUsers]);

  // Handle invite user
  const handleInviteUser = (user: User) => {
    setSelectedUser(user);
    setShowInviteModal(true);
  };

  // Handle invite sent
  const handleInviteSent = () => {
    setShowInviteModal(false);
    setSelectedUser(null);
  };

  // Load initial data
  useEffect(() => {
    loadUsers(1, true);
  }, [searchTerm, userTypeFilter, countryFilter]);

  // Get user type badge color
  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType?.toLowerCase()) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'business':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  // Render user card
  const renderUserCard = (user: User) => (
    <Card key={user.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-16 w-16 group-hover:scale-105 transition-transform">
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white text-lg font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2 w-full">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {user.name}
            </h3>
            
            <div className="flex flex-wrap justify-center gap-2">
              {user.userType && user.userType.trim() && (
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getUserTypeBadgeColor(user.userType)}`}
                >
                  <Building className="h-3 w-3 mr-1" />
                  {user.userType}
                </Badge>
              )}
              
              {user.country && user.country.trim() && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {user.country}
                </Badge>
              )}
            </div>
            
            {user.bio && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                {user.bio}
              </p>
            )}
          </div>
          
          <div className="flex gap-2 w-full">
            <Button
              size="sm"
              onClick={() => handleInviteUser(user)}
              className="flex-1 gap-2 group-hover:bg-blue-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Send Invite
            </Button>
            
            {onUserSelect && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUserSelect(user)}
                className="gap-2"
              >
                <UserIcon className="h-4 w-4" />
                Select
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-5 w-32 mx-auto" />
                <div className="flex justify-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mx-auto" />
              </div>
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <Card>
      <CardContent className="p-12 text-center">
        <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No users found
        </h3>
        <p className="text-gray-600 mb-4">
          {searchTerm || userTypeFilter !== 'all' || countryFilter !== 'all'
            ? 'Try adjusting your search or filters'
            : 'No users are available in the directory'}
        </p>
        {(searchTerm || userTypeFilter !== 'all' || countryFilter !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setUserTypeFilter('all');
              setCountryFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Directory
              {pagination.total > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pagination.total} users
                </Badge>
              )}
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
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>
              
              <Select value={userTypeFilter} onValueChange={(value) => handleFilterChange('userType', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {userTypes.length > 0 && userTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={countryFilter} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.length > 0 && countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Users Grid */}
          {loading && users.length === 0 ? (
            renderLoadingSkeleton()
          ) : users.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map(renderUserCard)}
              </div>
              
              {/* Load More Button */}
              {pagination.page < pagination.pages && (
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Load More Users'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Invite Modal */}
      {selectedUser && (
        <InviteModal
          user={selectedUser}
          open={showInviteModal}
          onOpenChange={setShowInviteModal}
          onInviteSent={handleInviteSent}
        />
      )}
    </div>
  );
}