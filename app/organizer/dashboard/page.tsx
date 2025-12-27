'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRequireRole } from '@/contexts/AuthContext';
import { getEvents, deleteEvent } from '@/backend/services/eventService';
import { getAllProposals, Proposal } from '@/backend/services/proposalService';
import { submitMyCSDClaim } from '@/backend/services/mycsdService';
import { uploadDocument } from '@/backend/services/storageService';
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
  Clock,
  Copy,
  Award,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Modal from '@/components/Modal';

type TabType = 'all' | 'published' | 'pending_approval' | 'draft';

export default function OrganizerDashboard() {
  const { user, isLoading } = useRequireRole(['organizer'], '/');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);
  const [approvedProposals, setApprovedProposals] = useState<Proposal[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  
  // MyCSD Claim State
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedEventForClaim, setSelectedEventForClaim] = useState<Event | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [laporanFile, setLaporanFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.organizationId) {
        try {
          const allEvents = await getEvents();
          if (allEvents) {
            // Filter out cancelled events
            setOrganizerEvents(allEvents.filter(event => 
              event.organizerId === user.organizationId && 
              event.status !== 'cancelled'
            ));
          }
          const allProposals = await getAllProposals();
          if (allProposals) {
             setApprovedProposals(allProposals.filter((p: Proposal) => p.organizerId === user.organizationId && p.status === 'approved'));
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

  const handleClaimMyCSD = async () => {
    if (!selectedEventForClaim) return;
    if (!laporanFile) {
      toast.error('Please upload the Laporan Kejayaan file');
      return;
    }

    setIsClaiming(true);
    try {
      // Upload the file
      const path = `documents/${selectedEventForClaim.id}/${Date.now()}-${laporanFile.name}`;
      const url = await uploadDocument(laporanFile, path);
      
      // Submit the claim
      await submitMyCSDClaim(
        selectedEventForClaim.id,
        url,
        selectedEventForClaim.mycsdLevel || '',
        selectedEventForClaim.mycsdCategory || ''
      );
      
      toast.success('Laporan submitted successfully! Points will be distributed upon admin approval.');
      setShowClaimModal(false);
      setLaporanFile(null);
      
      // Refresh events to update the claimed status (though it won't be claimed yet, just pending)
      // Ideally we should show "Pending Approval" status for the claim
    } catch (error: any) {
      console.error('Error claiming MyCSD:', JSON.stringify(error, null, 2));
      toast.error(error.message || 'Failed to submit MyCSD claim');
    } finally {
      setIsClaiming(false);
    }
  };

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
              <Link
                href="/organizer/events/create"
                className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-6 py-3 rounded-full font-medium hover:bg-purple-200 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                Publish Event
              </Link>
            </div>
          </div>

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
                          } else {
                            // Fallback
                            const textArea = document.createElement("textarea");
                            textArea.value = proposal.id;
                            document.body.appendChild(textArea);
                            textArea.select();
                            try {
                              document.execCommand('copy');
                              toast.success('Secret Key copied to clipboard');
                            } catch (err) {
                              toast.error('Failed to copy key');
                            }
                            document.body.removeChild(textArea);
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
                            
                            {/* MyCSD Claim Button */}
                            {event.hasMyCSD && 
                             event.status === 'completed' && 
                             !event.is_mycsd_claimed && (
                              <button
                                onClick={() => {
                                  setSelectedEventForClaim(event);
                                  setShowClaimModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900 p-2 hover:bg-orange-50 rounded transition-colors"
                                title="Submit Laporan & Claim MyCSD"
                              >
                                <Award className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this event?')) {
                                  try {
                                    await deleteEvent(event.id);
                                    setOrganizerEvents(prev => prev.filter(e => e.id !== event.id));
                                    toast.success('Event deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting event:', error);
                                    toast.error('Failed to delete event');
                                  }
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

      {/* MyCSD Claim Modal */}
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
              This action will automatically award <strong>{selectedEventForClaim?.mycsdPoints} points</strong> to all participants marked as "Present". This cannot be undone.
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
    </div>
  );
}
