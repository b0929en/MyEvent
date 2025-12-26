'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import Modal from '@/components/Modal';
import { getEventById } from '@/backend/services/eventService';
import { createRegistration, getUserRegistrations } from '@/backend/services/registrationService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Users, DollarSign, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Event } from '@/types';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (params.id) {
        try {
          const fetchedEvent = await getEventById(params.id as string);
          setEvent(fetchedEvent);
        } catch (error) {
          console.error('Error fetching event:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEvent();
  }, [params.id]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (user && event) {
        try {
          const registrations = await getUserRegistrations(user.id);
          const isReg = registrations.some(reg => reg.eventId === event.id);
          setIsRegistered(isReg);
        } catch (error) {
          console.error('Error checking registration:', error);
        }
      }
    };
    checkRegistration();
  }, [user, event]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-4">The event you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => router.push('/events')}
              className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-colors"
            >
              Browse Events
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleRSVP = () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for events');
      router.push('/login');
      return;
    }

    if (user?.role !== 'student') {
      toast.error('Only students can register for events');
      return;
    }

    setShowRegistrationModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!user || !event) return;

    setIsRegistering(true);
    
    try {
      await createRegistration({
        eventId: event.id,
        userId: user.id,
      });
      
      toast.success('Successfully registered for ' + event.title);
      setShowRegistrationModal(false);
      router.push('/profile');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Failed to register for event. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const eventDate = new Date(event.startDate);
  const registrationDeadline = new Date(event.registrationDeadline);
  const isPastDeadline = registrationDeadline < new Date();
  const isFull = event.registeredCount >= event.capacity;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Events', href: '/events' },
              { label: event.title }
            ]}
          />

          {/* Event Banner */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="relative w-full h-80 bg-linear-to-r from-purple-500 via-purple-600 to-orange-500">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h2 className="text-5xl font-bold mb-2">{event.title}</h2>
                  <p className="text-xl">{event.organizerName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Title and Tags */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              {event.hasMyCSD && (
                <span className="px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                  MyCSD: {event.mycsdPoints} Points
                </span>
              )}
              {event.mycsdLevel === 'antarabangsa' && (
                <span className="px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                  International
                </span>
              )}
              {event.mycsdLevel === 'negeri_universiti' && (
                <span className="px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                  University Level
                </span>
              )}
              <span className="px-4 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full capitalize">
                {event.category}
              </span>
              {event.status === 'published' && (
                <span className="px-4 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                  Registration Open
                </span>
              )}
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Organizer</p>
                  <p className="text-gray-900 font-medium">{event.organizerName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="text-gray-900 font-medium">
                    {format(eventDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time</p>
                  <p className="text-gray-900 font-medium">
                    {event.startTime} - {event.endTime}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Venue</p>
                  <p className="text-gray-900 font-medium">{event.venue}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Participation Fee</p>
                  <p className="text-gray-900 font-medium">
                    {event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="text-gray-900 font-medium">
                    {event.registeredCount} / {event.capacity} registered
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(event.registeredCount / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {event.hasMyCSD && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">MyCSD Category</p>
                    <p className="text-gray-900 font-medium capitalize">
                      {event.mycsdCategory} - {event.mycsdLevel?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RSVP Button */}
            <div className="mt-6 flex items-center gap-4">
              <button 
                onClick={handleRSVP}
                disabled={isPastDeadline || isFull || isRegistered}
                className={`font-semibold py-3 px-8 rounded-full transition-colors disabled:cursor-not-allowed ${
                  isRegistered 
                    ? 'bg-gray-400 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-400'
                }`}
              >
                {isRegistered ? 'Registered' : isPastDeadline ? 'Registration Closed' : isFull ? 'Event Full' : 'RSVP Now'}
              </button>
              {!isPastDeadline && !isRegistered && (
                <p className="text-sm text-gray-600">
                  Registration deadline: {format(registrationDeadline, 'MMM dd, yyyy')}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            
            {event.objectives && event.objectives.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Objectives</h3>
                <ul className="list-disc list-inside space-y-2">
                  {event.objectives.map((objective, index) => (
                    <li key={index} className="text-gray-700">{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {event.agenda && event.agenda.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Agenda</h3>
                <ul className="list-disc list-inside space-y-2">
                  {event.agenda.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Links */}
          {event.links && event.links.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Links</h2>
              <div className="space-y-2">
                {event.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Registration Modal */}
      <Modal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        title="Confirm Registration"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            You are about to register for <strong>{event.title}</strong>
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium text-gray-500">{event.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-500">{format(eventDate, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee:</span>
              <span className="font-medium text-gray-500">
                {event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`}
              </span>
            </div>
            {event.hasMyCSD && (
              <div className="flex justify-between">
                <span className="text-gray-600">MyCSD Points:</span>
                <span className="font-medium text-purple-600">{event.mycsdPoints} points</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600">
            * You will receive a confirmation email after registration
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowRegistrationModal(false)}
              className="flex-1 px-4 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors "
              disabled={isRegistering}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRegistration}
              disabled={isRegistering}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRegistering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                'Confirm Registration'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
