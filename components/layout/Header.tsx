'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, Calendar, Award, Menu, X, Bell } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-orange-500">My</span>
              <span className="text-purple-900">Event</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/events"
              className="flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Events
            </Link>

            {isAuthenticated && user?.role === 'student' && (
              <Link
                href="/mycsd"
                className="flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                <Award className="w-4 h-4" />
                MyCSD
              </Link>
            )}

            {isAuthenticated && user?.role === 'organizer' && (
              <Link
                href="/organizer/dashboard"
                className="flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                Dashboard
              </Link>
            )}

            {isAuthenticated && user?.role === 'admin' && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
              >
                Admin Panel
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  href="/notifications"
                  className="relative flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                  {/* Unread badge - backend will provide count */}
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-1 text-gray-700 hover:text-orange-500 font-medium transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/events"
                className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                Events
              </Link>

              {isAuthenticated && user?.role === 'student' && (
                <Link
                  href="/mycsd"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Award className="w-4 h-4" />
                  MyCSD
                </Link>
              )}

              {isAuthenticated && user?.role === 'organizer' && (
                <Link
                  href="/organizer/dashboard"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}

              {isAuthenticated && user?.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell className="w-4 h-4" />
                    Notifications
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:text-orange-500 font-medium py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium py-2 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </nav>

            {isAuthenticated && user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Logged in as:</p>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}