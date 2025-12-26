'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEvents } from '@/backend/services/eventService';
import { Event } from '@/types';
import { format } from 'date-fns';
import { 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'all' | 'published' | 'pending_approval' | 'draft';

export default function OrganizerDashboard() {
  const { user, isLoading } = useRequireRole(['organizer'], '/');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.organizationId) {
        try {
          const allEvents = await getEvents();
          if (allEvents) {
            setOrganizerEvents(allEvents.filter(event => event.organizerId === user.organizationId));
          }
        } catch (error) {
          console.error('Error fetching events:', error);
        } finally {
          setIsEventsLoading(false);
        }
      } else if (!isLoading && !user) {
         setIsEventsLoading(false);
      }
    };

    fetchEvents();
  }, [user, isLoading]);

  // Filter events by tab
  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return organizerEvents;
    return organizerEvents.filter(event => event.status === activeTab);
  }, [organizerEvents, activeTab]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEvents = organizerEvents.length;
    const totalParticipants = organizerEvents.reduce((sum, event) => sum + event.registeredCount, 0);
    const upcomingEvents = organizerEvents.filter(event => 
      new Date(event.startDate) > new Date()
    ).length;
    const publishedEvents = organizerEvents.filter(event => event.status === 'published').length;

    return { totalEvents, totalParticipants, upcomingEvents, publishedEvents };
  }, [organizerEvents]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_approval':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <Edit className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
              <p className="mt-1 text-gray-600">Manage your events and proposals</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link
                href="/organizer/proposals/submit"
                className="inline-flex items-center gap-2 bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Submit Proposal
              </Link>
              <Link
                href="/organizer/proposals"
                className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all shadow-md"
              >
                View Proposals
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Participants</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Upcoming Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Published Events</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.publishedEvents}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { key: 'all', label: 'All Events', count: organizerEvents.length },
                  { key: 'published', label: 'Published', count: organizerEvents.filter(e => e.status === 'published').length },
                  { key: 'pending_approval', label: 'Pending Approval', count: organizerEvents.filter(e => e.status === 'pending_approval').length },
                  { key: 'draft', label: 'Draft', count: organizerEvents.filter(e => e.status === 'draft').length },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabType)}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? 'border-purple-600 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </nav>
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              {filteredEvents.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {event.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {event.category}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(event.startDate), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {event.startTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {event.registeredCount} / {event.capacity}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(event.registeredCount / event.capacity) * 100}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                            {getStatusIcon(event.status)}
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/events/${event.id}`}
                              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/organizer/events/${event.id}/edit`}
                              className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/organizer/events/${event.id}/attendees`}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                              title="Attendees"
                            >
                              <Users className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this event?')) {
                                  // Delete functionality - backend will implement
                                  alert('Delete functionality will be implemented by backend team');
                                }
                              }}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No events found</p>
                  <p className="text-gray-400 text-sm mb-4">
                    {activeTab === 'all' 
                      ? 'Create your first event to get started' 
                      : `No ${activeTab} events yet`}
                  </p>
                  <Link
                    href="/organizer/events/create"
                    className="inline-flex items-center gap-2 bg-linear-to-r from-purple-600 to-purple-700 text-white px-6 py-2 rounded-full font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create Event
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
