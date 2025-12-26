'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRequireRole } from '@/contexts/AuthContext';
import { checkInUser } from '@/backend/services/registrationService';
import { toast } from 'sonner';
import { QrCode, ArrowRight } from 'lucide-react';

export default function CheckInPage() {
  const { user, isLoading } = useRequireRole(['student'], '/login');
  const [eventId, setEventId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlEventId = searchParams.get('eventId');
    if (urlEventId) {
      setEventId(urlEventId);
    }
  }, [searchParams]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId.trim()) return;

    setIsSubmitting(true);
    try {
      if (user) {
        await checkInUser(eventId, user.id);
        toast.success('Successfully checked in!');
        setEventId('');
        // Optional: Redirect to the event page or mycsd page
        // router.push(`/events/${eventId}`);
      }
    } catch (error) {
      console.error('Check-in failed:', error);
      toast.error('Check-in failed. Please ensure you are registered for this event and the ID is correct.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
            <p className="text-gray-600 mt-2">
              Enter the Event ID from the QR code to check in.
            </p>
          </div>

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
