'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/lib/services/authService';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: any | null;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => {
    // Check for existing session
    const userData = localStorage.getItem('userData');
    if (userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (credentials: any) => {
    try {
      const response = await authService.register(credentials);
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('userData', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 