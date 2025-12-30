'use client';

import { useState, useEffect } from 'react';
import { User, Organization, Event } from '@/types';
import { getOrganizationById, updateOrganization } from '@/backend/services/organizationService';
import { getEvents } from '@/backend/services/eventService';
import { Mail, Briefcase, Pencil, Check, Calendar, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizerProfileProps {
  user: User;
}

export default function OrganizerProfile({ user }: OrganizerProfileProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    logo: '',
    organizationChart: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {

    const fetchData = async () => {
      if (user.organizationId) {
        try {
          const [org, orgEvents] = await Promise.all([
            getOrganizationById(user.organizationId),
            getEvents({ organizerId: user.organizationId })
          ]);

          if (org) {
            setOrganization(org);
            setFormData({
              name: org.name,
              description: org.description || 'None',
              email: org.email,
              logo: org.logo || '',
              organizationChart: org.organizationChart || ''
            });
          }
          if (orgEvents) {
            const now = new Date();
            const pastEvents = orgEvents.filter(e => new Date(e.endDate) < now);
            pastEvents.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            setEvents(pastEvents);
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleEdit = async () => {
    if (isEditing) {
      // Save changes
      if (!organization) return;

      setSaving(true);
      try {
        await updateOrganization(organization.id, {
          name: formData.name,
          description: formData.description,
          email: formData.email,
          logo: formData.logo || undefined
        });
        toast.success('Organization profile updated successfully');
        setOrganization(prev => prev ? { ...prev, ...formData } : null);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving organization:', error);
        toast.error('Failed to save changes');
      } finally {
        setSaving(false);
      }
    } else {
      // Enable edit mode
      setIsEditing(true);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Loading profile...</div>;
  }



  if (!organization) {
    return (
      <div className="py-12 text-center">
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg inline-block">
          No organization linked to this account. Please contact admin.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Personal Info (ReadOnly) */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          Organization Information
        </h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Organization Description Editor */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-gray-900">
            Description
          </h3>
          <button
            onClick={toggleEdit}
            disabled={saving}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isEditing
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            title={isEditing ? 'Save Changes' : 'Edit Description'}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isEditing ? (
              <Check className="w-4 h-4" />
            ) : (
              <Pencil className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="col-span-1 md:col-span-2">
          {isEditing ? (
            <>
              <textarea
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">This description is publicly visible.</p>
            </>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg border border-transparent">
              <p className="whitespace-pre-wrap">{formData.description || 'None'}</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Organization Chart */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">
          Organization Chart
        </h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex justify-center">
          {/* Using a placeholder image if no chart is available for now */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={formData.organizationChart || "https://placehold.co/800x400?text=Organization+Chart"}
            alt="Organization Chart"
            className="max-w-full h-auto rounded-lg border border-gray-100"
          />
        </div>
      </div>

      {/* 4. Past Events */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">
          Past Events
        </h3>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Event Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {event.venue}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${event.status === 'published' ? 'bg-green-100 text-green-800' :
                            event.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                          {event.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No events found.
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
