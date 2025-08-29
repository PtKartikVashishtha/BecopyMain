'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Badge } from '@/components/ui/badge';
// Update the import path to the correct location of use-toast
import { Toast } from '@/components/ui/toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  MessageCircle, 
  Send, 
  Globe, 
  Loader2,
  User
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'user' | 'recruiter';
  // country: string;
}

interface InviteModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

const inviteSchema = z.object({
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters long')
    .max(500, 'Message must be less than 500 characters')
    .trim()
});

type InviteFormData = z.infer<typeof inviteSchema>;

const InviteModal: React.FC<InviteModalProps> = ({
  user,
  isOpen,
  onClose,
  onInviteSent
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      message: `Hi ${user.name}! I'd like to connect and chat with you. Looking forward to our conversation!`
    }
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId: user._id,
          message: data.message
        })
      });

      if (response.ok) {
        Toast({
          title: 'Invite Sent',
          content: `Your chat invitation has been sent to ${user.name}`
        });

        form.reset();
        onClose();
        
        if (onInviteSent) {
          onInviteSent();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invite';
      
      Toast({
        title: 'Error',
        content: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onClose();
    }
  };

  const messageLength = form.watch('message')?.length || 0;
  const maxLength = 500;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            <span>Send Chat Invitation</span>
          </DialogTitle>
          <DialogDescription>
            Send a chat invitation to connect with this user
          </DialogDescription>
        </DialogHeader>

        {/* User Info */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg"
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={user.userType === 'recruiter' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  <User className="h-3 w-3 mr-1" />
                  {user.userType}
                </Badge>
                {/* <Badge variant="outline" className="text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {user.country}
                </Badge> */}
              </div>
            </div>
          </div>
        </div>

        {/* Invite Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center justify-between">
                    <span>Your Message</span>
                    <span className="text-xs text-gray-500">
                      {messageLength}/{maxLength}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Write a friendly message to introduce yourself..."
                      className="min-h-[100px] resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || messageLength < 10}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> Personalize your message to increase the chance of acceptance. 
            Mention why you'd like to connect or what you have in common.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteModal;
