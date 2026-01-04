'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecommendedEvents } from '@/backend/services/eventService';
import EventCarouselSection from '@/components/home/EventCarouselSection';
import { format } from 'date-fns';
import { Event } from '@/types'; // Ensure types are imported

export default function RecommendedEvents() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]); // Using any[] to match the mapped shape expected by carousel
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const recommended = await getRecommendedEvents(user?.id, 8);

                console.log('Recommended Events:', recommended);

                // Map to the shape expected by EventCarouselSection
                const mappedEvents = recommended.map(event => {
                    const eventDateTime = new Date(`${event.startDate}T${event.startTime}`);
                    return {
                        id: event.id,
                        title: event.title,
                        date: `${format(eventDateTime, 'EEEE')} • ${format(eventDateTime, 'h:mma')}`,
                        venue: event.venue,
                        price: event.participationFee === 0 ? 'Free' : `RM ${event.participationFee}`,
                        image: event.bannerImage || '/usm-card-background.webp'
                    };
                });

                setEvents(mappedEvents);
            } catch (error) {
                console.error('Failed to fetch recommended events', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [user]);

    if (loading) {
        return (
            <div className="py-12 bg-white flex justify-center">
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // If no events, we might want to hide the section or show nothing
    // getRecommendedEvents should fallback to upcoming, so we should usually have events.
    if (events.length === 0) return null;

    return (
        <EventCarouselSection
            title="Recommended For"
            subtitle="You"
            titleColor="text-white"
            subtitleColor="text-[#5A2D81]"
            bgColorClass="bg-gradient-to-b from-orange-400 to-orange-500"
            events={events}
            buttonText="Discover More"
            buttonColorClass="bg-[#5A2D81] hover:bg-purple-900 text-white"
        />
    );
}
