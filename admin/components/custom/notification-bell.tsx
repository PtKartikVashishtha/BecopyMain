"use client";

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSocket } from '@/context/SocketContext';

interface Notification {
  type: string;
  data: {
    id: string;
    type: string;
    message: string;
    useremail?: string;
  };
  timestamp: Date;
}
interface NotificationBellProps {
  changeTab: (lang: string) => void;
}

export function NotificationBell({ changeTab }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (notification: Notification) => {
      console.log('Received notification in bell:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast notification
      toast(notification.type === 'new-contribution' ? 'New Contribution' : 'New Job', {
        description: notification.data.message,
      });
    };

    // Add event listener
    socket.on('admin-notification', handleNotification);

    // Cleanup
    return () => {
      socket.off('admin-notification', handleNotification);
    };
  }, [socket]);

  const handleNotificationClick = (notification: Notification) => {
    console.log(changeTab);
    switch (notification.type) {
      case 'new-contribution':
        changeTab('contributions');
        break;
      case 'new-job':
        changeTab('jobs');
        break;
    }
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          notifications.map((notification, index) => (
            <button
              key={index}
              className="w-full p-4 border-b last:border-0 hover:bg-gray-50 text-left"
              onClick={() => handleNotificationClick(notification)}
            >
              <p className="font-medium">{notification.data.message}</p>
              <p className="text-sm text-gray-500">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}