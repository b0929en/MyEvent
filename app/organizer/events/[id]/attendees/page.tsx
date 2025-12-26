'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEventById } from '@/backend/services/eventService';
import { getEventRegistrations } from '@/backend/services/registrationService';
import { Event, Registration } from '@/types';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Search, 
  Download,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Users as UsersIcon
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '@/components/Modal';

type AttendanceStatus = 'checked-in' | 'registered' | 'cancelled';

export default function AttendeesPage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');
  const eventId = params.id as string;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (eventId) {
        try {
          const [fetchedEvent, fetchedRegistrations] = await Promise.all([
            getEventById(eventId),
            getEventRegistrations(eventId)
          ]);
          setEvent(fetchedEvent);
          setRegistrations(fetchedRegistrations);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    fetchData();
  }, [eventId]);

  // Get attendees for this event
  const attendees = useMemo(() => {
    return registrations.map(reg => {
      let status: AttendanceStatus = 'registered';
      if (reg.status === 'attended') status = 'checked-in';
      if (reg.status === 'cancelled') status = 'cancelled';

      return {
        id: reg.id,
        userId: reg.userId,
        name: reg.userName,
        email: reg.userEmail,
        matricNumber: reg.matricNumber || '',
        faculty: '',
        registeredAt: reg.registeredAt,
        status: status,
        checkInTime: reg.status === 'attended' ? reg.updatedAt : null,
      };
    });
  }, [registrations]);

  // Filter attendees
  const filteredAttendees = useMemo(() => {
    let filtered = attendees;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.matricNumber?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [attendees, statusFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.status === 'checked-in').length;
    const registered = attendees.filter(a => a.status === 'registered').length;
    const cancelled = attendees.filter(a => a.status === 'cancelled').length;

    return { total, checkedIn, registered, cancelled };
  }, [attendees]);

  const handleCheckIn = (attendeeId: string) => {
    // Backend will implement actual check-in logic
    toast.success('Attendee checked in successfully!');
    console.log('Check in attendee:', attendeeId);
  };

  const handleExportCSV = () => {
    // Backend will implement CSV export
    const csvData = filteredAttendees.map(a => ({
      Name: a.name,
      Email: a.email,
      'Matric Number': a.matricNumber,
      Faculty: a.faculty,
      'Registered At': format(new Date(a.registeredAt), 'yyyy-MM-dd HH:mm'),
      Status: a.status,
      'Check-in Time': a.checkInTime ? format(new Date(a.checkInTime), 'yyyy-MM-dd HH:mm') : '-'
    }));

    console.log('Export CSV data:', csvData);
    toast.success('CSV exported successfully!');
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'checked-in':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Checked In
          </span>
        );
      case 'registered':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3" />
            Registered
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <Link href="/organizer/dashboard" className="text-purple-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is the organizer of this event
  if (event.organizerId !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">You don&apos;t have permission to view this page</p>
          <Link href="/organizer/dashboard" className="text-purple-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Organizer Dashboard', href: '/organizer/dashboard' },
              { label: event.title, href: `/events/${event.id}` },
              { label: 'Attendees' }
            ]}
          />

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/organizer/dashboard"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-600">Attendee Management</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQRModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                Event QR Code
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-purple-600 to-purple-700 text-white rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                <Download className="w-5 h-5" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Attendees</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Checked In</p>
                  <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registered</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.registered}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                  <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or matric number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | 'all')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="checked-in">Checked In</option>
                  <option value="registered">Registered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attendees Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              {filteredAttendees.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faculty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{attendee.name}</div>
                            <div className="text-sm text-gray-500">{attendee.email}</div>
                            {attendee.matricNumber && (
                              <div className="text-xs text-gray-400">{attendee.matricNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {attendee.faculty}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {format(new Date(attendee.registeredAt), 'MMM dd, yyyy')}
                          <div className="text-xs text-gray-500">
                            {format(new Date(attendee.registeredAt), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(attendee.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {attendee.checkInTime ? (
                            <>
                              {format(new Date(attendee.checkInTime), 'MMM dd, yyyy')}
                              <div className="text-xs text-gray-500">
                                {format(new Date(attendee.checkInTime), 'h:mm a')}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {attendee.status === 'registered' && (
                            <button
                              onClick={() => handleCheckIn(attendee.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Check In
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No attendees found</p>
                  <p className="text-gray-400 text-sm">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Try adjusting your filters'
                      : 'No one has registered yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Event Check-in QR Code"
        size="md"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Scan this QR code to check in attendees quickly
          </p>
          <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg">
            <QRCodeSVG
              value={`myevent://checkin/${event.id}`}
              size={256}
              level="H"
              includeMargin
            />
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Event ID: <span className="font-mono font-semibold">{event.id}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Backend Implementation Required:</strong>
            </p>
            <ul className="text-xs text-gray-500 mt-1 space-y-1 text-left">
              <li>• Generate time-based tokens (20s expiry) via API endpoint</li>
              <li>• Frontend will fetch new token every 20s and update QR code</li>
              <li>• Validate token on check-in to prevent QR code sharing</li>
              <li>• QR format: <code className="bg-gray-200 px-1 rounded">myevent://checkin/{`{eventId}/{token}`}</code></li>
            </ul>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
