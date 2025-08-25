"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { toast } from 'sonner';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_API_URL, {
      withCredentials: true,
      transports: ['websocket'], // Force WebSocket transport
      reconnection: true, // Enable reconnection
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      // Register as admin when connected
      newSocket.emit('register-admin');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('admin-notification', (data) => {
      console.log('Received notification:', data);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.off('admin-notification');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.close();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}