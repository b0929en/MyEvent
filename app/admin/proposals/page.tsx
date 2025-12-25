'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ArrowLeft, FileText, Download, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import type { ProposalStatus } from '@/types';

// Mock proposal data (backend will provide this)
const mockProposals = [
  {
    id: 'prop1',
    organizerId: 'org1',
    organizerName: 'Computer Science Society',
    eventTitle: 'Tech Talk Series 2026',
    eventDescription: 'A series of technical talks featuring industry experts and researchers.',
    category: 'talk' as const,
    estimatedParticipants: 150,
    proposedDate: '2026-03-15',
    proposedVenue: 'Lecture Hall A',
    documents: {
      eventProposal: '/proposals/tech-talk-proposal.pdf',
      budgetPlan: '/proposals/tech-talk-budget.pdf',
      riskAssessment: '/proposals/tech-talk-risk.pdf',
      supportingDocuments: '/proposals/tech-talk-support.pdf'
    },
    status: 'pending' as ProposalStatus,
    submittedAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-15T10:00:00Z'
  },
  {
    id: 'prop2',
    organizerId: 'org2',
    organizerName: 'Engineering Society',
    eventTitle: 'Hackathon 2026',
    eventDescription: '24-hour coding competition for students to showcase their skills.',
    category: 'competition' as const,
    estimatedParticipants: 200,
    proposedDate: '2026-04-20',
    proposedVenue: 'Engineering Complex',
    documents: {
      eventProposal: '/proposals/hackathon-proposal.pdf',
      budgetPlan: '/proposals/hackathon-budget.pdf',
      riskAssessment: '/proposals/hackathon-risk.pdf',
      supportingDocuments: '/proposals/hackathon-support.pdf'
    },
    status: 'approved' as ProposalStatus,
    submittedAt: '2026-01-10T14:30:00Z',
    updatedAt: '2026-01-12T09:00:00Z',
    reviewedBy: 'admin1',
    reviewedAt: '2026-01-12T09:00:00Z',
    adminNotes: 'Excellent proposal with detailed planning. Approved.'
  },
  {
    id: 'prop3',
    organizerId: 'org3',
    organizerName: 'Sports Club',
    eventTitle: 'Late Night Sports Festival',
    eventDescription: 'An overnight sports event.',
    category: 'sport' as const,
    estimatedParticipants: 100,
    proposedDate: '2026-05-01',
    proposedVenue: 'Sports Complex',
    documents: {
      eventProposal: '/proposals/sports-proposal.pdf',
      budgetPlan: '/proposals/sports-budget.pdf',
      riskAssessment: '/proposals/sports-risk.pdf',
      supportingDocuments: '/proposals/sports-support.pdf'
    },
    status: 'rejected' as ProposalStatus,
    submittedAt: '2026-01-08T16:00:00Z',
    updatedAt: '2026-01-09T11:00:00Z',
    reviewedBy: 'admin1',
    reviewedAt: '2026-01-09T11:00:00Z',
    adminNotes: 'Safety concerns for overnight event. Please revise and resubmit with additional safety measures.'
  }
];

type FilterStatus = ProposalStatus | 'all';

export default function ProposalsPage() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [selectedProposal, setSelectedProposal] = useState<typeof mockProposals[0] | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  const filteredProposals = useMemo(() => {
    if (statusFilter === 'all') return mockProposals;
    return mockProposals.filter(p => p.status === statusFilter);
  }, [statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: mockProposals.filter(p => p.status === 'pending').length,
      approved: mockProposals.filter(p => p.status === 'approved').length,
      rejected: mockProposals.filter(p => p.status === 'rejected').length,
      revision: mockProposals.filter(p => p.status === 'revision_needed').length,
    };
  }, []);

  const handleReview = (proposal: typeof mockProposals[0], action: 'approve' | 'reject' | 'revision') => {
    setSelectedProposal(proposal);
    setReviewAction(action);
    setAdminNotes('');
    setShowReviewModal(true);
  };

  const submitReview = () => {
    // Backend will implement actual review submission
    toast.success(`Proposal ${reviewAction}d successfully!`);
    setShowReviewModal(false);
    setSelectedProposal(null);
    setAdminNotes('');
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3" />
            Pending
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
      case 'revision_needed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3 h-3" />
            Revision Needed
          </span>
        );
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
              { label: 'Proposals' }
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
              <h1 className="text-3xl font-bold text-gray-900">Proposal Review</h1>
              <p className="text-gray-600">Review and approve event proposals</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Pending Review</p>
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
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-sm text-gray-600 mb-1">Revision Needed</p>
              <p className="text-3xl font-bold text-orange-600">{stats.revision}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected', 'revision_needed'] as const).map((status) => (
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

          {/* Proposals List */}
          <div className="space-y-4">
            {filteredProposals.length > 0 ? (
              filteredProposals.map((proposal) => (
                <div key={proposal.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{proposal.eventTitle}</h3>
                        {getStatusBadge(proposal.status)}
                      </div>
                      <p className="text-gray-600 mb-2">{proposal.eventDescription}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>
                          <strong>Organizer:</strong> {proposal.organizerName}
                        </span>
                        <span>
                          <strong>Category:</strong> {proposal.category}
                        </span>
                        <span>
                          <strong>Participants:</strong> {proposal.estimatedParticipants}
                        </span>
                        <span>
                          <strong>Proposed Date:</strong> {format(new Date(proposal.proposedDate), 'MMM dd, yyyy')}
                        </span>
                        <span>
                          <strong>Venue:</strong> {proposal.proposedVenue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Documents:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(proposal.documents).map(([key, path]) => (
                        <a
                          key={key}
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
                        >
                          <FileText className="w-4 h-4 text-black" />
                          <span className="truncate text-black">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <Download className="w-3 h-3 ml-auto text-black" />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Admin Notes (if any) */}
                  {proposal.adminNotes && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Admin Notes:</p>
                      <p className="text-sm text-blue-800">{proposal.adminNotes}</p>
                      {proposal.reviewedAt && (
                        <p className="text-xs text-blue-600 mt-1">
                          Reviewed on {format(new Date(proposal.reviewedAt), 'MMM dd, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(proposal, 'approve')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(proposal, 'revision')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4" />
                        Request Revision
                      </button>
                      <button
                        onClick={() => handleReview(proposal, 'reject')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Submitted on {format(new Date(proposal.submittedAt), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No proposals found</p>
                <p className="text-gray-400 text-sm">
                  {statusFilter !== 'all' ? 'Try changing the filter' : 'No proposals have been submitted yet'}
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
        title={`${reviewAction === 'approve' ? 'Approve' : reviewAction === 'reject' ? 'Reject' : 'Request Revision for'} Proposal`}
        size="md"
      >
        {selectedProposal && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{selectedProposal.eventTitle}</p>
              <p className="text-sm text-gray-600">by {selectedProposal.organizerName}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes {reviewAction !== 'approve' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional: Add any notes or conditions...'
                    : reviewAction === 'reject'
                    ? 'Please provide reasons for rejection...'
                    : 'Please specify what needs to be revised...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitReview}
                disabled={reviewAction !== 'approve' && !adminNotes.trim()}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : reviewAction === 'reject'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm {reviewAction === 'approve' ? 'Approval' : reviewAction === 'reject' ? 'Rejection' : 'Revision Request'}
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
