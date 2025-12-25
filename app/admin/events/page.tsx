'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { mockEvents } from '@/lib/mockData';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import type { EventStatus } from '@/types';

type FilterStatus = 'pending_approval' | 'approved' | 'rejected' | 'all';

export default function AdminEventsPage() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending_approval');
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  const filteredEvents = useMemo(() => {
    const events = mockEvents.filter(e => 
      ['pending_approval', 'approved', 'rejected'].includes(e.status)
    );
    
    if (statusFilter === 'all') return events;
    return events.filter(e => e.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: mockEvents.filter(e => e.status === 'pending_approval').length,
      approved: mockEvents.filter(e => e.status === 'approved').length,
      rejected: mockEvents.filter(e => e.status === 'rejected').length,
    };
  }, []);

  const handleReview = (event: typeof mockEvents[0], action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setReviewAction(action);
    setAdminNotes('');
    setShowReviewModal(true);
  };

  const submitReview = () => {
    // Backend will implement actual review submission
    toast.success(`Event ${reviewAction}d successfully!`);
    setShowReviewModal(false);
    setSelectedEvent(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

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
              { label: 'Admin Dashboard', href: '/admin/dashboard' },
              { label: 'Events' }
            ]}
          />

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/admin/dashboard"
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">Event Approval</h1>
              <p className="text-gray-600">Review and approve events for publication</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              {(['pending_approval', 'approved', 'rejected', 'all'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-gray-600 mb-3">{event.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-2 font-medium text-gray-900">{event.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {format(new Date(event.startDate), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Venue:</span>
                          <span className="ml-2 font-medium text-gray-900">{event.venue}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Capacity:</span>
                          <span className="ml-2 font-medium text-gray-900">{event.capacity} people</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Registration Deadline:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {format(new Date(event.registrationDeadline), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {event.hasMyCSD && (
                          <div>
                            <span className="text-gray-500">MyCSD:</span>
                            <span className="ml-2 font-medium text-green-600">
                              {event.mycsdPoints} points
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MyCSD Details */}
                  {event.hasMyCSD && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-semibold text-green-900 mb-1">MyCSD Details:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm text-green-800">
                        <div>
                          <span className="text-green-600">Category:</span> {event.mycsdCategory}
                        </div>
                        <div>
                          <span className="text-green-600">Level:</span> {event.mycsdLevel}
                        </div>
                        <div>
                          <span className="text-green-600">Points:</span> {event.mycsdPoints}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    
                    {event.status === 'pending_approval' && (
                      <>
                        <button
                          onClick={() => handleReview(event, 'approve')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve & Publish
                        </button>
                        <button
                          onClick={() => handleReview(event, 'reject')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Created on {format(new Date(event.createdAt), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No events found</p>
                <p className="text-gray-400 text-sm">
                  {statusFilter !== 'all' ? 'Try changing the filter' : 'No events are awaiting approval'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`${reviewAction === 'approve' ? 'Approve & Publish' : 'Reject'} Event`}
        size="md"
      >
        {selectedEvent && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedEvent.title}</p>
              <p className="text-sm text-gray-600">
                {format(new Date(selectedEvent.startDate), 'MMM dd, yyyy')} at {selectedEvent.venue}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional: Add any notes for the organizer...'
                    : 'Please provide reasons for rejection...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  ✓ This event will be published and visible to all students
                </p>
                <p className="text-sm text-blue-900">
                  ✓ Students can register immediately
                </p>
                {selectedEvent.hasMyCSD && (
                  <p className="text-sm text-blue-900">
                    ✓ MyCSD points will be awarded to participants
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={reviewAction === 'reject' && !adminNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Footer />
    </div>
  );
}
