'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Award,
  MapPin,
  Edit,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { getUserRegistrations, getEventById, mockEvents } from '@/lib/mockData';
import { Event, Registration } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<(Registration & { event: Event })[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const userRegs = getUserRegistrations(user.id);
      const regsWithEvents = userRegs.map(reg => ({
        ...reg,
        event: getEventById(reg.eventId) || mockEvents[0],
      }));
      // Update registrations with events
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setRegistrations(regsWithEvents);
    }
  }, [user]);

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

  const upcomingEvents = registrations.filter(reg => {
    const eventDate = new Date(reg.event.startDate);
    return eventDate >= new Date() && reg.status !== 'cancelled';
  });

  const pastEvents = registrations.filter(reg => {
    const eventDate = new Date(reg.event.startDate);
    return eventDate < new Date() || reg.status === 'cancelled';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'attended':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'attended':
        return <Award className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-linear-to-br from-purple-600 to-orange-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-600 capitalize">{user.role}</p>
                {user.matricNumber && (
                  <p className="text-sm text-gray-500">Matric No: {user.matricNumber}</p>
                )}
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
              <Edit className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            {user.faculty && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Faculty</p>
                  <p className="font-medium text-gray-900">{user.faculty}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        {user.role === 'student' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-purple-600" />
                Upcoming Events
              </h2>
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingEvents.map((reg) => (
                    <Link
                      key={reg.id}
                      href={`/events/${reg.event.id}`}
                      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 flex-1">{reg.event.title}</h3>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                          {getStatusIcon(reg.status)}
                          {reg.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{reg.event.organizerName}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(reg.event.startDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {reg.event.venue}
                        </div>
                      </div>
                      {reg.event.hasMyCSD && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span className="text-purple-600 font-medium">{reg.event.mycsdPoints} MyCSD Points</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No upcoming events registered</p>
                  <Link
                    href="/events"
                    className="inline-block bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
                  >
                    Browse Events
                  </Link>
                </div>
              )}
            </div>

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Past Events</h2>
                <div className="bg-white rounded-lg shadow-md divide-y">
                  {pastEvents.map((reg) => (
                    <Link
                      key={reg.id}
                      href={`/events/${reg.event.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{reg.event.title}</h3>
                        <p className="text-sm text-gray-600">{reg.event.organizerName}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(reg.event.startDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {reg.event.hasMyCSD && (
                          <div className="flex items-center gap-1 text-sm text-purple-600">
                            <Award className="w-4 h-4" />
                            {reg.event.mycsdPoints} pts
                          </div>
                        )}
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reg.status)}`}>
                          {getStatusIcon(reg.status)}
                          {reg.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* For Organizers and Admins - Placeholder */}
        {user.role === 'organizer' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Building2 className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Organizer Dashboard</h2>
            <p className="text-gray-600 mb-4">Manage your events and view analytics</p>
            <Link
              href="/organizer/dashboard"
              className="inline-block bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Award className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Panel</h2>
            <p className="text-gray-600 mb-4">Manage events, users, and MyCSD approvals</p>
            <Link
              href="/admin/dashboard"
              className="inline-block bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
            >
              Go to Admin Panel
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
