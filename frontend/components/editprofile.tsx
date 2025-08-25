"use client"
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Loader2, User, Globe, Phone, Link, Building, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { toast } from 'sonner'; // Assuming you're using sonner for toasts

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

interface EditProfileModalProps {
  user: User;
  additionalInfo: AdditionalInfo | null;
  onProfileUpdate: (updatedData: any) => void;
  trigger?: React.ReactNode;
}

interface FormData {
  name: string;
  country: string;
  phoneNumber: string;
  profileLink: string;
  companyName: string;
  companyWebsite: string;
  description: string;
}

interface FormErrors {
  [key: string]: string;
}

const COUNTRIES = [
  'UK', 'CA', 'US', 'AU' ,'Europe'
];

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  additionalInfo,
  onProfileUpdate,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Store initial values to compare against
  const [initialValues, setInitialValues] = useState<FormData>({
    name: '',
    country: '',
    phoneNumber: '',
    profileLink: '',
    companyName: '',
    companyWebsite: '',
    description: '',
  });
  
  const [formData, setFormData] = useState<FormData>({
    name: user.name || '',
    country: user.country || '',
    phoneNumber: additionalInfo?.phoneNumber || '',
    profileLink: additionalInfo?.profileLink || '',
    companyName: additionalInfo?.companyName || '',
    companyWebsite: additionalInfo?.companyWebsite || '',
    description: additionalInfo?.description || '',
  });

  // Reset form when modal opens and set initial values
  useEffect(() => {
    if (open) {
      const initialData = {
        name: user.name || '',
        country: user.country || '',
        phoneNumber: additionalInfo?.phoneNumber || '',
        profileLink: additionalInfo?.profileLink || '',
        companyName: additionalInfo?.companyName || '',
        companyWebsite: additionalInfo?.companyWebsite || '',
        description: additionalInfo?.description || '',
      };
      
      setFormData(initialData);
      setInitialValues(initialData);
      setErrors({});
    }
  }, [open, user, additionalInfo]);

  // Function to get only changed fields
  const getChangedFields = (): Partial<FormData> => {
    const changedFields: Partial<FormData> = {};
    
    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      const currentValue = formData[key].trim();
      const initialValue = initialValues[key].trim();
      
      // Only include field if value has actually changed
      if (currentValue !== initialValue) {
        changedFields[key] = currentValue;
      }
    });
    
    return changedFields;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const changedFields = getChangedFields();

    // Only validate fields that have been changed or are required
    if ('name' in changedFields || !formData.name.trim()) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
    }

    if ('country' in changedFields || !formData.country.trim()) {
      if (!formData.country.trim()) {
        newErrors.country = 'Country is required';
      }
    }

    // LinkedIn URL validation - only if changed
    if ('profileLink' in changedFields && formData.profileLink.trim()) {
      const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_]+\/?(?:\?.*)?$/;
      if (!linkedInRegex.test(formData.profileLink)) {
        newErrors.profileLink = 'Please enter a valid LinkedIn profile URL';
      }
    }

    // Company website validation - only if changed
    if ('companyWebsite' in changedFields && formData.companyWebsite.trim()) {
      try {
        new URL(formData.companyWebsite);
      } catch {
        newErrors.companyWebsite = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const changedFields = getChangedFields();
    
    // If no fields changed, show message and close modal
    if (Object.keys(changedFields).length === 0) {
      toast.info('No changes detected');
      setOpen(false);
      return;
    }

    setLoading(true);

    try {
      // Only send changed fields to the backend
      const updateData: any = {};
      
      // Add only changed fields to the update data
      Object.entries(changedFields).forEach(([key, value]) => {
        if (value && value.length > 0) {
          updateData[key] = value;
        }
      });

      console.log('Sending only changed fields:', updateData);

      const response = await api.put('/updateProfile', updateData);

      if (response.status === 200) {
        toast.success('Profile updated successfully!');
        onProfileUpdate(response.data.data);
        setOpen(false);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if there are any changes
  const hasChanges = Object.keys(getChangedFields()).length > 0;

  const defaultTrigger = (
    <Button className="bg-[#0284DA] hover:bg-[#0284DA]/90">
      <Edit className="w-4 h-4 mr-2" />
      Edit Profile
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Basic Information</h3>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country}</p>
              )}
            </div>

            {/* User Type Display */}
            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex items-center space-x-2">
                <Badge className={
                  user.userType === 'recruiter' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }>
                  {user.userType === 'recruiter' ? 'Recruiter' : 'User'}
                </Badge>
                <span className="text-sm text-gray-500">
                  (Contact support to change account type)
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Contact Information</h3>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+1 234 567 8900"
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            {/* LinkedIn Profile */}
            <div className="space-y-2">
              <Label htmlFor="profileLink">LinkedIn Profile</Label>
              <Input
                id="profileLink"
                value={formData.profileLink}
                onChange={(e) => handleInputChange('profileLink', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className={errors.profileLink ? 'border-red-500' : ''}
              />
              {errors.profileLink && (
                <p className="text-sm text-red-500">{errors.profileLink}</p>
              )}
            </div>
          </div>

          {/* Recruiter-specific fields */}
          {user.userType === 'recruiter' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Company Information</h3>
              </div>

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              {/* Company Website */}
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://company.com"
                  className={errors.companyWebsite ? 'border-red-500' : ''}
                />
                {errors.companyWebsite && (
                  <p className="text-sm text-red-500">{errors.companyWebsite}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Tell us about your company..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Show changed fields indicator */}
          {hasChanges && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Changes detected in:</strong> {Object.keys(getChangedFields()).join(', ')}
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasChanges}
              className="bg-[#0284DA] hover:bg-[#0284DA]/90"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;