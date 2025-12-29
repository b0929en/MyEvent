'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/event/EventCard';
import SearchBar from '@/components/SearchBar';
import Breadcrumb from '@/components/Breadcrumb';
import { getEvents } from '@/backend/services/eventService';
import { Event, EventCategory, MyCSDCategory, MyCSDLevel } from '@/types';
import { format } from 'date-fns';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [hasMyCSD, setHasMyCSD] = useState<boolean | undefined>(undefined);
  const [selectedMyCSDCategories, setSelectedMyCSDCategories] = useState<MyCSDCategory[]>([]);
  const [selectedMyCSDLevels, setSelectedMyCSDLevels] = useState<MyCSDLevel[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await getEvents();
        setAllEvents(events);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let filtered = allEvents.filter(event => event.status === 'published');

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.organizerName.toLowerCase().includes(search)
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event =>
        selectedCategories.includes(event.category)
      );
    }

    if (hasMyCSD !== undefined) {
      filtered = filtered.filter(event => event.hasMyCSD === hasMyCSD);
    }

    if (selectedMyCSDCategories.length > 0) {
      filtered = filtered.filter(event =>
        event.mycsdCategory && selectedMyCSDCategories.includes(event.mycsdCategory)
      );
    }

    if (selectedMyCSDLevels.length > 0) {
      filtered = filtered.filter(event =>
        event.mycsdLevel && selectedMyCSDLevels.includes(event.mycsdLevel)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategories, hasMyCSD, selectedMyCSDCategories, selectedMyCSDLevels, allEvents]);

  // Pagination
  const totalResults = filteredEvents.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const eventsToDisplay = filteredEvents.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Category filter handlers
  const toggleCategory = (category: EventCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    handleFilterChange();
  };

  const toggleMyCSDAvailability = (value: boolean) => {
    setHasMyCSD(hasMyCSD === value ? undefined : value);
    handleFilterChange();
  };

  const toggleMyCSDCategory = (category: MyCSDCategory) => {
    setSelectedMyCSDCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    handleFilterChange();
  };

  const toggleMyCSDLevel = (level: MyCSDLevel) => {
    setSelectedMyCSDLevels(prev =>
      prev.includes(level)
        ? prev.filter(l => l !== level)
        : [...prev, level]
    );
    handleFilterChange();
  };

  // Count events per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEvents.forEach(event => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
  }, [allEvents]);

  const mycsdCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEvents.forEach(event => {
      if (event.mycsdCategory) {
        counts[event.mycsdCategory] = (counts[event.mycsdCategory] || 0) + 1;
      }
    });
    return counts;
  }, [allEvents]);

  const mycsdLevelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allEvents.forEach(event => {
      if (event.mycsdLevel) {
        counts[event.mycsdLevel] = (counts[event.mycsdLevel] || 0) + 1;
      }
    });
    return counts;
  }, [allEvents]);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="grow bg-gray-50">
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
            onChange={(value) => {
              setSearchQuery(value);
              handleFilterChange();
            }}
            placeholder="Search events..."
            className="mb-6 max-w-md"
          />

          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-64 shrink-0 hidden lg:block">
              {/* EVENT CATEGORY */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">EVENT CATEGORY</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedCategories.includes('sport')}
                      onChange={() => toggleCategory('sport')}
                    />
                    <span className="text-gray-700">Sport <span className="text-gray-400">({categoryCounts['sport'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedCategories.includes('talk')}
                      onChange={() => toggleCategory('talk')}
                    />
                    <span className="text-gray-700">Talks <span className="text-gray-400">({categoryCounts['talk'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedCategories.includes('competition')}
                      onChange={() => toggleCategory('competition')}
                    />
                    <span className="text-gray-700">Competition <span className="text-gray-400">({categoryCounts['competition'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedCategories.includes('workshop')}
                      onChange={() => toggleCategory('workshop')}
                    />
                    <span className="text-gray-700">Workshop <span className="text-gray-400">({categoryCounts['workshop'] || 0})</span></span>
                  </label>
                </div>
              </div>

              {/* MYCSD AVAILABILITY */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD AVAILABILITY</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={hasMyCSD === true}
                      onChange={() => toggleMyCSDAvailability(true)}
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={hasMyCSD === false}
                      onChange={() => toggleMyCSDAvailability(false)}
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>

              {/* MYCSD CATEGORY */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD CATEGORY</h3>
                <div className="space-y-2">
                  {(['REKA CIPTA DAN INOVASI', 'KEUSAHAWAN', 'KEBUDAYAAN', 'SUKAN/REKREASI/SOSIALISASI', 'KEPIMPINAN'] as MyCSDCategory[]).map((category) => (
                    <label key={category} className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="mr-2 cursor-pointer"
                        checked={selectedMyCSDCategories.includes(category)}
                        onChange={() => toggleMyCSDCategory(category)}
                      />
                      <span className="text-gray-700">{category} <span className="text-gray-400">({mycsdCategoryCounts[category] || 0})</span></span>
                    </label>
                  ))}
                </div>
              </div>

              {/* MYCSD LEVEL */}
              <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">MYCSD LEVEL</h3>
                <div className="space-y-2">
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedMyCSDLevels.includes('Antarabangsa')}
                      onChange={() => toggleMyCSDLevel('Antarabangsa')}
                    />
                    <span className="text-gray-700">Antarabangsa <span className="text-gray-400">({mycsdLevelCounts['Antarabangsa'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedMyCSDLevels.includes('Kebangsaan / Antara University')}
                      onChange={() => toggleMyCSDLevel('Kebangsaan / Antara University')}
                    />
                    <span className="text-gray-700">Kebangsaan / Antara Universiti <span className="text-gray-400">({mycsdLevelCounts['Kebangsaan / Antara University'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedMyCSDLevels.includes('Negeri / Universiti')}
                      onChange={() => toggleMyCSDLevel('Negeri / Universiti')}
                    />
                    <span className="text-gray-700">Negeri / Universiti <span className="text-gray-400">({mycsdLevelCounts['Negeri / Universiti'] || 0})</span></span>
                  </label>
                  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      className="mr-2 cursor-pointer"
                      checked={selectedMyCSDLevels.includes('P.Pengajian / Desasiswa / Persatuan / Kelab')}
                      onChange={() => toggleMyCSDLevel('P.Pengajian / Desasiswa / Persatuan / Kelab')}
                    />
                    <span className="text-gray-700">Kampus (P.Pengajian...) <span className="text-gray-400">({mycsdLevelCounts['P.Pengajian / Desasiswa / Persatuan / Kelab'] || 0})</span></span>
                  </label>
                </div>
              </div>
            </aside>

            {/* Events Grid */}
            <div className="grow">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading events...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Showing {totalResults > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalResults)} of <span className="font-semibold">{totalResults}</span> results
                    </p>

                    {/* Clear filters button */}
                    {(selectedCategories.length > 0 || hasMyCSD !== undefined || selectedMyCSDCategories.length > 0 || selectedMyCSDLevels.length > 0) && (
                      <button
                        onClick={() => {
                          setSelectedCategories([]);
                          setHasMyCSD(undefined);
                          setSelectedMyCSDCategories([]);
                          setSelectedMyCSDLevels([]);
                          setCurrentPage(1);
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>

                  {eventsToDisplay.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {eventsToDisplay.map((event) => (
                          <EventCard
                            key={event.id}
                            id={event.id}
                            title={event.title}
                            date={format(new Date(event.startDate), 'EEEE • h:mma')}
                            venue={event.venue}
                            price={event.participationFee === 0 ? 'Free' : `RM${event.participationFee}`}
                            image={event.bannerImage}
                          />
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                          <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>

                          {getPaginationNumbers().map((page, index) => (
                            typeof page === 'number' ? (
                              <button
                                key={index}
                                onClick={() => goToPage(page)}
                                className={`px-3 py-1 rounded transition-colors ${currentPage === page
                                  ? 'bg-gray-900 text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                              >
                                {page}
                              </button>
                            ) : (
                              <span key={index} className="px-2 text-gray-400">
                                {page}
                              </span>
                            )
                          ))}

                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategories([]);
                          setHasMyCSD(undefined);
                          setSelectedMyCSDCategories([]);
                          setSelectedMyCSDLevels([]);
                          setCurrentPage(1);
                        }}
                        className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
