'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import StudentProfile from '@/components/profile/StudentProfile';
import OrganizerProfile from '@/components/profile/OrganizerProfile';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="grow pb-16">
        {/* Breadcrumb & Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Profile' }
            ]}
          />
          <div className="mt-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              <span className="text-purple-900">My</span> <span className="text-orange-500">Profile</span>
            </h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {user.role === 'organizer' ? (
            <OrganizerProfile user={user} />
          ) : (
            <StudentProfile user={user} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
