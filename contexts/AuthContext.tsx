'use client';

/**
 * Authentication Context for MyEvent @ USM
 * Simulates authentication state for frontend development
 * Backend team will replace with actual authentication logic
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getUserByEmail } from '@/lib/mockData';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount (simulate session persistence)
  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('mockUser');
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Mock login function
   * In production, this will call backend API
   * 
   * @param email - User's USM email
   * @param password - User's password (currently not validated in mock mode)
   * @returns Promise with success status and optional error message
   */
  const login = async (email: string, _password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validate email format (must be USM email)
    const usmEmailRegex = /^[\w.%+-]+@(student\.)?usm\.my$/i;
    if (!usmEmailRegex.test(email)) {
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Please use a valid USM email address (@usm.my or @student.usm.my)' 
      };
    }
    
    // Find user in mock data
    const foundUser = getUserByEmail(email);
    
    if (!foundUser) {
      setIsLoading(false);
      return { 
        success: false, 
        error: 'Invalid email or password' 
      };
    }
    
    // In mock mode, any password is accepted for existing users
    // Backend will implement proper password validation
    
    // Store user in state and localStorage
    setUser(foundUser);
    localStorage.setItem('mockUser', JSON.stringify(foundUser));
    
    setIsLoading(false);
    return { success: true };
  };

  /**
   * Logout function
   * Clears user state and localStorage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 * Must be used within AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectUrl: string = '/login') {
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setShouldRedirect(true);
      window.location.href = redirectUrl;
    }
  }, [user, isLoading, redirectUrl]);

  return { user, isLoading, shouldRedirect };
}

/**
 * Hook to require specific role
 * Redirects to appropriate page if user doesn't have required role
 */
export function useRequireRole(allowedRoles: string[], redirectUrl: string = '/') {
  const { user, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
      } else if (!allowedRoles.includes(user.role)) {
        window.location.href = redirectUrl;
      } else {
        setHasAccess(true);
      }
    }
  }, [user, isLoading, allowedRoles, redirectUrl]);

  return { user, isLoading, hasAccess };
}
