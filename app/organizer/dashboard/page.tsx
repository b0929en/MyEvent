'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEvents } from '@/backend/services/eventService';
import { getAllProposals, Proposal, updateProposalStatus } from '@/backend/services/proposalService';
import { submitMyCSDClaim } from '@/backend/services/mycsdService';
import { uploadDocument } from '@/backend/services/storageService';
import { Event } from '@/types';
import { format } from 'date-fns';
import {
  Plus, Calendar, Users, TrendingUp, Edit, Eye,
  CheckCircle, XCircle, Clock, Copy, Award, Upload, Globe,
  FileText, Ban, AlertCircle, Search, ArrowRight, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import Breadcrumb from '@/components/Breadcrumb';

const ITEMS_PER_PAGE = 10;

export default function OrganizerDashboard() {
  const { user, isLoading } = useRequireRole(['organizer'], '/');
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [approvedProposals, setApprovedProposals] = useState<Proposal[]>([]);
  const [actionProposals, setActionProposals] = useState<Proposal[]>([]);
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0);

  // MyCSD Claim State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedEventForClaim, setSelectedEventForClaim] = useState<Event | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [laporanFile, setLaporanFile] = useState<File | null>(null);

  // Dismiss Modal State
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [proposalToDismiss, setProposalToDismiss] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(''); // Input value
  const [searchQuery, setSearchQuery] = useState(''); // Actual filter value
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Event | null; direction: 'asc' | 'desc' }>({
    key: 'startDate',
    direction: 'desc', // Default to newest first
  });

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.organizationId) {
        try {
          const allEvents = await getEvents();
          if (allEvents) {
            setOrganizerEvents(allEvents.filter(event =>
              event.organizerId === user.organizationId
            ));
          }
          const allProposals = await getAllProposals();
          if (allProposals) {
            const myProposals: Proposal[] = allProposals.filter((p: Proposal) => p.organizerId === user.organizationId);

            // Filter Approved
            setApprovedProposals(myProposals.filter(p => p.status === 'approved'));

            // Filter for Revision Needed or Rejected
            setActionProposals(myProposals.filter(p => p.status === 'revision_needed' || p.status === 'rejected'));

            // Filter Pending
            setPendingProposalsCount(myProposals.filter(p => p.status === 'pending').length);
          }
        } catch (error) {
          console.error('Error fetching events:', error);
          toast.error('Failed to load events');
        }
      }
    };

    if (!isLoading && user) {
      fetchEvents();
    }
  }, [user, isLoading]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleSearch = () => {
    setSearchQuery(searchTerm);
  };

  const handleAcknowledge = (proposalId: string) => {
    setProposalToDismiss(proposalId);
    setShowDismissModal(true);
  };

  const confirmDismiss = async () => {
    if (!proposalToDismiss) return;

    try {
      await updateProposalStatus(proposalToDismiss, 'cancelled');
      // Update local state to remove it immediately
      setActionProposals(prev => prev.filter(p => p.id !== proposalToDismiss));
      toast.success("Proposal dismissed.");
      setShowDismissModal(false);
      setProposalToDismiss(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to dismiss proposal.");
    }
  };

  const filteredAndSortedEvents = useMemo(() => {
    let result = [...organizerEvents];

    // 1. Filter by Search Query (Title)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(event =>
        event.title.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Filter by Status
    if (statusFilter !== 'all') {
      if (statusFilter === 'mycsd_claimed') {
        result = result.filter(event => event.status === 'completed' && event.hasMyCSD && event.mycsdStatus === 'approved');
      } else if (statusFilter === 'mycsd_failed_to_claim') {
        result = result.filter(event => event.status === 'completed' && event.hasMyCSD && event.mycsdStatus === 'rejected');
      } else {
        result = result.filter(event => (event.status as string) === statusFilter);
      }
    } else {
      // Default: Hide Cancelled events unless specifically filtered
      result = result.filter(event => event.status !== 'cancelled');
    }

    // 3. Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Event];
        const bValue = b[sortConfig.key as keyof Event];

        // Handle specific sort keys if needed (e.g., dates are strings, so string comparison works fine for ISO dates)

        if ((aValue as any) < (bValue as any)) return sortConfig.direction === 'asc' ? -1 : 1;
        if ((aValue as any) > (bValue as any)) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [organizerEvents, searchQuery, statusFilter, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredAndSortedEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const totalEvents = organizerEvents.length;
    const totalParticipants = organizerEvents.reduce((sum, event) => sum + event.registeredCount, 0);
    const upcomingEvents = organizerEvents.filter(event =>
      new Date(event.startDate) > new Date() && event.status !== 'cancelled'
    ).length;
    const publishedEvents = organizerEvents.filter(event => event.status === 'published').length;

    return { totalEvents, totalParticipants, upcomingEvents, publishedEvents };
  }, [organizerEvents]);

  const handleSort = (key: 'startDate' | 'status') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleClaimMyCSD = async () => {
    if (!selectedEventForClaim || !laporanFile) return;

    setIsClaiming(true);
    try {
      const laporanUrl = await uploadDocument(laporanFile, 'laporan_kejayaan');

      // Pass level and category to the service
      const level = selectedEventForClaim.mycsdLevel || 'P.Pengajian / Desasiswa / Persatuan / Kelab';
      const category = selectedEventForClaim.mycsdCategory || 'Reka Cipta dan Inovasi';

      await submitMyCSDClaim(selectedEventForClaim.id, laporanUrl, level, category);

      toast.success('MyCSD claim submitted successfully!');
      setShowClaimModal(false);

      // Refresh events
      if (user?.organizationId) {
        const allEvents = await getEvents();
        if (allEvents) {
          setOrganizerEvents(allEvents.filter(event =>
            event.organizerId === user.organizationId
          ));
        }
      }
    } catch (error) {
      console.error('Error submitting MyCSD claim:', error);
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setIsClaiming(false);
      setLaporanFile(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <Globe className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'pending_approval': return <Clock className="w-3 h-3" />;
      case 'draft': return <FileText className="w-3 h-3" />;
      case 'cancelled': return <Ban className="w-3 h-3" />;
      case 'mycsd_claimed': return <Award className="w-3 h-3" />;
      case 'mycsd_failed_to_claim': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending_approval': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border border-red-200';
      case 'mycsd_claimed': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'mycsd_failed_to_claim': return 'bg-red-50 text-red-600 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Organizer Dashboard' }
            ]}
          />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                <span className="text-purple-900">Organizer</span> <span className="text-orange-500">Dashboard</span>
              </h1>
              <p className="mt-2 text-gray-600">Manage your events and proposals</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-3">
              <Link
                href="/organizer/proposals/submit"
                className="inline-flex items-center gap-2 bg-white border-2 border-purple-500 text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Submit Proposal
              </Link>
              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 bg-white border-2 border-purple-500 text-purple-600 px-6 py-3 rounded-full font-medium hover:bg-purple-50 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Event Page
              </Link>
            </div>
          </div>

          {/* Proposals Needing Attention Section */}
          {/* ... (Proposals section remains unchanged until line 285) ... */}
          {actionProposals.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Proposals Needing Attention
              </h2>
              <div className="grid gap-4">
                {actionProposals.map(proposal => (
                  <div key={proposal.id} className="bg-white p-4 rounded-md shadow-sm border-l-4 border-orange-400">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-lg">{proposal.eventTitle}</h3>
                        <p className="text-sm text-gray-500">
                          Status: <span className={proposal.status === 'revision_needed' ? 'font-semibold text-orange-600' : 'font-semibold text-red-600'}>
                            {proposal.status === 'revision_needed' ? 'Revision Needed' : 'Rejected'}
                          </span>
                          {' • '}
                          {format(new Date(proposal.updatedAt), 'MMM dd, yyyy')}
                        </p>
                      </div>

                      {/* THIS IS THE BUTTON THAT LINKS TO THE REVISION PAGE */}
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {proposal.status === 'revision_needed' && (
                          <Link
                            href={`/organizer/proposals/${proposal.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium text-sm border border-orange-200"
                          >
                            <Edit className="w-4 h-4" />
                            Resubmit Proposal
                          </Link>
                        )}

                        {proposal.status === 'rejected' && (
                          <button
                            onClick={() => handleAcknowledge(proposal.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm border border-red-200"
                          >
                            <XCircle className="w-4 h-4" />
                            Acknowledge & Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Display Admin Notes */}
                    {proposal.adminNotes && (
                      <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 border border-gray-200">
                        <span className="font-semibold text-gray-900">Admin Feedback: </span>
                        {proposal.adminNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Proposals Section */}
          {approvedProposals.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Approved Proposals (Ready to Publish)
              </h2>
              <div className="grid gap-4">
                {approvedProposals.map(proposal => (
                  <div key={proposal.id} className="bg-white p-4 rounded-md shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{proposal.eventTitle}</h3>
                      <p className="text-sm text-gray-500">Approved on {format(new Date(proposal.updatedAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-md">
                      <span className="text-xs font-medium text-gray-500 uppercase">Secret Key:</span>
                      <code className="text-sm font-mono font-bold text-purple-600 select-all">{proposal.id}</code>
                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(proposal.id)
                              .then(() => toast.success('Secret Key copied to clipboard'))
                              .catch(() => toast.error('Failed to copy key'));
                          }
                        }}
                        className="text-gray-400 hover:text-purple-600 transition-colors"
                        title="Copy Secret Key"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  <p className="text-sm text-gray-600 mb-1">Pending Requests</p>
                  <p className="text-3xl font-bold text-gray-900">{pendingProposalsCount}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
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
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Event Controls */}
          <div className="bg-white rounded-lg shadow-md mb-6 p-4 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {/* Search - Left Side */}
              <div className="flex w-full md:w-96 gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Search events by title..."
                    className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm text-gray-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filters - Right Side */}
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full md:w-48 pl-3 pr-10 py-2 text-base text-gray-800 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="draft">Draft</option>
                  <option value="mycsd_claimed">MyCSD Claimed</option>
                  <option value="mycsd_failed_to_claim">MyCSD Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Table Container */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              {filteredAndSortedEvents.length > 0 ? (
                <>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('startDate')}
                        >
                          <div className="flex items-center gap-1">
                            Date
                            {sortConfig.key === 'startDate' && (
                              <span className="text-gray-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participants
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {sortConfig.key === 'status' && (
                              <span className="text-gray-400">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedEvents.map(event => {
                        // Calculate display status including MyCSD states
                        const displayStatus = (event.status === 'completed' && event.hasMyCSD)
                          ? (event.mycsdStatus === 'approved' ? 'mycsd_claimed'
                            : event.mycsdStatus === 'rejected' ? 'mycsd_failed_to_claim'
                              : event.status)
                          : event.status;

                        return (
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
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(displayStatus)}`}>
                                {getStatusIcon(displayStatus)}
                                {displayStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                {/* View Action */}
                                <Link
                                  href={`/events/${event.id}`}
                                  className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>

                                {/* Edit Action - Allow edit only if not completed/cancelled */}
                                {event.status !== 'completed' && event.status !== 'cancelled' && (
                                  <Link
                                    href={`/organizer/events/${event.id}/edit`}
                                    className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Link>
                                )}

                                {/* Attendees Action */}
                                <Link
                                  href={`/organizer/events/${event.id}/attendees`}
                                  className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                                  title="Attendees"
                                >
                                  <Users className="w-4 h-4" />
                                </Link>

                                {/* MyCSD Claim Status & Actions (Only if MyCSD is enabled) */}
                                {event.hasMyCSD && event.status === 'completed' && (
                                  <>
                                    {/* Case 1: Not Submitted Yet -> Show Button */}
                                    {(event.mycsdStatus === 'none' || !event.mycsdStatus) && (
                                      <button
                                        onClick={() => {
                                          setSelectedEventForClaim(event);
                                          setShowClaimModal(true);
                                        }}
                                        className="text-orange-600 hover:text-orange-900 p-2 hover:bg-orange-50 rounded transition-colors"
                                        title="Submit Laporan & Claim MyCSD"
                                      >
                                        <Award className="w-5 h-5" />
                                      </button>
                                    )}

                                    {/* Case 2: Pending Approval */}
                                    {(event.mycsdStatus === 'pending') && (
                                      <div className="relative group p-2">
                                        <Clock className="w-5 h-5 text-amber-500 cursor-help" />
                                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-center">
                                          Claim Pending Approval
                                        </div>
                                      </div>
                                    )}

                                    {/* Case 3: Approved */}
                                    {event.mycsdStatus === 'approved' && (
                                      <div className="relative group p-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-500 cursor-help" />
                                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap text-center">
                                          Claim Approved
                                        </div>
                                      </div>
                                    )}

                                    {/* Case 4: Rejected */}
                                    {event.mycsdStatus === 'rejected' && (
                                      <div className="relative group p-2">
                                        <AlertCircle className="w-5 h-5 text-red-500 cursor-pointer" />
                                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white text-gray-800 text-xs rounded-lg shadow-xl border border-red-200 p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                          <p className="font-bold text-red-600 mb-1">Claim Rejected</p>
                                          <p className="text-gray-600 leading-snug">{event.mycsdRejectionReason || 'No reason provided.'}</p>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{filteredAndSortedEvents.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedEvents.length)}</span> of <span className="font-medium">{filteredAndSortedEvents.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                        ${currentPage === i + 1
                                  ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </>) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No events found</p>
                  <p className="text-gray-400 text-sm mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters.'
                      : 'Create your first event to get started'}
                  </p>
                </div>
              )
              }
            </div >
          </div >
        </div >
      </main >

      <Footer />

      {/* MyCSD Claim Modal (remains the same) -- already included in full view from previous reads but logic in component structure maintained */}
      <Modal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        title="Submit Laporan Kejayaan & Claim MyCSD"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Upload the Laporan Kejayaan to distribute MyCSD points to all present participants for <strong>{selectedEventForClaim?.title}</strong>.
          </p>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setLaporanFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">
              {laporanFile ? laporanFile.name : 'Click to upload Laporan (PDF/Doc)'}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-start gap-2">
            <Award className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              This action will automatically award <strong>{selectedEventForClaim?.mycsdPoints} points</strong> to all participants marked as &quot;Present&quot;. This cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowClaimModal(false)}
              className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isClaiming}
            >
              Cancel
            </button>
            <button
              onClick={handleClaimMyCSD}
              disabled={isClaiming || !laporanFile}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Submit & Distribute'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Dismiss Confirmation Modal */}
      <Modal
        isOpen={showDismissModal}
        onClose={() => setShowDismissModal(false)}
        title="Dismiss Message"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Are you sure you want to dismiss this message?</p>
              <p className="text-sm text-red-800 mt-1">
                This will remove the rejected proposal from your dashboard view.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowDismissModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDismiss}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Dismiss Message
            </button>
          </div>
        </div>
      </Modal>
    </div >
  );
}