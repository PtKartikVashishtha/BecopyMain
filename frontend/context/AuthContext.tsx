'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { authService } from '@/lib/services/authService';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  login: (email: string, password: string, userType: "user" | "recruiter") => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const { data: session, status } = useSession();

  const checkAuth = () => {
    try {
      // Check Next-Auth session first
      if (session?.user) {
        // For Next-Auth sessions, we need to get the JWT token from localStorage
        // as it's set during the OAuth flow completion
        const storedToken = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');
        
        if (storedToken && userData) {
          setUser(JSON.parse(userData));
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          // Fallback to session data if localStorage is empty
          setUser({
            id: session.user.id || '',
            name: session.user.name || '',
            email: session.user.email || '',
            country: 'UK', // Default or get from session
            userType: 'user' // Default or get from session
          });
          setToken(storedToken);
          setIsAuthenticated(!!storedToken);
        }
        setLoading(false);
        return;
      }
      
      // Fallback to localStorage for traditional auth
      const storedToken = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');
      
      if (storedToken && userData) {
        setUser(JSON.parse(userData));
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(status === 'loading' ? true : false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [session, status]);

  // Listen for localStorage changes (e.g., after OAuth flow completion)
  useEffect(() => {
    const handleStorageChange = () => {
      checkAuth();
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also check auth when the window gains focus (user returns from OAuth)
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  const login = async (email: string, password: string, userType: "user" | "recruiter"): Promise<boolean> => {
    try {
      const data = await authService.login({ email, password, userType });
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const register = async (userData: any) => {
    try {
      const data = await authService.register(userData);
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear localStorage and state
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    // Redirect to login page
    router.push('/login');
  };

  const updateUser = (userData: any) => {
    // Update both state and localStorage
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, token, login, register, logout, updateUser }}>
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