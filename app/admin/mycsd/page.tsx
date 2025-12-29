'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import { useRequireRole } from '@/contexts/AuthContext';
import { getAllMyCSDRequests, updateMyCSDRequestStatus, approveMyCSDRequest } from '@/backend/services/mycsdService';
import { ArrowLeft, TrendingUp, CheckCircle, XCircle, AlertCircle, Eye, Users } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import type { MyCSDStatus } from '@/types';

interface MyCSDRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  organizerName: string;
  category: string;
  level: string;
  points: number;
  role: string;
  status: MyCSDStatus;
  proofDocument: string;
  participantCount: number;
  committeeCount: number;
  committeeMembers?: any[];
  submittedAt: string;
  updatedAt: string;
}

type FilterStatus = MyCSDStatus | 'all';

export default function AdminMyCSDPage() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [submissions, setSubmissions] = useState<MyCSDRequest[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<MyCSDRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [committeeRoles, setCommitteeRoles] = useState<Record<string, string>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await getAllMyCSDRequests();
      setSubmissions(data as unknown as MyCSDRequest[]);
    } catch (error) {
      console.error('Error fetching MyCSD requests:', error);
      toast.error('Failed to load MyCSD requests');
    } finally {
      setIsLoadingData(false);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'all') return submissions;
    return submissions.filter(s => s.status === statusFilter);
  }, [statusFilter, submissions]);

  const stats = useMemo(() => {
    return {
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      totalPoints: submissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.points * s.participantCount), 0) // Approximation of total points distributed
    };
  }, [submissions]);

  const handleReview = (submission: MyCSDRequest, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setAdminNotes('');

    // Initialize committee roles from submission data if available
    const initialRoles: Record<string, string> = {};
    if (submission.committeeMembers) {
      submission.committeeMembers.forEach((member: any) => {
        initialRoles[member.matricNumber] = member.position || 'ajk_kecil';
      });
    }
    setCommitteeRoles(initialRoles);

    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedSubmission) return;

    try {
      if (reviewAction === 'approve') {
        // approving triggers point calculation and log creation
        await approveMyCSDRequest(selectedSubmission.id, committeeRoles);
      } else {
        // rejecting only updates the status
        await updateMyCSDRequestStatus(selectedSubmission.id, 'rejected');
      }

      toast.success(`Request ${reviewAction}d successfully!`);

      fetchSubmissions();

      setShowReviewModal(false);
      setSelectedSubmission(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    }
  };

  const getStatusBadge = (status: MyCSDStatus) => {
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
              { label: 'MyCSD Points' }
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
              <h1 className="text-3xl font-bold text-gray-900">MyCSD Points Approval</h1>
              <p className="text-gray-600">Review and approve MyCSD points for events</p>
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
              <p className="text-sm text-gray-600 mb-1">Total Points Distributed</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalPoints}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex gap-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${statusFilter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {isLoadingData ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category & Level
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Committee
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
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
                    {filteredSubmissions.map((submission) => (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{submission.eventName}</div>
                          <div className="text-xs text-gray-500">
                            Org: {submission.organizerName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 capitalize">{submission.category}</div>
                          <div className="text-xs text-gray-500">{submission.level}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {submission.participantCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {submission.committeeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-purple-600">{submission.points}</span>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(submission.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <a
                              href={submission.proofDocument}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Proof
                            </a>
                            {submission.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleReview(submission, 'approve')}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReview(submission, 'reject')}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No submissions found</p>
                <p className="text-gray-400 text-sm">
                  {statusFilter !== 'all' ? 'Try changing the filter' : 'No MyCSD points have been submitted yet'}
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
        title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} MyCSD Points`}
        size="md"
      >
        {selectedSubmission && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Event:</span>
                <span className="text-sm font-medium text-gray-900">{selectedSubmission.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Organizer:</span>
                <span className="text-sm font-medium text-gray-900">{selectedSubmission.organizerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{selectedSubmission.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Level:</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{selectedSubmission.level}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-2 my-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Participants</p>
                  <p className="text-lg font-bold text-gray-900">{selectedSubmission.participantCount}</p>
                </div>
                <div className="text-center border-l">
                  <p className="text-xs text-gray-500">Committee</p>
                  <p className="text-lg font-bold text-gray-900">{selectedSubmission.committeeCount}</p>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <span className="text-sm font-semibold text-gray-700">Points per Student:</span>
                <span className="text-lg font-bold text-purple-600">{selectedSubmission.points}</span>
              </div>
            </div>

            {selectedSubmission.committeeMembers && selectedSubmission.committeeMembers.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Committee Roles & Points</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedSubmission.committeeMembers.map((member: any) => (
                    <div key={member.matricNumber} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.matricNumber}</p>
                        <p className="text-xs text-purple-600 mt-0.5">
                          <span className="font-semibold text-gray-600">Org Position:</span> {member.position || 'Not Specified'}
                        </p>
                      </div>
                      <div className="w-1/2">
                        <label className="block text-xs text-gray-500 mb-1">MyCSD Role (Points)</label>
                        <select
                          value={committeeRoles[member.matricNumber] || 'ajk_kecil'}
                          onChange={(e) => setCommitteeRoles(prev => ({
                            ...prev,
                            [member.matricNumber]: e.target.value
                          }))}
                          disabled={reviewAction === 'reject'}
                          className="w-full text-xs border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="pengarah">Pengarah / Director</option>
                          <option value="ajk_tertinggi">AJK Tertinggi / High Committee</option>
                          <option value="ajk_kecil">AJK Kecil / Committee</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    ? 'Optional: Add any notes...'
                    : 'Please provide reasons for rejection...'
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {reviewAction === 'approve' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-900">
                    You are about to award <strong>{selectedSubmission.points} points</strong> to <strong>{selectedSubmission.participantCount} participants</strong>.
                    <br />
                    <span className="text-xs text-green-700 mt-1 block">Total points distributed: {selectedSubmission.points * selectedSubmission.participantCount}</span>
                  </p>
                </div>
              </div>
            )}

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

      <Footer />
    </div>
  );
}