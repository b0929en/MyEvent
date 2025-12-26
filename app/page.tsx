import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard from '@/components/event/EventCard';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import { Users, GraduationCap, Music, Lightbulb, Heart, Trophy } from 'lucide-react';
import { getEvents } from '@/backend/services/eventService';
import { format } from 'date-fns';

export default async function Home() {
  const events = await getEvents();
  const allEvents = events || [];

  // Get trending events (sort by registrations)
  const trendingEvents = [...allEvents]
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 4)
    .map(event => {
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return {
        id: event.id,
        title: event.title,
        date: `${format(eventDateTime, 'EEEE')} • ${format(eventDateTime, 'h:mma')}`,
        venue: event.venue,
        price: event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`
      };
    });

  // Get recommended events (upcoming events)
  const recommendedEvents = [...allEvents]
    .filter(event => {
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return eventDateTime > new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.startDate}T${a.startTime}`);
      const dateB = new Date(`${b.startDate}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 4)
    .map(event => {
      const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
      return {
        id: event.id,
        title: event.title,
        date: `${format(eventDateTime, 'EEEE')} • ${format(eventDateTime, 'h:mma')}`,
        venue: event.venue,
        price: event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`
      };
    });

  const categories = [
    { name: 'Academic', icon: GraduationCap, value: 'academic' },
    { name: 'Cultural', icon: Music, value: 'cultural' },
    { name: 'Workshop', icon: Lightbulb, value: 'workshop' },
    { name: 'Social', icon: Heart, value: 'social' },
    { name: 'Sports', icon: Trophy, value: 'sports' },
    { name: 'Volunteering', icon: Users, value: 'volunteering' }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="grow">
        {/* Hero Section - Discover Events */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-purple-900">Discover </span>
                <span className="text-orange-500">Events</span>
              </h1>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>

              {/* Search Bar */}
              <SearchBar
                placeholder="Search events..."
                className="max-w-md mx-auto"
              />
            </div>

            {/* Event Categories */}
            <div className="mt-12">
              <h3 className="text-center text-gray-700 font-semibold mb-6">
                Trending Event Categories:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
                {categories.map((category, index) => {
                  const Icon = category.icon;
                  return (
                    <Link 
                      key={index} 
                      href={`/events?category=${category.value}`}
                      className="flex flex-col items-center group"
                    >
                      <div className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2 group-hover:border-orange-500 transition-colors cursor-pointer">
                        <Icon className="w-10 h-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <p className="text-sm text-gray-700 text-center group-hover:text-orange-500 transition-colors">{category.name}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Trending Events Section */}
        <section className="bg-purple-900 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="text-orange-500">Trending </span>
                <span className="text-white">Events</span>
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {trendingEvents.map((event, index) => (
                <EventCard key={index} {...event} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/events" className="inline-block bg-gray-400 hover:bg-gray-500 text-white font-semibold py-3 px-8 rounded-full transition-colors">
                Discover More
              </Link>
            </div>
          </div>
        </section>

        {/* Recommended Events Section */}
        <section className="bg-orange-500 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                <span className="text-white">Recommended For </span>
                <span className="text-purple-900">You</span>
              </h2>
              <p className="text-white max-w-2xl mx-auto">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {recommendedEvents.map((event, index) => (
                <EventCard key={index} {...event} />
              ))}
            </div>

            <div className="text-center">
              <Link href="/events" className="inline-block bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-full transition-colors">
                Discover More
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
