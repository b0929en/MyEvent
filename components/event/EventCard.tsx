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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Event Image */}
      <Link href={`/events/${id}`}>
        <div className="bg-gray-300 h-48 relative cursor-pointer">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>
      </Link>

      {/* Event Details */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/events/${id}`}>
          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-orange-500 cursor-pointer">
            {title}
          </h3>
        </Link>
        <p className="text-sm text-gray-600 mb-1">{date}</p>
        <p className="text-sm text-gray-600 mb-1">{venue}</p>
        <p className="text-sm text-gray-600 mb-4">{price}</p>

        {/* Register Button */}
        <Link
          href={`/events/${id}`}
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center font-semibold py-2 px-4 rounded-full transition-colors mt-auto"
        >
          Register
        </Link>
      </div>
    </div>
  );
}