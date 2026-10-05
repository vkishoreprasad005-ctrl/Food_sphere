import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Business, UserRole } from '../types/index.ts';
import { apiRequest } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickLogin: (target: 'admin' | 'owner_1' | 'staff_1' | 'owner_2' | 'staff_2' | 'customer') => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateCurrentBusiness: (biz: Business) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('foodsphere_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('foodsphere_token');
    if (!storedToken) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }

    const res = await apiRequest<{ user: User; business: Business | null }>('/api/auth/me');
    if (res.data) {
      setUser(res.data.user);
      setBusiness(res.data.business);
      setToken(storedToken);
    } else {
      // Invalid/expired token
      localStorage.removeItem('foodsphere_token');
      setUser(null);
      setBusiness(null);
      setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await apiRequest<{ token: string; user: User; business: Business | null }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setIsLoading(false);

    if (res.data) {
      localStorage.setItem('foodsphere_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setBusiness(res.data.business);
      return { success: true };
    }

    return { success: false, error: res.error || 'Login failed' };
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    const res = await apiRequest<{ token: string; user: User; business: Business | null }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsLoading(false);

    if (res.data) {
      localStorage.setItem('foodsphere_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setBusiness(res.data.business);
      return { success: true };
    }

    return { success: false, error: res.error || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('foodsphere_token');
    setUser(null);
    setBusiness(null);
    setToken(null);
  };

  // Quick switch credentials helper for academic demo & grading
  const quickLogin = async (target: 'admin' | 'owner_1' | 'staff_1' | 'owner_2' | 'staff_2' | 'customer') => {
    const creds = {
      admin: { email: 'admin@foodsphere.io', password: 'admin123' },
      owner_1: { email: 'owner@artisanalfork.com', password: 'password123' },
      staff_1: { email: 'staff@artisanalfork.com', password: 'password123' },
      owner_2: { email: 'owner@sweetharmony.com', password: 'password123' },
      staff_2: { email: 'staff@sweetharmony.com', password: 'password123' },
      customer: { email: 'customer@example.com', password: 'customer123' },
    };

    const targetCred = creds[target];
    if (targetCred) {
      await login(targetCred.email, targetCred.password);
    }
  };

  const updateCurrentBusiness = (biz: Business) => {
    setBusiness(biz);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickLogin,
        refreshAuth,
        updateCurrentBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
