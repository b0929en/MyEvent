'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { getEvents, updateEventStatus } from '@/backend/services/eventService';
import { Event, EventStatus } from '@/types';
import { format } from 'date-fns';
import { Calendar, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';

type FilterStatus = 'pending_approval' | 'approved' | 'rejected' | 'all';

export default function EventsTab() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending_approval');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await getEvents();
        if (allEvents) {
          setEvents(allEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const relevantEvents = events.filter(e =>
      ['pending_approval', 'approved', 'rejected', 'published'].includes(e.status)
    );

    if (statusFilter === 'all') return relevantEvents;
    // Map 'approved' filter to show both 'approved' and 'published' as they are essentially the same for admin view usually
    if (statusFilter === 'approved') return relevantEvents.filter(e => e.status === 'approved' || e.status === 'published');

    return relevantEvents.filter(e => e.status === statusFilter);
  }, [statusFilter, events]);

  const stats = useMemo(() => {
    return {
      pending: events.filter(e => e.status === 'pending_approval').length,
      approved: events.filter(e => e.status === 'approved' || e.status === 'published').length,
      rejected: events.filter(e => e.status === 'rejected').length,
    };
  }, [events]);

  const handleReview = (event: Event, action: 'approve' | 'reject') => {
    setSelectedEvent(event);
    setReviewAction(action);
    setAdminNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedEvent) return;

    try {
      const newStatus = reviewAction === 'approve' ? 'published' : 'rejected';
      await updateEventStatus(selectedEvent.id, newStatus);

      toast.success(`Event ${reviewAction}d successfully!`);

      // Refresh events
      const updatedEvents = await getEvents();
      setEvents(updatedEvents);

      setShowReviewModal(false);
      setSelectedEvent(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status');
    }
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
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Published
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Event Approval</h2>
        <p className="text-gray-600">Review and approve events for publication</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Approval</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Published</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex gap-2">
          {(['pending_approval', 'approved', 'rejected', 'all'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {status === 'all' ? 'All' : status === 'approved' ? 'Published' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                    {/* ... other details ... */}
                    <div>
                      <span className="text-gray-500">Venue:</span>
                      <span className="ml-2 font-medium text-gray-900">{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/events/${event.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View Event Page
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
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No events found</p>
            <p className="text-gray-400 text-sm">
              {statusFilter !== 'all' ? 'Try changing the filter' : 'No events are awaiting approval'}
            </p>
          </div>
        )}
      </div>

      {/* Review Modal - Similar to other tabs */}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={reviewAction === 'reject' && !adminNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${reviewAction === 'approve'
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
    </div>
  );
}
