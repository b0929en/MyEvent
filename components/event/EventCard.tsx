import Image from 'next/image';
import Link from 'next/link';

interface EventCardProps {
  title: string;
  date: string;
  venue: string;
  price: string;
  image?: string;
  id?: string;
}

export default function EventCard({ title, date, venue, price, image, id = '1' }: EventCardProps) {
  return (
    <Link href={`/events/${id}`} className="block h-full group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full transition-all duration-300 ">
        {/* Event Image */}
        <div className="bg-gray-300 h-48 relative">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        {/* Event Details */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-1">{date}</p>
          <p className="text-sm text-gray-600 mb-1">{venue}</p>
          <p className="text-sm text-gray-600 mb-4">{price}</p>
        </div>
      </div>
    </Link>
  );
}