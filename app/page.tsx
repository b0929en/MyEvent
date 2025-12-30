import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getEvents } from '@/backend/services/eventService';
import { format } from 'date-fns';
import InteractiveHero from '@/components/home/InteractiveHero';
import EventCarouselSection from '@/components/home/EventCarouselSection';

export default async function Home() {
  const events = await getEvents();
  const allEvents = events || [];

  // Get trending events (sort by registrations)
  const trendingEvents = [...allEvents]
    .sort((a, b) => b.registeredCount - a.registeredCount)
    .slice(0, 8) // Increased to 8 for carousel demonstration
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
    .slice(0, 8) // Increased to 8 for carousel demonstration
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

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="grow">
        <InteractiveHero />

        {/* Trending Events Section */}
        <EventCarouselSection
          title="Trending"
          subtitle="Events"
          titleColor="text-orange-500"
          subtitleColor="text-white"
          bgColorClass="bg-[#5A2D81]" // USM Deep Purple approximation
          events={trendingEvents}
          buttonText="View All Trending"
          buttonColorClass="bg-orange-500 hover:bg-orange-600 text-white"
        />

        {/* Recommended Events Section */}
        <EventCarouselSection
          title="Recommended For"
          subtitle="You"
          titleColor="text-white"
          subtitleColor="text-[#5A2D81]"
          bgColorClass="bg-gradient-to-b from-orange-400 to-orange-500" // Gradient for better visual depth
          events={recommendedEvents}
          buttonText="Discover More"
          buttonColorClass="bg-[#5A2D81] hover:bg-purple-900 text-white"
        />
      </main>

      <Footer />
    </div>
  );
}
