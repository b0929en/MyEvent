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
import { getAllProposals, Proposal } from '@/backend/services/proposalService';
import { getAllMyCSDRequests } from '@/backend/services/mycsdService';
import { getAllSystemNotifications, Notification } from '@/backend/services/notificationService';
import { Event, User, Registration, MyCSDRequest, ActivityItem } from '@/types';
import { 
  Users, 
  Calendar, 
  FileText, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const [events, setEvents] = useState<Event[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [mycsdRequests, setMycsdRequests] = useState<MyCSDRequest[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedEvents, fetchedUsers, fetchedRegistrations, fetchedProposals, fetchedMycsd, fetchedNotifications] = await Promise.all([
          getEvents(),
          getUsers(),
          getAllRegistrations(),
          getAllProposals(),
          getAllMyCSDRequests(),
          getAllSystemNotifications()
        ]);
        if (fetchedEvents) setEvents(fetchedEvents);
        if (fetchedUsers) setUsersList(fetchedUsers);
        if (fetchedRegistrations) setRegistrations(fetchedRegistrations);
        if (fetchedProposals) setProposals(fetchedProposals);
        if (fetchedMycsd) setMycsdRequests(fetchedMycsd);
        if (fetchedNotifications) setRecentNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e.status === 'published' || e.status === 'approved').length;
    const pendingApproval = events.filter(e => e.status === 'pending_approval').length;
    const totalRegistrations = registrations.length;
    
    // "Pending Events" and "Proposals" are treated as the same queue for the admin
    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    const pendingMyCSDClaims = mycsdRequests.filter(r => r.status === 'pending').length;
    
    return {
      totalUsers,
      totalEvents,
      publishedEvents,
      pendingApproval,
      pendingProposals,
      pendingMyCSDClaims,
      totalRegistrations,
    };
  }, [usersList, events, registrations, proposals, mycsdRequests]);

  // Recent activity (derived from data)
  const recentActivity = useMemo(() => {
    const activity: ActivityItem[] = [];
    
    // 1. Add ALL proposals to the pool (Proposal Submitted)
    proposals.forEach(p => {
      activity.push({
        id: `prop-${p.id}`,
        type: 'proposal_submitted',
        title: `New proposal: ${p.eventTitle}`,
        user: p.organizerName,
        time: p.submittedAt, 
        displayTime: new Date(p.submittedAt).toLocaleDateString(),
        icon: FileText,
        color: 'blue'
      });
    });

    // 2. Add System Notifications (Event Published)
    // This is the source of truth for "Event Published" as it captures the approval action
    recentNotifications.forEach(n => {
      if (n.title.includes('Event Published')) {
        activity.push({
          id: `notif-${n.id}`,
          type: 'event_approved',
          title: n.title, // e.g. "Event Published: Event Name"
          user: n.userName, // Recipient (Organizer)
          time: n.createdAt,
          displayTime: new Date(n.createdAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        });
      }
    });

    // 3. Fallback: Add older published events derived from Event objects
    // Only if we don't already have a notification for it
    const notifiedEventNames = new Set(recentNotifications
      .filter(n => n.title.includes('Event Published'))
      .map(n => n.title.replace('Event Published: ', '')));

    events.forEach(e => {
      if ((e.status === 'published' || e.status === 'approved') && !notifiedEventNames.has(e.title)) {
        activity.push({
          id: `event-${e.id}`,
          type: 'event_approved',
          title: `Event Published: ${e.title}`,
          user: e.organizerName,
          time: e.createdAt, // This might be submission time, but it's a valid fallback
          displayTime: new Date(e.createdAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        });
      }
    });

    // 4. Sort by time descending (newest first) and take top 5
    return activity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [proposals, events, recentNotifications]);

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

  if (!user) return null;

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

            {/* Pending Events (Proposals) */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Events</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.pendingProposals}</p>
                  <Link href="/admin/proposals" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                    Review Proposal  →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Pending MyCSD Claims */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending MyCSD Claims</p>
                  <p className="text-3xl font-bold text-green-600">{stats.pendingMyCSDClaims}</p>
                  <Link href="/admin/mycsd" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                    Review Claims  →
                  </Link>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
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
                        <p className="font-medium text-gray-900">Review Events Proposal</p>
                        <p className="text-sm text-gray-600">{stats.pendingProposals} pending</p>
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
                        <p className="font-medium text-gray-900">Review MyCSD Claims</p>
                        <p className="text-sm text-gray-600">{stats.pendingMyCSDClaims} submissions</p>
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
                  {recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No recent activity</p>
                  ) : (
                    recentActivity.map((activity) => {

                      const colorClasses = {
                        blue: 'bg-blue-100 text-blue-600',
                        green: 'bg-green-100 text-green-600',
                        red: 'bg-red-100 text-red-600',
                        yellow: 'bg-yellow-100 text-yellow-600'
                      };

                      return (
                        <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                            {activity.icon && <activity.icon className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.user}</p>
                          </div>
                          <p className="text-sm text-gray-500 shrink-0">{activity.displayTime}</p>
                        </div>
                      );
                    })
                  )}
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