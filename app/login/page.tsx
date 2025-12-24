'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w.%+-]+@(student\.)?usm\.my$/i.test(email)) {
      newErrors.email = 'Please use a valid USM email (@usm.my or @student.usm.my)';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await login(email);

      if (result.success) {
        toast.success('Login successful! Welcome back.');
        router.push('/');
      } else {
        toast.error(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-700">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Purple Background with Welcome Message */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-purple-700 via-purple-800 to-purple-900 flex-col justify-between p-12">
        {/* Logo */}
        <div>
          <h1 className="text-3xl font-bold">
            <span className="text-orange-500">My</span>
            <span className="text-white">Event</span>
          </h1>
        </div>

        {/* Welcome Text */}
        <div>
          <h2 className="text-6xl font-bold text-white leading-tight">
            Welcome<br />Back!
          </h2>
        </div>

        {/* Empty space for balance */}
        <div></div>
      </div>

      {/* Right Panel - White Background with Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-bold">
              <span className="text-orange-500">My</span>
              <span className="text-purple-900">Event</span>
            </h1>
          </div>

          {/* Login Header */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Login</h2>
            <p className="text-gray-600">Welcome back! Please login to your account.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                placeholder="Username / Email Address"
                className={`w-full px-6 py-4 border-2 rounded-full focus:outline-none focus:border-purple-600 transition-colors ${
                  errors.email
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 px-6">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Password"
                className={`w-full px-6 py-4 border-2 rounded-full focus:outline-none focus:border-purple-600 transition-colors ${
                  errors.password
                    ? 'border-red-500'
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 px-6">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
                Remember Me
              </label>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-900 text-white py-4 rounded-full font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Forgot Links */}
          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">
              Forgot Account ID?
            </p>
            <p className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">
              Forgot Password?
            </p>
          </div>

          {/* Demo Credentials - Development Only */}
          <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs font-medium text-purple-900 mb-2">Demo Credentials (Dev Only):</p>
            <div className="text-xs text-purple-700 space-y-1">
              <p><strong>Student:</strong> jm@student.usm.my</p>
              <p><strong>Organizer:</strong> css@usm.my</p>
              <p><strong>Admin:</strong> bhepa@usm.my</p>
              <p className="text-purple-600 mt-1 italic">Password: any 6+ chars</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
