'use client';

import { useState } from 'react';
import { User } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  X,
  Users,
  Briefcase,
  Globe
} from 'lucide-react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSendInvite: (recipientId: string, message: string) => Promise<void>;
  loading: boolean;
}

export default function InviteModal({
  isOpen,
  onClose,
  user,
  onSendInvite,
  loading
}: InviteModalProps) {
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ message?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { message?: string } = {};
    
    if (!message.trim()) {
      newErrors.message = 'Please enter a message';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    } else if (message.trim().length > 500) {
      newErrors.message = 'Message must be less than 500 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0 && user) {
      try {
        await onSendInvite(user.id, message.trim());
        setMessage('');
        setErrors({});
      } catch (error) {
        // Error handling is done in parent component
        console.error('Error sending invite:', error);
      }
    }
  };

  const handleClose = () => {
    setMessage('');
    setErrors({});
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Send Chat Invite
          </DialogTitle>
          <DialogDescription>
            Send a chat invitation to connect with this user.
          </DialogDescription>
        </DialogHeader>
        
        {/* User Info */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 truncate">
              {user.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {user.userType === 'recruiter' ? (
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
              {user.country && (
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {user.country}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Invitation Message</Label>
            <Textarea
              id="message"
              placeholder="Hi! I'd like to connect and chat with you..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors(prev => ({ ...prev, message: undefined }));
                }
              }}
              className={`min-h-[100px] resize-none ${
                errors.message ? 'border-red-500 focus:border-red-500' : ''
              }`}
              maxLength={500}
              disabled={loading}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message}</p>
            )}
            <p className="text-xs text-gray-500">
              {message.length}/500 characters
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {loading ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}