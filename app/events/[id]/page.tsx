'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';
import Modal from '@/components/Modal';
import { getEventById, getEvents } from '@/backend/services/eventService';
import { createRegistration, getUserRegistrations } from '@/backend/services/registrationService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Event } from '@/types';
import EventCard from '@/components/event/EventCard';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  User,
  Award,
  Share2,
  ExternalLink,
  Edit
} from 'lucide-react';

import { uploadDocument } from '@/backend/services/storageService';
import { Upload, X } from 'lucide-react';
import EventGallery from '@/components/events/EventGallery';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [suggestedEvents, setSuggestedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (params.id) {
        try {
          const fetchedEvent = await getEventById(params.id as string);
          setEvent(fetchedEvent);

          // Fetch suggested events - prioritize same category, fill with latest events if needed
          if (fetchedEvent) {
            let suggestions: Event[] = [];

            // First, try to get events from the same category
            if (fetchedEvent.category) {
              const sameCategoryEvents = await getEvents({
                category: [fetchedEvent.category]
              });

              // Filter out current event and ensure only published events (exclude completed/cancelled)
              suggestions = sameCategoryEvents
                .filter(e => e.id !== fetchedEvent.id && e.status === 'published')
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            }

            // If we don't have 3 events yet, fetch all events and fill the remaining slots
            if (suggestions.length < 3) {
              const allEvents = await getEvents();
              const usedIds = new Set([fetchedEvent.id, ...suggestions.map(e => e.id)]);

              // Get other events (excluding current and already selected ones, and ensuring published status)
              const otherEvents = allEvents
                .filter(e => !usedIds.has(e.id) && e.status === 'published')
                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

              // Add enough events to reach 3 total
              suggestions = [...suggestions, ...otherEvents].slice(0, 3);
            } else {
              // If we have 3 or more, just take the first 3
              suggestions = suggestions.slice(0, 3);
            }

            setSuggestedEvents(suggestions);
          }
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
          const userRegistration = registrations.find(reg => reg.eventId === event.id);
          if (userRegistration) {
            setIsRegistered(true);
            setRegistrationStatus(userRegistration.status);
          }
        } catch (error) {
          console.error('Error checking registration:', error);
        }
      }
    };
    checkRegistration();
  }, [user, event]);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setPaymentProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

    const isCommitteeMember = event.committeeMembers?.some(
      member => String(member.matricNumber).trim() === user?.matricNumber?.trim()
    );
    if (isCommitteeMember) {
      toast.error('Committee members cannot register for their own event');
      return;
    }

    setShowRegistrationModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!user || !event) return;

    if (event.participationFee > 0 && !paymentProofFile) {
      toast.error('Please upload payment proof');
      return;
    }

    setIsRegistering(true);

    try {
      let paymentProofUrl = undefined;
      if (paymentProofFile) {
        try {
          const path = `payment-proofs/${event.id}/${user.id}-${Date.now()}-${paymentProofFile.name}`;
          paymentProofUrl = await uploadDocument(paymentProofFile, path);
        } catch (error) {
          console.error('Error uploading payment proof:', error);
          toast.error('Failed to upload payment proof');
          setIsRegistering(false);
          return;
        }
      }

      await createRegistration({
        eventId: event.id,
        userId: user.id,
        paymentProofUrl: paymentProofUrl,
        paymentAmount: event.participationFee > 0 ? event.participationFee : undefined,
      });

      toast.success(event.participationFee > 0 ? 'Registration submitted! Pending approval.' : 'Successfully registered for ' + event.title);
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
  const isCommitteeMember = event.committeeMembers?.some(
    member => String(member.matricNumber).trim() === user?.matricNumber?.trim()
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="grow pb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Content Column - Title Section */}
            <div className="lg:col-span-2">
              {/* Event Title, Organizer and Badges */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{event.title}</h1>
                <p className="text-lg text-gray-600 mb-4">Organized by: {event.organizerName}</p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full capitalize">
                    {event.category}
                  </span>

                  {event.hasMyCSD && (
                    <span className="px-4 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full">
                      MyCSD Available
                    </span>
                  )}

                  {event.hasMyCSD && event.mycsdLevel && (
                    <span className="px-4 py-1 bg-purple-400 text-white text-sm font-semibold rounded-full capitalize">
                      {event.mycsdLevel.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Event Actions Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => router.push(`/organizer/events/${event.id}/edit`)}
                        className="w-full mb-4 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Event Details
                      </button>
                    )}
                    <div className="flex gap-5">
                      <button
                        onClick={handleRSVP}
                        disabled={isPastDeadline || isFull || isRegistered}
                        className={`grow font-bold py-3.5 px-6 border border-gray-200 rounded-xl cursor-not-allowed transition-all duration-300 ${isRegistered
                          ? 'bg-gray-100 text-gray-400'
                          : isPastDeadline
                            ? 'bg-gray-200 text-gray-500'
                            : isFull
                              ? 'bg-red-50 text-red-500 border border-red-100'
                              : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
                          }`}
                      >
                        {isRegistered ? 'Registered' : isPastDeadline ? 'Registration Closed' : isFull ? 'Fully Booked' : 'RSVP Now'}
                      </button>

                      <button
                        onClick={() => {
                          if (navigator.clipboard && window.isSecureContext) {
                            navigator.clipboard.writeText(window.location.href)
                              .then(() => toast.success('Link copied to clipboard!'))
                              .catch(() => toast.error('Failed to copy link'));
                          } else {
                            // Fallback for older browsers or non-secure contexts
                            const textArea = document.createElement("textarea");
                            textArea.value = window.location.href;
                            textArea.style.position = "fixed";
                            textArea.style.left = "-999999px";
                            textArea.style.top = "-999999px";
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            try {
                              document.execCommand('copy');
                              toast.success('Link copied to clipboard!');
                            } catch (err) {
                              console.error('Copy failed', err);
                              toast.error('Failed to copy link');
                            }
                            textArea.remove();
                          }
                        }}
                        className="p-3.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-purple-600 cursor-pointer transition-colors flex items-center justify-center shrink-0 transition-all duration-300"
                        title="Share this event"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Content Sections */}
          <div className="mt-10 space-y-10">
            {/* General Information Grid */}
            <section className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">General Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">

                {/* Date */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Date</p>
                    <p className="text-gray-600 text-sm">
                      {format(eventDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-50 rounded-xl text-green-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Time</p>
                    <p className="text-gray-600 text-sm">
                      {event.startTime} - {event.endTime}
                    </p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Location</p>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {event.venue || 'University Main Hall'}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Price</p>
                    <p className="text-gray-600 text-sm">
                      {event.participationFee === 0 ? 'Free' : `RM ${event.participationFee.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              <div className="prose prose-purple max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                {event.description}
              </div>

              {event.objectives && event.objectives.length > 0 && (
                <div className="mt-8 bg-purple-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Objectives
                  </h3>
                  <ul className="space-y-3">
                    {event.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-50 mt-2 shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Gallery */}
            <section>
              <EventGallery images={event.gallery || []} title={event.title} />
            </section>

            {/* Links */}
            {event.links && event.links.length > 0 && (
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Out More!</h2>
                <div className="grid gap-3">
                  {event.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                    >
                      <div className="p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-purple-700">
                        {link.title}
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Suggested Events */}
          {suggestedEvents.length > 0 && (
            <div className="mt-20 border-t border-gray-200 pt-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Events you might like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestedEvents.map((suggestedEvent) => (
                  <div key={suggestedEvent.id} className="h-full">
                    <EventCard
                      id={suggestedEvent.id}
                      title={suggestedEvent.title}
                      date={format(new Date(suggestedEvent.startDate), 'MMMM do, yyyy')}
                      venue={suggestedEvent.venue || 'TBA'}
                      price={suggestedEvent.participationFee === 0 ? 'Free' : `RM ${suggestedEvent.participationFee}`}
                      image={suggestedEvent.bannerImage}
                    />
                  </div>
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

          {event.participationFee > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Payment Required</h4>
              <p className="text-sm text-orange-700 mb-4">
                Please make a payment of <span className="font-bold">RM {event.participationFee.toFixed(2)}</span> to the details below and upload your receipt.
              </p>

              {event.bankAccountInfo && (
                <div className="mb-4 text-sm text-gray-700 whitespace-pre-line bg-white p-2 rounded border border-gray-200">
                  <p className="font-medium text-gray-900 mb-1">Bank Details:</p>
                  {event.bankAccountInfo}
                </div>
              )}

              {event.paymentQrCode && (
                <div className="mb-4 flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-900 mb-2">Scan QR to Pay</p>
                  <div className="relative w-48 h-48 bg-white border border-gray-200 p-2 rounded-lg">
                    <Image
                      src={event.paymentQrCode}
                      alt="Payment QR"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Payment Receipt <span className="text-red-500">*</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors cursor-pointer relative overflow-hidden bg-white"
                  onClick={() => document.getElementById('receipt-upload')?.click()}
                >
                  {paymentProofPreview ? (
                    <div className="relative h-32 w-full">
                      <Image
                        src={paymentProofPreview}
                        alt="Receipt preview"
                        fill
                        className="object-contain"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPaymentProofFile(null);
                          setPaymentProofPreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Upload Receipt</p>
                    </>
                  )}
                  <input
                    id="receipt-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProofChange}
                  />
                </div>
              </div>
            </div>
          )}

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
                  {event.participationFee > 0 ? 'Submitting...' : 'Registering...'}
                </>
              ) : (
                event.participationFee > 0 ? 'Submit Payment & Register' : 'Confirm Registration'
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
