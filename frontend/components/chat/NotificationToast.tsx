'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle, Check, XCircle, Users } from 'lucide-react';

interface ToastNotification {
  id: string;
  type: 'invite_received' | 'invite_accepted' | 'invite_declined' | 'chat_session_created' | 'user_online' | 'user_offline';
  title: string;
  message: string;
  timestamp: string;
  data?: any;
  duration?: number; // in milliseconds, defaults to 5000
}

interface NotificationToastProps {
  notifications: ToastNotification[];
  onRemoveNotification: (id: string) => void;
  onNotificationClick?: (notification: ToastNotification) => void;
}

const getNotificationIcon = (type: ToastNotification['type']) => {
  switch (type) {
    case 'invite_received':
      return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'invite_accepted':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'invite_declined':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'chat_session_created':
      return <Users className="h-5 w-5 text-purple-500" />;
    case 'user_online':
      return <div className="h-3 w-3 bg-green-500 rounded-full" />;
    case 'user_offline':
      return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    default:
      return <MessageCircle className="h-5 w-5 text-gray-500" />;
  }
};

const getNotificationColors = (type: ToastNotification['type']) => {
  switch (type) {
    case 'invite_received':
      return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
    case 'invite_accepted':
      return 'border-green-200 bg-green-50 hover:bg-green-100';
    case 'invite_declined':
      return 'border-red-200 bg-red-50 hover:bg-red-100';
    case 'chat_session_created':
      return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
    case 'user_online':
      return 'border-green-200 bg-green-50 hover:bg-green-100';
    case 'user_offline':
      return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    default:
      return 'border-gray-200 bg-white hover:bg-gray-50';
  }
};

const ToastItem = ({ 
  notification, 
  onRemove, 
  onClick 
}: { 
  notification: ToastNotification;
  onRemove: (id: string) => void;
  onClick?: (notification: ToastNotification) => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto remove after duration
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);

    return () => clearTimeout(timer);
  }, [notification.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div
        className={`
          relative max-w-sm w-full bg-white border rounded-lg shadow-lg p-4 mb-3
          cursor-pointer transition-colors duration-200
          ${getNotificationColors(notification.type)}
        `}
        onClick={handleClick}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="flex items-start space-x-3 pr-6">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getNotificationIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {notification.title}
              </h4>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatTime(notification.timestamp)}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.message}
            </p>

            {/* Action buttons for invite notifications */}
            {notification.type === 'invite_received' && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle accept action
                    console.log('Accept invite:', notification.data);
                  }}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle decline action
                    console.log('Decline invite:', notification.data);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all ease-linear"
            style={{
              animation: `shrink ${notification.duration || 5000}ms linear`
            }}
          />
        </div>
      </div>
    </div>
  );
};

const NotificationToast = ({ 
  notifications, 
  onRemoveNotification, 
  onNotificationClick 
}: NotificationToastProps) => {
  if (!notifications.length) return null;

  return (
    <>
      {/* Keyframes for progress bar animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 max-h-screen overflow-y-auto">
        <div className="space-y-2">
          {notifications.map((notification) => (
            <ToastItem
              key={notification.id}
              notification={notification}
              onRemove={onRemoveNotification}
              onClick={onNotificationClick}
            />
          ))}
        </div>
      </div>
    </>
  );
};

// Hook to manage toast notifications
export const useToastNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: ToastNotification = {
      ...notification,
      id,
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper functions for common notification types
  const showInviteReceived = (senderName: string, message: string, data?: any) => {
    addNotification({
      type: 'invite_received',
      title: 'New Chat Invite',
      message: `${senderName}: ${message}`,
      timestamp: new Date().toISOString(),
      data,
      duration: 10000 // Longer duration for invite notifications
    });
  };

  const showInviteAccepted = (accepterName: string) => {
    addNotification({
      type: 'invite_accepted',
      title: 'Invite Accepted',
      message: `${accepterName} accepted your chat invite`,
      timestamp: new Date().toISOString(),
    });
  };

  const showInviteDeclined = (declinerName: string) => {
    addNotification({
      type: 'invite_declined',
      title: 'Invite Declined',
      message: `${declinerName} declined your chat invite`,
      timestamp: new Date().toISOString(),
    });
  };

  const showChatSessionCreated = () => {
    addNotification({
      type: 'chat_session_created',
      title: 'Chat Ready',
      message: 'Your chat session is now active',
      timestamp: new Date().toISOString(),
    });
  };

  const showUserOnline = (userName: string) => {
    addNotification({
      type: 'user_online',
      title: 'User Online',
      message: `${userName} is now online`,
      timestamp: new Date().toISOString(),
      duration: 3000 // Shorter for presence notifications
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    // Helper functions
    showInviteReceived,
    showInviteAccepted,
    showInviteDeclined,
    showChatSessionCreated,
    showUserOnline,
  };
};

export default NotificationToast;