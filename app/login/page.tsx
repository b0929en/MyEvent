'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user?.role === 'organizer') {
        router.push('/organizer/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, authLoading, router, user]);

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
      const result = await login(email, password);

      if (result.success && result.user) {
        toast.success('Login successful! Welcome back.');

        // Redirect based on role
        if (result.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (result.user.role === 'organizer') {
          router.push('/organizer/dashboard');
        } else {
          router.push('/');
        }
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
      <div
        className="hidden lg:flex lg:w-2/3 flex-col justify-between p-12 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom right, rgba(31, 1, 38, 0.7), rgba(0, 0, 0, 0.8)), url('/usm-bg.jpeg')`
        }}
      >
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
            Welcome Back!
          </h2>
        </div>

        {/* Empty space for balance */}
        <div></div>
      </div>

      {/* Right Panel - White Background with Login Form */}
      <div className="w-full lg:w-1/3 flex items-center justify-center p-8 bg-white">
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
                className={`w-full px-6 py-4 border-2 rounded-full text-gray-500 focus:outline-none focus:border-purple-600 transition-colors ${errors.email
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  placeholder="Password"
                  className={`w-full px-6 py-4 border-2 rounded-full text-gray-500 focus:outline-none focus:border-purple-600 transition-colors ${errors.password
                    ? 'border-red-500'
                    : 'border-gray-300'
                    }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
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
              className="w-full cursor-pointer bg-purple-900 text-white py-4 rounded-full font-medium hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <Link href="/forgot-password" className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer">
              Forgot Password?
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
}
