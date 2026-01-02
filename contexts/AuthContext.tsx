'use client';

/**
 * Authentication Context for MyEvent @ USM
 * Handles user authentication state and session management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { getUserByEmail, verifyUserPassword } from '@/backend/services/userService';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Fetch latest user data
          const latestUser = await getUserByEmail(parsedUser.email);
          if (latestUser) {
            setUser(latestUser);
            localStorage.setItem('currentUser', JSON.stringify(latestUser));
          } else {
            // If user not found (e.g. deleted), clear session
            localStorage.removeItem('currentUser');
          }
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('currentUser');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  /**
   * Login function
   * 
   * @param email - User's USM email
   * @param password - User's password
   * @returns Promise with success status and optional error message
   */
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string; user?: User }> => {
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

    // Verify password against database
    let authUser = null;
    if (password) {
      authUser = await verifyUserPassword(email, password);
    }

    // Fallback: Master password check (for dev/testing)
    if (!authUser && password === 'cat304') {
      authUser = await getUserByEmail(email);
    }

    if (!authUser) {
      setIsLoading(false);
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }

    // Store user in state and localStorage
    setUser(authUser);
    localStorage.setItem('currentUser', JSON.stringify(authUser));

    setIsLoading(false);
    return { success: true, user: authUser };
  };

  /**
   * Reset password function
   */
  const resetPassword = async (email: string, code: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify code
    if (code.toUpperCase() !== 'CAT304') {
      setIsLoading(false);
      return { success: false, error: 'Invalid verification code' };
    }

    // Check if user exists
    const userExists = await getUserByEmail(email);
    if (!userExists) {
      setIsLoading(false);
      return { success: false, error: 'User with this email does not exist' };
    }

    // Update password via API Route (bypasses RLS)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await response.json();

      setIsLoading(false);

      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to update password' };
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setIsLoading(false);
      return { success: false, error: 'Connection error' };
    }
  };

  /**
   * Logout function
   * Clears user state and localStorage
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    resetPassword,
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

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = redirectUrl;
    }
  }, [user, isLoading, redirectUrl]);

  return { user, isLoading, shouldRedirect: !user };
}

/**
 * Hook to require specific role
 * Redirects to appropriate page if user doesn't have required role
 */
export function useRequireRole(allowedRoles: string[], redirectUrl: string = '/') {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
      } else if (!allowedRoles.includes(user.role)) {
        window.location.href = redirectUrl;
      }
    }
  }, [user, isLoading, allowedRoles, redirectUrl]);

  const hasAccess = !isLoading && user !== null && allowedRoles.includes(user.role);
  return { user, isLoading, hasAccess };
}
