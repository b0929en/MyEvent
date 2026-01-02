'use client';

import { useEffect, useState } from 'react';
import { getUserRegistrations } from '@/backend/services/registrationService';
import { getEventById, getUserCommitteeEvents } from '@/backend/services/eventService';
import { getUserMyCSDRecords } from '@/backend/services/mycsdService';
import { Event, Registration, MyCSDRecord, User } from '@/types';
import Link from 'next/link';
import { format } from 'date-fns';
import { Mail, IdCard, Building2 } from 'lucide-react';

interface StudentProfileProps {
  user: User;
}

export default function StudentProfile({ user }: StudentProfileProps) {
  const [registrations, setRegistrations] = useState<(Registration & { event: Event })[]>([]);
  const [mycsdRecords, setMycsdRecords] = useState<MyCSDRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Registrations
        const userRegs = await getUserRegistrations(user.id);
        const regsWithEvents = await Promise.all(userRegs.map(async (reg) => {
          const event = await getEventById(reg.eventId);
          return {
            ...reg,
            event: event,
          };
        }));

        // Filter out registrations where event could not be found
        const validRegs = regsWithEvents.filter(item => item.event !== null) as (Registration & { event: Event })[];

        // Fetch Committee Events
        let committeeRegs: (Registration & { event: Event })[] = [];
        if (user.matricNumber) {
          const committeeEvents = await getUserCommitteeEvents(user.matricNumber);
          committeeRegs = committeeEvents.map(event => ({
            id: `committee-${event.id}`,
            eventId: event.id,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            matricNumber: user.matricNumber,
            status: 'confirmed',
            registeredAt: event.createdAt,
            updatedAt: event.updatedAt,
            event: event,
          })) as (Registration & { event: Event })[];
        }

        // Merge registrations (avoid duplicates, prioritize existing registration if any, or just combine)
        // If a user is both registered and committee, we probably want to show just one entry.
        // Let's rely on event ID uniqueness.
        const allRegs = [...validRegs];
        committeeRegs.forEach(cReg => {
          if (!allRegs.find(r => r.eventId === cReg.eventId)) {
            allRegs.push(cReg);
          }
        });

        setRegistrations(allRegs);

        // Fetch MyCSD Records
        const records = await getUserMyCSDRecords(user.id);
        setMycsdRecords(records);

      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading student data...
      </div>
    );
  }

  // --- Process Data ---

  // Registered Events (Upcoming)
  const upcomingEvents = registrations
    .filter(reg => {
      const eventDate = new Date(reg.event.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today && reg.status !== 'cancelled' && reg.status !== 'attended';
    })
    .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime());

  // Past Events (Participated)
  const pastEvents = registrations
    .filter(reg => {
      const eventDate = new Date(reg.event.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate < today || reg.status === 'cancelled' || reg.status === 'attended';
    })
    .sort((a, b) => new Date(b.event.startDate).getTime() - new Date(a.event.startDate).getTime());


  // Helper for MyCSD Status check
  const getMyCSDStatus = (eventId: string) => {
    const record = mycsdRecords.find(r => r.eventId === eventId);
    if (!record) return { status: 'Not Claimed', color: 'bg-gray-100 text-gray-500' };

    switch (record.status) {
      case 'approved': return { status: 'Approved', color: 'bg-green-100 text-green-800' };
      case 'pending_approval': return { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'waiting_for_report': return { status: 'Waiting Report', color: 'bg-gray-100 text-gray-500' };
      case 'rejected': return { status: 'Rejected', color: 'bg-red-100 text-red-800' };
      default: return { status: record.status, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'attended': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. User Brief Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          User Information
        </h3>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-linear-to-br from-purple-600 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-md">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex md:flex-row items-center gap-4 mb-3 justify-center md:justify-start">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize w-fit">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.matricNumber && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                    <IdCard className="w-4 h-4" />
                    <span className="text-sm">{user.matricNumber}</span>
                  </div>
                )}
                {user.faculty && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm">{user.faculty}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* 2. Registered Events (Table) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Registered Events
        </h3>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        <Link href={`/events/${reg.event.id}`} className="hover:text-purple-600">
                          {reg.event.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {reg.event.organizerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(reg.event.startDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">
                        {/* Determine Position */}
                        {(() => {
                          const record = mycsdRecords.find(r => r.eventId === reg.eventId);
                          if (record?.position) return record.position;

                          // Check committee members
                          const committeeMember = reg.event.committeeMembers?.find(cm => cm.matricNumber === user.matricNumber);
                          if (committeeMember) return committeeMember.position;

                          return 'Peserta';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reg.event.venue}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reg.status)}`}>
                          {reg.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No registered upcoming events found.
                      <Link href="/events" className="ml-2 text-purple-600 hover:underline">
                        Browse events
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Past Events (Table) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Past Events
        </h3>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Participation Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">MyCSD Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastEvents.length > 0 ? (
                  pastEvents.map((reg) => {
                    const mycsdInfo = getMyCSDStatus(reg.eventId);
                    return (
                      <tr key={reg.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          <Link href={`/events/${reg.event.id}`} className="hover:text-purple-600">
                            {reg.event.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {reg.event.organizerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(reg.event.startDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {/* Find MyCSD record to get position, or fallback to committee list */}
                          {(() => {
                            const record = mycsdRecords.find(r => r.eventId === reg.eventId);
                            if (record?.position) return record.position;

                            // Check committee members
                            const committeeMember = reg.event.committeeMembers?.find(cm => cm.matricNumber === user.matricNumber);
                            if (committeeMember) return committeeMember.position;

                            return 'Peserta';
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reg.status)}`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {reg.event.hasMyCSD ? (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${mycsdInfo.color}`}>
                              {mycsdInfo.status}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No history of past events.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
