'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRequireRole } from '@/contexts/AuthContext';
import { checkInUser } from '@/backend/services/registrationService';
import { toast } from 'sonner';
import { QrCode, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckInPage() {
  const { user, isLoading } = useRequireRole(['student'], '/login');
  const [eventId, setEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAutoCheckedIn, setHasAutoCheckedIn] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlEventId = searchParams.get('eventId');
    if (urlEventId) {
      setEventId(urlEventId);
    }
  }, [searchParams]);

  const performCheckIn = async (id: string) => {
    if (!id.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await checkInUser(id, user.id);
      toast.success('Successfully checked in!');
      setCheckInSuccess(true);
      setEventId('');
      // Optional: Redirect to the event page or mycsd page
      // router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed. Please ensure you are registered for this event and the ID is correct.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto check-in if eventId is in URL
  useEffect(() => {
    const urlEventId = searchParams.get('eventId');
    if (urlEventId && user && !hasAutoCheckedIn && !isSubmitting && !checkInSuccess) {
      setHasAutoCheckedIn(true);
      performCheckIn(urlEventId);
    }
  }, [user, searchParams, hasAutoCheckedIn, isSubmitting, checkInSuccess]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await performCheckIn(eventId);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (checkInSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="grow flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Taken!</h1>
            <p className="text-gray-600 mt-2">You have successfully checked in for the event.</p>
            <div className="mt-8">
              <Link 
                href="/" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Event Check-in</h1>
            {isSubmitting ? (
              <p className="text-gray-600 mt-2 animate-pulse">
                Processing your attendance...
              </p>
            ) : (
              <p className="text-gray-600 mt-2">
                Enter the Event ID from the QR code to check in.
              </p>
            )}
          </div>

          {!isSubmitting && (
            <form onSubmit={handleCheckIn} className="space-y-6">
              <div>
                <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-1">
                  Event ID
                </label>
                <input
                  type="text"
                  id="eventId"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  placeholder="e.g. 20000000-..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Checking in...' : 'Check In'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {isSubmitting && (
             <div className="flex justify-center py-8">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              <strong>Note for Testing:</strong> Since this is a web app, you cannot scan the QR code directly. 
              Copy the Event ID from the Organizer's QR code modal and paste it here.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
