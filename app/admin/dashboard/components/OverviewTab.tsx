'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
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

export default function OverviewTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [mycsdRequests, setMycsdRequests] = useState<MyCSDRequest[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        if (fetchedMycsd) setMycsdRequests(fetchedMycsd as unknown as MyCSDRequest[]);
        if (fetchedNotifications) setRecentNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            {/* Optional: Add a small menu icon or trend indicator here if needed */}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
            <p className="text-sm text-gray-500">Total Events</p>
            <p className="text-xs text-green-600 font-medium bg-green-50 inline-block px-1.5 py-0.5 rounded">
              {stats.publishedEvents} Active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{stats.pendingProposals}</p>
            <p className="text-sm text-gray-500">Pending Proposals</p>
            {stats.pendingProposals > 0 && (
              <Link href="?tab=proposals" className="text-xs text-purple-600 font-medium hover:underline">
                Review Request
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{stats.pendingMyCSDClaims}</p>
            <p className="text-sm text-gray-500">MyCSD Claims</p>
            {stats.pendingMyCSDClaims > 0 && (
              <Link href="?tab=mycsd" className="text-xs text-purple-600 font-medium hover:underline">
                Review Request
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
              <button className="text-gray-400 hover:text-gray-600">
                {/* Options icon placeholder */}
                <span className="text-xl leading-none">...</span>
              </button>
            </div>
            <div className="space-y-0">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => {
                  return (
                    <div key={activity.id} className={`flex items-center justify-between py-4 ${index !== recentActivity.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            activity.color === 'green' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                          }`}>
                          {activity.icon && <activity.icon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{activity.title}</p>
                          <p className="text-xs text-gray-500">{activity.user}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${activity.type?.includes('approved') ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                          {activity.type?.includes('approved') ? 'Approved' : 'Submitted'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{activity.displayTime}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions / Side Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Top Performing or similar could go here, for now keeping Quick Actions but styled better */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="?tab=proposals"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Review Proposals</p>
                </div>
                <Users className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors" /> {/* Arrow placeholder */}
              </Link>

              <Link
                href="?tab=mycsd"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Approve Points</p>
                </div>
                <Users className="w-4 h-4 text-gray-300 group-hover:text-green-600 transition-colors" />
              </Link>

              <Link
                href="?tab=users"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                </div>
                <Users className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
