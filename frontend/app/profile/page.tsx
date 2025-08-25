"use client"
import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Globe, 
  Phone, 
  Building, 
  ExternalLink, 
  Edit, 
  Shield,
  Code,
  Award,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import EditProfileModal from '@/components/editprofile';

// Fetch Profile API
const fetchUserProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
};

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  userType: string;
  country: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface AdditionalInfo {
  phoneNumber?: string;
  profileLink?: string;
  companyName?: string;
  companyWebsite?: string;
  description?: string;
}

interface Contribution {
  title: string;
  language: string;
  status: string;
  views?: number;
  copies?: number;
}

interface ProfileData {
  user: User;
  additionalInfo: AdditionalInfo | null;
  contributions: Contribution[];
}

const ProfilePage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const result = await fetchUserProfile();
        
        console.log(result.data)

        if (result?.status === 200) {
          const { user, additionalInfo, contributions } = result.data.data;

          setProfileData({
            user,
            additionalInfo: additionalInfo || null,
            contributions: contributions || [],
          });
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        setError('Network error occurred');
        console.error('Profile loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleProfileUpdate = (updatedUser: User) => {
    if (profileData) {
      setProfileData(prev => ({
        ...prev!,
        user: updatedUser
      }));
      
      // Optionally refresh the entire profile data
      // loadProfile();
    }
  };

  const getUserTypeDisplay = (userType: string) => {
    switch (userType) {
      case 'recruiter':
        return { text: 'Recruiter', color: 'bg-purple-100 text-purple-800' };
      case 'user':
        return { text: 'User', color: 'bg-blue-100 text-blue-800' };
      default:
        return { text: userType, color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error / No Data
  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load profile'}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { user: userData, additionalInfo, contributions } = profileData;
  const userTypeInfo = getUserTypeDisplay(userData.userType);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-[#0284DA] to-[#7AD2F4] h-24"></div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between -mt-12">
              <div className="flex items-center space-x-4">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarFallback className="bg-[#ff1493] text-white text-2xl">
                    {userData.name
                      .split(' ')
                      .map(word => word[0]?.toUpperCase())
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-12 sm:mt-0">
                  <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={userTypeInfo.color}>
                      {userTypeInfo.text}
                    </Badge>
                    {userData.isEmailVerified && (
                      <Badge className="bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Updated Edit Profile Button with Modal */}
              <div className="mt-4 sm:mt-0">
                <EditProfileModal
                  user={userData}
                  additionalInfo={additionalInfo}
                  onProfileUpdate={handleProfileUpdate}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-sm font-medium text-gray-900">{userData.country}</p>
                  </div>
                </div>
                {additionalInfo?.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{additionalInfo.phoneNumber}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Company Information for Recruiters */}
              {userData.userType === 'recruiter' && (additionalInfo?.companyName || additionalInfo?.companyWebsite || additionalInfo?.description) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Company Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {additionalInfo.companyName && (
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="text-sm font-medium text-gray-900">{additionalInfo.companyName}</p>
                        </div>
                      </div>
                    )}
                    {additionalInfo.companyWebsite && (
                      <div className="flex items-center space-x-3">
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Website</p>
                          <a 
                            href={additionalInfo.companyWebsite} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {additionalInfo.companyWebsite}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  {additionalInfo.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">{additionalInfo.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contributions (Users only) */}
            {userData.userType === 'user' && contributions.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contributions</h2>
                <div className="space-y-3">
                  {contributions.slice(0, 5).map((contribution, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <Code className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{contribution.title}</p>
                        <p className="text-xs text-gray-500">{contribution.language}</p>
                      </div>
                      <Badge variant="outline">{contribution.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Links */}
            {additionalInfo?.profileLink && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
                <a
                  href={additionalInfo.profileLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">in</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">LinkedIn Profile</p>
                    <p className="text-xs text-gray-500">View professional profile</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h2>
              <div className="space-y-4">
                {userData.userType === 'user' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contributions</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {contributions.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Views</span>
                      <span className="text-lg font-semibold text-green-600">
                        {contributions.reduce((sum, c) => sum + (c.views || 0), 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Copies</span>
                      <span className="text-lg font-semibold text-purple-600">
                        {contributions.reduce((sum, c) => sum + (c.copies || 0), 0)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Status</span>
                  <Badge className={userData.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {userData.isEmailVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/categories')}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Browse Codes
                </Button>
                {userData.userType === 'user' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/add-code')}
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Add New Code
                  </Button>
                )}
                {userData.userType === 'recruiter' && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => router.push('/jobs')}
                  >
                    <Building className="w-4 h-4 mr-2" />
                    View Jobs
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/quiz')}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;