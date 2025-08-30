'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { inviteAPI, type User, type APIResponse } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import { useSocket } from '@/hooks/useSocket';
import { RootState } from '@/store/store';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUser: User;
  onInviteSent?: () => void;
}

export default function InviteModal({ 
  isOpen, 
  onClose, 
  recipientUser, 
  onInviteSent 
}: InviteModalProps) {
  // State
  const [inviteMessage, setInviteMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Redux state
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Socket for real-time notifications
  const { sendChatInvite, isUserOnline } = useSocket();

  // API hook for sending invite
  const { data: inviteData, loading, error, execute } = useApi<APIResponse<any>>();

  // Default invite messages based on user type
  const getDefaultMessage = (userType: string) => {
    if (userType === 'recruiter') {
      return "Hi! I'd love to connect and discuss potential opportunities. Looking forward to chatting with you!";
    }
    return "Hi! I'd like to connect with you. Looking forward to our conversation!";
  };

  // Set default message when modal opens
  React.useEffect(() => {
    if (isOpen && !inviteMessage) {
      setInviteMessage(getDefaultMessage(recipientUser.userType));
    }
  }, [isOpen, recipientUser.userType]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setInviteMessage('');
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Handle form submission
  const handleSendInvite = async () => {
    if (!currentUser || !inviteMessage.trim()) return;

    try {
      // Send invite via API
      const response = await execute(
        inviteAPI.send({
          recipientId: recipientUser.id,
          message: inviteMessage.trim()
        })
      );

      if (response.success) {
        // Send real-time notification via socket
        sendChatInvite({
          fromUserId: currentUser.id,
          toUserId: recipientUser.id,
          inviteId: response.data.id,
          inviteMessage: inviteMessage.trim(),
          senderName: currentUser.name
        });

        // Show success state
        setShowSuccess(true);

        // Call callback
        if (onInviteSent) {
          onInviteSent();
        }

        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      // Error is handled by useApi hook
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendInvite();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Send Chat Invite
          </DialogTitle>
          <DialogDescription>
            Send a chat invitation to connect with this user
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          // Success State
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-green-900">Invite Sent!</h3>
              <p className="text-sm text-green-700">
                Your chat invite has been sent to {recipientUser.name}
              </p>
            </div>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                You'll be notified when they respond to your invitation.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          // Invite Form
          <div className="space-y-4">
            {/* Recipient Info */}
            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {getUserInitials(recipientUser.name)}
                  </AvatarFallback>
                </Avatar>
                {isUserOnline(recipientUser.id) && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                )}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{recipientUser.name}</span>
                  {isUserOnline(recipientUser.id) && (
                    <Badge variant="outline" className="text-xs text-green-600">
                      Online
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {recipientUser.userType === 'recruiter' ? 'Recruiter' : 'User'}
                  </Badge>
                  <span>•</span>
                  <span>{recipientUser.country}</span>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="invite-message">Invite Message</Label>
              <Textarea
                id="invite-message"
                placeholder="Write a friendly message to introduce yourself..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={loading}
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Press Ctrl+Enter to send</span>
                <span>{inviteMessage.length}/500</span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {typeof error === 'string' ? error : 
                   error?.message || 'Failed to send invite. Please try again.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvite}
                disabled={loading || !inviteMessage.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-muted-foreground text-center">
              The recipient will receive your invite and can choose to accept or decline.
              {recipientUser.userType === 'recruiter' && 
                " Recruiters typically respond within 24-48 hours."
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}