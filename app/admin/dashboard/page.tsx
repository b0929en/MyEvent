'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEvents } from '@/backend/services/eventService';
import { getUsers } from '@/backend/services/userService';
import { getAllRegistrations } from '@/backend/services/registrationService';
import { getAllProposals } from '@/backend/services/proposalService';
import { Event, User, Registration } from '@/types';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const [events, setEvents] = useState<Event[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedEvents, fetchedUsers, fetchedRegistrations, fetchedProposals] = await Promise.all([
          getEvents(),
          getUsers(),
          getAllRegistrations(),
          getAllProposals()
        ]);
        if (fetchedEvents) setEvents(fetchedEvents);
        if (fetchedUsers) setUsersList(fetchedUsers);
        if (fetchedRegistrations) setRegistrations(fetchedRegistrations);
        if (fetchedProposals) setProposals(fetchedProposals);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === 'published').length;
    const pendingApproval = events.filter(e => e.status === 'pending_approval').length;
    const totalRegistrations = registrations.length;
    
    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    
    return {
      totalUsers,
      totalEvents,
      publishedEvents,
      pendingApproval,
      pendingProposals,
      totalRegistrations,
    };
  }, [usersList, events, registrations, proposals]);

  // Recent activity (derived from data)
  const recentActivity = useMemo(() => {
    const activity = [];
    
    // Add recent proposals
    proposals.slice(0, 3).forEach(p => {
      activity.push({
        id: `prop-${p.id}`,
        type: 'proposal_submitted',
        title: `New proposal: ${p.eventTitle}`,
        user: p.organizerName,
        time: new Date(p.submittedAt).toLocaleDateString(),
        icon: FileText,
        color: 'blue'
      });
    });

    // Add recent events
    events.slice(0, 3).forEach(e => {
      if (e.status === 'published') {
        activity.push({
          id: `event-${e.id}`,
          type: 'event_approved',
          title: `Event Published: ${e.title}`,
          user: e.organizerName,
          time: new Date(e.updatedAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        });
      }
    });

    return activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [proposals, events]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Admin Dashboard' }
            ]}
          />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user.name}. Manage proposals, events, and system settings.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.publishedEvents} published</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Proposals</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingProposals}</p>
                  <Link href="/admin/proposals" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                    Review now →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingApproval}</p>
                  <Link href="/admin/events" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                    Review now →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <Link
                    href="/admin/proposals"
                    className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Review Proposals</p>
                        <p className="text-sm text-gray-600">{stats.pendingProposals} pending</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/events"
                    className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Approve Events</p>
                        <p className="text-sm text-gray-600">{stats.pendingApproval} pending</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/mycsd"
                    className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">MyCSD Points</p>
                        <p className="text-sm text-gray-600">Review submissions</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/users"
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Manage Users</p>
                        <p className="text-sm text-gray-600">{stats.totalUsers} total users</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    const colorClasses = {
                      blue: 'bg-blue-100 text-blue-600',
                      green: 'bg-green-100 text-green-600',
                      red: 'bg-red-100 text-red-600',
                      yellow: 'bg-yellow-100 text-yellow-600'
                    };

                    return (
                      <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.user}</p>
                        </div>
                        <p className="text-sm text-gray-500 shrink-0">{activity.time}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Overview (maybe delete?)*/}
              <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Registrations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Active Organizers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usersList.filter(u => u.role === 'organizer').length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Completed Events</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {events.filter(e => e.status === 'completed').length}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">85%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
