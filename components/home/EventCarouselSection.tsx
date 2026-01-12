'use client';

import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import EventCard from '@/components/event/EventCard';
// clsx import removed


type CarouselEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  price: string;
  image?: string;
  [key: string]: any;
};

interface EventCarouselSectionProps {
  title: string;
  subtitle?: string;
  titleColor?: string; // e.g., 'text-orange-500'
  subtitleColor?: string; // e.g., 'text-white'
  bgColorClass: string; // e.g., 'bg-purple-900'
  events: CarouselEvent[];
  buttonText?: string;
  buttonLink?: string;
  buttonColorClass?: string;
}

export default function EventCarouselSection({
  title,
  subtitle,
  titleColor = "text-white",
  subtitleColor = "text-gray-200",
  bgColorClass,
  events,
  buttonText = "Discover More",
  buttonLink = "/events",
  buttonColorClass = "bg-white text-black hover:bg-gray-100"
}: EventCarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 4000, stopOnInteraction: false })
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className={`py-20 ${bgColorClass} overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className={titleColor}>{title} </span>
            {subtitle && <span className={subtitleColor}>{subtitle}</span>}
          </h2>
          <p className={`${subtitleColor} opacity-80 max-w-2xl mx-auto`}>
            Explore our curated selection of events designed just for you.
          </p>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="overflow-hidden py-3 px-4" ref={emblaRef}>
            <div className="flex -ml-6 touch-pan-y">
              {events.map((event, index) => (
                <div className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-6 min-w-0" key={index}>
                  <div className="h-full transform transition-transform hover:-translate-y-2 duration-300">
                    <EventCard {...event} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 z-10 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-orange-500 hover:text-white transition-all focus:outline-none"
            onClick={scrollPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 z-10 bg-white p-3 rounded-full shadow-lg text-gray-800 hover:bg-orange-500 hover:text-white transition-all focus:outline-none"
            onClick={scrollNext}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </motion.div>

        <div className="text-center mt-12">
          <Link href={buttonLink} className={`inline-block font-semibold py-3 px-8 rounded-full transition-all hover:scale-105 shadow-md ${buttonColorClass}`}>
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
