'use client';

import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';
import { Users, GraduationCap, Music, Lightbulb, Heart, Trophy } from 'lucide-react';

import { useRouter } from 'next/navigation';

const categories = [
  { name: 'Academic', icon: GraduationCap, value: 'academic' },
  { name: 'Cultural', icon: Music, value: 'cultural' },
  { name: 'Workshop', icon: Lightbulb, value: 'workshop' },
  { name: 'Social', icon: Heart, value: 'social' },
  { name: 'Sport', icon: Trophy, value: 'sport' },
  { name: 'Competition', icon: Users, value: 'competition' }
];

export default function InteractiveHero() {
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white text-gray-900 flex flex-col justify-center py-20 min-h-[calc(100vh-4rem)]">

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="text-[#5A2D81]">Discover </span>
            <span className="text-[#F58220]">Events</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 mb-10 max-w-2xl mx-auto text-lg md:text-xl"
          >
            Explore the best events happening around USM. 
            <br />
            Join and experience the excitement.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="scale-110">
              <SearchBar
                onSearch={handleSearch}
                placeholder="Search events..."
                className="max-w-md mx-auto rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Event Categories */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-20"
        >
          <h3 className="text-center text-gray-700 font-semibold mb-10 text-xl uppercase tracking-wider">
            Trending Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={index}
                  href={`/events?category=${category.value}`}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 3 }}
                    className="w-24 h-24 rounded-2xl bg-white shadow-lg border-2 border-gray-100 flex items-center justify-center mb-4 group-hover:border-[#F58220] group-hover:shadow-orange-100 transition-all duration-300"
                  >
                    <Icon className="w-10 h-10 text-gray-400 group-hover:text-[#F58220] transition-colors" />
                  </motion.div>
                  <p className="text-sm font-medium text-gray-600 group-hover:text-[#5A2D81] transition-colors uppercase tracking-wide">{category.name}</p>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
