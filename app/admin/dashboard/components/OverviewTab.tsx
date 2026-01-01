'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getEvents } from '@/backend/services/eventService';
import { getUsers } from '@/backend/services/userService';
import { getAllRegistrations } from '@/backend/services/registrationService';
import { getAllProposals, Proposal } from '@/backend/services/proposalService';
import { getAllMyCSDRequests } from '@/backend/services/mycsdService';
import { getAllSystemNotifications, Notification } from '@/backend/services/notificationService';
import { Event, User, Registration, MyCSDRequest, ActivityItem } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  startOfWeek,
  format,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isSameMonth,
  isSameYear,
  addMonths,
  subMonths,
  addYears,
  subYears
} from 'date-fns';

export default function OverviewTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [mycsdRequests, setMycsdRequests] = useState<MyCSDRequest[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());

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

    // "Pending Events" and "Proposals" are treated as the same queue for the admin
    const pendingProposals = proposals.filter(p => p.status === 'pending').length;
    const pendingMyCSDClaims = mycsdRequests.filter(r => r.status === 'pending').length;

    return {
      totalUsers,
      totalEvents,
      publishedEvents,
      pendingProposals,
      pendingMyCSDClaims,
    };
  }, [usersList, events, proposals, mycsdRequests]);

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
    recentNotifications.forEach(n => {
      if (n.title.includes('Event Published')) {
        activity.push({
          id: `notif-${n.id}`,
          type: 'event_approved',
          title: n.title,
          user: n.userName,
          time: n.createdAt,
          displayTime: new Date(n.createdAt).toLocaleDateString(),
          icon: CheckCircle,
          color: 'green'
        });
      }
    });

    // 3. Fallback: Add older published events derived from Event objects
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
          time: e.createdAt,
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

  // Graph Data
  const graphData = useMemo(() => {
    let data: { name: string; count: number; sortKey: number }[] = [];

    if (viewMode === 'year') {
      // Aggregate by Year (All available data)
      const aggregated = events.reduce((acc, event) => {
        const date = new Date(event.startDate || event.createdAt);
        const key = format(date, 'yyyy');
        const sortKey = new Date(date.getFullYear(), 0, 1).getTime();

        if (!acc[key]) {
          acc[key] = { name: key, count: 0, sortKey };
        }
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, { name: string; count: number; sortKey: number }>);
      data = Object.values(aggregated);

    } else { // viewMode === 'month'
      // Events by Month (for selected Year)
      const start = startOfYear(selectedDate);
      const end = endOfYear(selectedDate);
      const months = eachMonthOfInterval({ start, end });

      data = months.map(monthDate => {
        const count = events.filter(e => {
          const eDate = new Date(e.startDate || e.createdAt);
          return isSameMonth(eDate, monthDate) && isSameYear(eDate, monthDate);
        }).length;

        return {
          name: format(monthDate, 'MMM'),
          count,
          sortKey: monthDate.getTime()
        };
      });
    }

    return data.sort((a, b) => a.sortKey - b.sortKey);
  }, [events, viewMode, selectedDate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome back to the admin control center.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.publishedEvents} published</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending Events</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingProposals}</p>
              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                Action Required
              </span>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Pending MyCSD</p>
              <p className="text-3xl font-bold text-green-600">{stats.pendingMyCSDClaims}</p>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-2 inline-block">
                Action Required
              </span>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
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
                  <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                      {activity.icon && <activity.icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.user}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.displayTime}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Graph Insights */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Event Insights</h3>

            <div className="flex items-center gap-4">
              {/* Date Controls */}
              {viewMode !== 'year' && (
                <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                  <button
                    onClick={() => {
                      setSelectedDate(subYears(selectedDate, 1));
                    }}
                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-sm font-medium text-gray-700 min-w-[100px] text-center">
                    {format(selectedDate, 'yyyy')}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedDate(addYears(selectedDate, 1));
                    }}
                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-500 hover:text-gray-900"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['month', 'year'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="h-80">
              <h4 className="text-sm font-medium text-gray-500 mb-4">
                Events by {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f3f4f6' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
