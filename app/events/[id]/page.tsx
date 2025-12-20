import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/Breadcrumb';

export default function EventDetailsPage() {
  // Mock event data - in real app, this would be fetched from API
  const event = {
    title: 'Royal Gambit: The Final Showdown (Individual)',
    organizer: 'USM Bridge & Chess Club',
    participationFee: 'Free',
    date: '7th June 2025 (Saturday)',
    time: '7:30AM - 7:30PM (GMT+8)',
    description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`,
    mycsdAvailable: true,
    international: true,
    bannerImage: '/event-banner.jpg',
    gallery: [
      '/gallery1.jpg',
      '/gallery2.jpg',
      '/gallery3.jpg',
      '/gallery4.jpg'
    ],
    links: [
      'gaygaygay.com',
      'mf.my',
      '@igbiabla'
    ]
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
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
            <div className="relative w-full h-80 bg-gray-200">
              {/* Placeholder for event banner - replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-amber-100 to-amber-200">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-800">ROYAL GAMBIT</h2>
                  <p className="text-2xl text-gray-600">The Final Showdown</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Title and Tags */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            <div className="flex gap-2">
              {event.mycsdAvailable && (
                <span className="px-4 py-1 bg-orange-500 text-white text-sm font-medium rounded-full">
                  MyCSD: Available
                </span>
              )}
              {event.international && (
                <span className="px-4 py-1 bg-purple-600 text-white text-sm font-medium rounded-full">
                  International
                </span>
              )}
            </div>
          </div>

          {/* General Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Organizer:</p>
                <p className="text-gray-900 font-medium">{event.organizer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Date:</p>
                <p className="text-gray-900 font-medium">{event.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Participation Fee:</p>
                <p className="text-gray-900 font-medium">{event.participationFee}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time:</p>
                <p className="text-gray-900 font-medium">{event.time}</p>
              </div>
            </div>

            {/* RSVP Button */}
            <button className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-full transition-colors">
              RSVP Now
            </button>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">{event.description}</p>
          </div>

          {/* Gallery */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {event.gallery.map((image, index) => (
                <div key={index} className="relative h-40 bg-gray-300 rounded-lg overflow-hidden">
                  {/* Placeholder for gallery images */}
                  <div className="w-full h-full bg-gray-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Links</h2>
            <ul className="list-disc list-inside space-y-2">
              {event.links.map((link, index) => (
                <li key={index} className="text-gray-700">{link}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
