'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEventById } from '@/backend/services/eventService';
import { getEventRegistrations, approveRegistration, rejectRegistration, checkInUser } from '@/backend/services/registrationService';
import { Event, Registration, PaymentStatus } from '@/types';
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
  Users as UsersIcon,
  Phone,
  Mail,
  Award,
  Eye,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '@/components/Modal';

type AttendanceStatus = 'checked-in' | 'registered' | 'cancelled' | 'pending';

export default function AttendeesPage() {
  const params = useParams();
  const { user, isLoading: authLoading } = useRequireRole(['organizer'], '/');
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<'attendees' | 'committee'>('attendees');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | 'all'>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [origin, setOrigin] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [rejectConfirmationId, setRejectConfirmationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (!showQRModal) {
      setTimeLeft(30);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setQrTimestamp(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showQRModal]);

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
      if (reg.status === 'pending') status = 'pending';

      return {
        id: reg.id,
        userId: reg.userId,
        name: reg.userName,
        email: reg.userEmail,
        matricNumber: reg.matricNumber || '',
        faculty: reg.faculty || '',
        registeredAt: reg.registeredAt,
        status: status,
        checkInTime: reg.status === 'attended' ? reg.updatedAt : null,
        paymentStatus: reg.paymentStatus,
        paymentAmount: reg.paymentAmount,
        receiptUrl: reg.qrCode // Using qrCode field for receipt URL as mapped in service
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

  // Filter committee members
  const filteredCommittee = useMemo(() => {
    if (!event?.committeeMembers) return [];

    let filtered = event.committeeMembers;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(query) ||
        member.matricNumber.toLowerCase().includes(query) ||
        member.position.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [event, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = attendees.length;
    const checkedIn = attendees.filter(a => a.status === 'checked-in').length;
    const registered = attendees.filter(a => a.status === 'registered').length;
    const cancelled = attendees.filter(a => a.status === 'cancelled').length;
    const pending = attendees.filter(a => a.status === 'pending').length;

    return { total, checkedIn, registered, cancelled, pending };
  }, [attendees]);

  const handleCheckIn = async (userId: string) => {
    setIsProcessing(true);
    try {
      await checkInUser(eventId, userId);
      toast.success('Attendee checked in successfully!');
      // Refresh data
      const regs = await getEventRegistrations(eventId);
      setRegistrations(regs);
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in attendee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprovePayment = async (userId: string) => {
    if (!confirm('Are you sure you want to approve this payment?')) return;
    setIsProcessing(true);
    try {
      await approveRegistration(eventId, userId);
      toast.success('Payment approved successfully');
      // Refresh data
      const regs = await getEventRegistrations(eventId);
      setRegistrations(regs);
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectPayment = (userId: string) => {
    setRejectConfirmationId(userId);
  };

  const executeRejectPayment = async () => {
    if (!rejectConfirmationId) return;
    setIsProcessing(true);
    try {
      await rejectRegistration(eventId, rejectConfirmationId);
      toast.success('Payment rejected');
      // Refresh data
      const regs = await getEventRegistrations(eventId);
      setRegistrations(regs);
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setIsProcessing(false);
      setRejectConfirmationId(null);
    }
  };

  const openReceiptModal = (url: string) => {
    setSelectedReceipt(url);
    setReceiptModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!event) return;
    if (activeTab === 'attendees') {
      // Export Attendees
      const csvData = filteredAttendees.map(a => ({
        Name: a.name,
        Email: a.email,
        'Matric Number': a.matricNumber,
        Faculty: a.faculty,
        'Registered At': format(new Date(a.registeredAt), 'yyyy-MM-dd HH:mm'),
        Status: a.status,
        'Check-in Time': a.checkInTime ? format(new Date(a.checkInTime), 'yyyy-MM-dd HH:mm') : '-'
      }));

      if (csvData.length === 0) {
        toast.error('No attendees to export');
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => {
          // @ts-ignore
          const value = row[header] ? String(row[header]).replace(/"/g, '""') : '';
          return `"${value}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `attendees-${event.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Attendees CSV exported successfully!');
    } else {
      // Export Committee
      const csvData = filteredCommittee.map(c => ({
        Name: c.name,
        'Matric Number': c.matricNumber,
        Position: c.position,
        Email: c.email || '-',
        Phone: c.phone || '-'
      }));

      if (csvData.length === 0) {
        toast.error('No committee members to export');
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => {
          // @ts-ignore
          const value = row[header] ? String(row[header]).replace(/"/g, '""') : '';
          return `"${value}"`;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `committee-${event.id}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast.success('Committee list exported successfully!');
    }
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
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            Pending Approval
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

  const getPositionBadgeColor = (position: string) => {
    const lower = position.toLowerCase();
    if (lower.includes('pengarah') || lower.includes('director')) return 'bg-purple-100 text-purple-800';
    if (lower.includes('ajk tertinggi') || lower.includes('top committee')) return 'bg-blue-100 text-blue-800';
    if (lower.includes('ajk') || lower.includes('committee')) return 'bg-cyan-100 text-cyan-800';
    return 'bg-gray-100 text-gray-800';
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
  if (event.organizerId !== user.organizationId) {
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
              <p className="text-gray-600">Attendee & Committee Management</p>
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

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('attendees')}
                className={`${activeTab === 'attendees'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <UsersIcon className="w-4 h-4" />
                Participants
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-2">{stats.total}</span>
              </button>
              <button
                onClick={() => setActiveTab('committee')}
                className={`${activeTab === 'committee'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2`}
              >
                <Award className="w-4 h-4" />
                Committee List
                <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs ml-2">
                  {event.committeeMembers?.length || 0}
                </span>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'attendees' ? (
            <>
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as AttendanceStatus | 'all')}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                {isLoadingData ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading attendees...</p>
                  </div>
                ) : (
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
                              Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Receipt
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
                                {event.participationFee > 0 ? (
                                  attendee.paymentStatus === 'paid' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Paid
                                    </span>
                                  ) : attendee.paymentStatus === 'pending' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  ) : attendee.paymentStatus === 'failed' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      Rejected
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">-</span>
                                  )
                                ) : (
                                  <span className="text-gray-400 text-xs">Free</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {attendee.receiptUrl ? (
                                  <button
                                    onClick={() => openReceiptModal(attendee.receiptUrl!)}
                                    className="text-purple-600 hover:text-purple-900"
                                    title="View Receipt"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {/* Check-in Action */}
                                  {attendee.status === 'registered' && (
                                    <button
                                      onClick={() => handleCheckIn(attendee.userId)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Check In"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                  )}

                                  {/* Payment Approval Actions */}
                                  {attendee.paymentStatus === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleApprovePayment(attendee.userId)}
                                        disabled={isProcessing}
                                        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                        title="Approve Payment"
                                      >
                                        <Check className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() => handleRejectPayment(attendee.userId)}
                                        disabled={isProcessing}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                        title="Reject Payment"
                                      >
                                        <X className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                </div>
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
                )}
              </div>
            </>
          ) : (
            // Committee Tab Content
            <>
              {/* Filter & Search for Committee */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search committee by name, matric, or position..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Committee Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  {filteredCommittee.length > 0 ? (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name / Matric
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Faculty
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Info
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCommittee.map((member, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-500">{member.matricNumber}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPositionBadgeColor(member.position)}`}
                              >
                                {member.position}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {member.faculty || '-'}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                {member.email && (
                                  <div className="flex items-center text-sm text-gray-500 gap-2">
                                    <Mail className="w-3 h-3" />
                                    {member.email}
                                  </div>
                                )}
                                {member.phone && (
                                  <div className="flex items-center text-sm text-gray-500 gap-2">
                                    <Phone className="w-3 h-3" />
                                    {member.phone}
                                  </div>
                                )}
                                {!member.email && !member.phone && (
                                  <span className="text-gray-400 text-sm">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No committee members found</p>
                      <p className="text-gray-400 text-sm">
                        {searchQuery ? 'Try adjusting your search' : 'No committee members assigned to this event'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

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
          <div className="inline-block p-6 bg-white border-2 border-gray-200 rounded-lg relative">
            <QRCodeSVG
              value={`${origin}/checkin?eventId=${event.id}&t=${qrTimestamp}`}
              size={256}
              level="H"
              includeMargin
            />
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                <Clock className="w-3 h-3" />
                <span>Refreshing in {timeLeft}s</span>
              </div>
            </div>
          </div>

        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        title="Payment Receipt"
        size="lg"
      >
        <div className="flex flex-col items-center">
          {selectedReceipt ? (
            <div className="relative w-full h-[60vh] bg-gray-100 rounded-lg">
              <Image
                src={selectedReceipt}
                alt="Payment Receipt"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <p>No receipt available</p>
          )}
          <div className="mt-4 flex justify-end w-full">
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={!!rejectConfirmationId}
        onClose={() => setRejectConfirmationId(null)}
        title="Reject Payment"
        size="md"
      >
        <div className="p-4">
          <div className="flex flex-col items-center justify-center text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Rejection</h3>
            <p className="text-gray-600">
              Are you sure you want to reject this payment? The student will be notified and asked to resubmit.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setRejectConfirmationId(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={executeRejectPayment}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Rejecting...
                </>
              ) : (
                'Yes, Reject Payment'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
