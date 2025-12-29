'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import Modal from '@/components/Modal';
import { getEventById } from '@/backend/services/eventService';
import { createRegistration, getUserRegistrations } from '@/backend/services/registrationService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Events', href: '/events' },
                { label: event.title }
              ]}
            />
          </div>

          {/* Event Banner */}
          <div className="w-full h-75 md:h-100 relative mb-8 rounded-lg overflow-hidden bg-gray-100">
            {event.bannerImage ? (
              <Image
                src={event.bannerImage}
                alt={event.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-r from-purple-500 via-purple-600 to-orange-500">
                <div className="text-center text-white p-4">
                  <h2 className="text-4xl font-bold mb-2">{event.title}</h2>
                  <p className="text-xl">{event.organizerName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Event Title and Badges */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-3">
              {event.hasMyCSD ? (
                <span className="px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                  MyCSD Available
                </span>
              ) : (
                <span className="px-4 py-1 bg-gray-500 text-white text-sm font-medium rounded-full">
                  MyCSD Not Available
                </span>
              )}
              
              {event.hasMyCSD && event.mycsdLevel && (
                <span className="px-4 py-1 bg-purple-400 text-white text-sm font-medium rounded-full capitalize">
                  {event.mycsdLevel.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          {/* General Information */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-gray-700">
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-900">Organizer:</span> {event.organizerName}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Participation Fee:</span> {event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`}
                </p>
              </div>
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-900">Date:</span> {format(eventDate, 'do MMMM yyyy (EEEE)')}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Time:</span> {event.startTime} - {event.endTime} (GMT+8)
                </p>
              </div>
            </div>

            {/* RSVP Button */}
            <div className="mt-8">
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
            </div>
          </div>

          {/* Description */}
          <div className="mb-10">
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
          </div>

          {/* Gallery */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Placeholder gallery items as per design */}
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
            </div>
          </div>

          {/* Links */}
          {event.links && event.links.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Links</h2>
              <ul className="list-disc list-inside space-y-2">
                {event.links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 hover:text-purple-600 hover:underline"
                    >
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
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
