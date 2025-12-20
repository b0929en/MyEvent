'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/event/EventCard';
import SearchBar from '@/components/SearchBar';
import Breadcrumb from '@/components/Breadcrumb';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock event data - in real app, this would come from an API
  const allEvents = Array(69).fill({
    title: 'Royal Gambit: The Final Showdown (Individual)',
    date: 'Thursday • 9:00AM',
    venue: 'Dewan Utama Pelajar',
    price: 'Free'
  });

  // Filter events based on search query
  const filteredEvents = searchQuery
    ? allEvents.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allEvents;

  const totalResults = filteredEvents.length;
  const eventsToDisplay = filteredEvents.slice(0, 12); // Show first 12 for pagination

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Event' }
            ]}
          />

          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search events..."
            className="mb-6 max-w-md"
          />

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-64 flex-shrink-0">
              {/* EVENT CATEGORY */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">EVENT CATEGORY</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Sport <span className="text-gray-400">(2)</span></span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Talks <span className="text-gray-400">(2)</span></span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Competition <span className="text-gray-400">(3)</span></span>
                  </label>
                </div>
              </div>

              {/* MYCSD AVAILABILITY */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD AVAILABILITY</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* MYCSD CATEGORY */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD CATEGORY</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Advance</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Baruna</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Labels</span>
                  </label>
                </div>
              </div>

              {/* MYCSD LEVEL */}
              <div className="bg-white rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD LEVEL</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Antarabangsa</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Negeri / Universiti</span>
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-gray-700">Pusat Pengajian / Desasiswa / Persatuan / Kelab</span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Events Grid */}
            <div className="flex-grow">
              <p className="text-sm text-gray-600 mb-4">
                Showing 1-{Math.min(12, totalResults)} of <span className="font-semibold">{totalResults}</span> results
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {eventsToDisplay.map((event, index) => (
                  <EventCard key={index} {...event} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center items-center gap-2 mt-8">
                <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                  ← Previous
                </button>
                <button className="px-3 py-1 bg-gray-900 text-white rounded">1</button>
                <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded">2</button>
                <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded">3</button>
                <span className="px-2">...</span>
                <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded">9</button>
                <button className="px-3 py-1 text-gray-700 hover:bg-gray-100 rounded">10</button>
                <button className="px-3 py-1 text-gray-500 hover:text-gray-700">
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
