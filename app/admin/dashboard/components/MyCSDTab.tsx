'use client';

import { useState, useMemo, useEffect } from 'react';
import { getAllMyCSDRequests, approveMyCSDRequest, rejectMyCSDRequest } from '@/backend/services/mycsdService';
import { TrendingUp, CheckCircle, XCircle, AlertCircle, Eye, Users, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '@/components/Modal';
import { toast } from 'sonner';
import type { MyCSDStatus } from '@/types';

// Copied interface due to it being local in the original file, ideally should be in types.ts
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

export default function MyCSDTab() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('pending');
  const [submissions, setSubmissions] = useState<MyCSDRequest[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<MyCSDRequest | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [committeeRoles, setCommitteeRoles] = useState<Record<string, string>>({});
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Typographical state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      // 1. Status Filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // 2. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          s.eventName.toLowerCase().includes(query) ||
          s.organizerName.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [statusFilter, searchQuery, submissions]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

  // ... (stats useMemo omitted, it's unchanged) ... 
  // Wait, I need to include it or carefully splice. 
  // Since I can't easily skip lines in replace_file_content without context matching risk, 
  // I will just include the stats block to be safe or try to target specific blocks.
  // Actually, let's just replace the blocks relating to search logic first.

  // No, the instruction wants layout changes too. 
  // Layout changes are further down in JSX. 
  // I will do this in chunks. First chunk: Logic.

  // WAIT, I'm inside "ReplacementContent". 
  // I should provide the content for the first chunk (Logic).

  // It seems safer to do multiple chunks or separate tool calls if regions are far apart.
  // logic is lines 44-93.
  // layout is lines 196-387.

  // Multi-replace is better.


  const stats = useMemo(() => {
    return {
      pending: submissions.filter(s => s.status === 'pending').length,
      approved: submissions.filter(s => s.status === 'approved').length,
      rejected: submissions.filter(s => s.status === 'rejected').length,
      totalPoints: submissions
        .filter(s => s.status === 'approved')
        .reduce((sum, s) => sum + (s.points * s.participantCount), 0)
    };
  }, [submissions]);

  const handleReview = (submission: MyCSDRequest, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setAdminNotes('');

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
        await approveMyCSDRequest(selectedSubmission.id, committeeRoles);
      } else {
        await rejectMyCSDRequest(selectedSubmission.id, adminNotes);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">MyCSD Points Approval</h2>
        <p className="text-gray-600">Review and approve MyCSD points for events</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Approved</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Points</p>
          <p className="text-3xl font-bold text-purple-600">{stats.totalPoints}</p>
        </div>
      </div>

      {/* Filters & Search - Swapped Positions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Search Bar (Now First) */}
          <div className="relative w-full md:w-64">
            <button onClick={handleSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Search... (Press Enter)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs (Now Second) */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${statusFilter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Submissions List & Pagination Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoadingData ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading submissions...</p>
          </div>
        ) : (
          <>
            {/* Table Container - Removed Card Styling */}
            {filteredSubmissions.length > 0 ? (
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
                    {paginatedSubmissions.map((submission) => (
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

            {/* Pagination Controls - Within the same card */}
            {filteredSubmissions.length > 0 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredSubmissions.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                            ? 'z-10 bg-purple-50 border-purple-500 text-purple-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review Modal - Exact same logic as original file */}
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
              {/* ... other modal details ... */}
              <div className="flex justify-between pt-2">
                <span className="text-sm font-semibold text-gray-700">Points per Student:</span>
                <span className="text-lg font-bold text-purple-600">{selectedSubmission.points}</span>
              </div>
            </div>

            {/* Committee Roles Section */}
            {selectedSubmission.committeeMembers && selectedSubmission.committeeMembers.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Committee Roles & Points</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedSubmission.committeeMembers.map((member: any) => (
                    <div key={member.matricNumber} className="flex items-center gap-2 text-sm border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.matricNumber}</p>
                      </div>
                      <div className="w-1/2">
                        <select
                          value={committeeRoles[member.matricNumber] || 'ajk_kecil'}
                          onChange={(e) => setCommitteeRoles(prev => ({
                            ...prev,
                            [member.matricNumber]: e.target.value
                          }))}
                          disabled={reviewAction === 'reject'}
                          className="w-full text-xs border-gray-300 rounded focus:ring-purple-500 focus:border-purple-500 text-gray-900"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
