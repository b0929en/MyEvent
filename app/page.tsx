import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getTrendingEvents } from '@/backend/services/eventService';
import { format } from 'date-fns';
import InteractiveHero from '@/components/home/InteractiveHero';
import EventCarouselSection from '@/components/home/EventCarouselSection';
import RecommendedEvents from '@/components/home/RecommendedEvents';

export default async function Home() {
  // Get trending events (server-side)
  const trendingData = await getTrendingEvents(8);

  const trendingEvents = trendingData.map(event => {
    const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
    return {
      id: event.id,
      title: event.title,
      date: `${format(eventDateTime, 'EEEE')} • ${format(eventDateTime, 'h:mma')}`,
      venue: event.venue,
      price: event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`,
      image: event.bannerImage
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
          buttonText="View All"
          buttonColorClass="bg-orange-500 hover:bg-orange-600 text-white"
        />

        {/* Recommended Events Section (Client Component) */}
        <RecommendedEvents />
      </main>

      <Footer />
    </div>
  );
}
