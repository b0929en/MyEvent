import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative bg-purple-950 text-white overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 bg-[url('/usm-card-background.webp')] bg-cover bg-center opacity-50"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-black/60"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-6">
          {/* Quick Links */}
          <div>
            <h3 className="text-orange-500 font-semibold mb-4 border-l-4 border-orange-500 pl-2">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-white transition-colors duration-300">Home</Link></li>
              <li><Link href="/events" className="text-gray-300 hover:text-white transition-colors duration-300">Events</Link></li>
              <li><Link href="/mycsd" className="text-gray-300 hover:text-white transition-colors duration-300">MyCSD</Link></li>
              <li><Link href="/profile" className="text-gray-300 hover:text-white transition-colors duration-300">Profile</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-orange-500 font-semibold mb-4 border-l-4 border-orange-500 pl-2">
              Support
            </h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Report Problem</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors duration-300">Event Guides</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white transition-colors duration-300">FAQ</Link></li>
            </ul>
          </div>

          {/* Contact Section - spans 3 columns */}
          <div className="lg:col-span-3">
            <h3 className="text-orange-500 font-semibold mb-4 border-l-4 border-orange-500 pl-2">
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Main Campus */}
              <div className="space-y-2">
                <p className="font-semibold text-white">Main Campus</p>
                <p className="text-gray-300 text-sm">Tel: +604-653 3107</p>
                <p className="text-gray-300 text-sm">Fax: +604-6573761</p>
                <p className="text-gray-300 text-sm">Email: bhepa@usm.my</p>
              </div>

              {/* Engineering Campus */}
              <div className="space-y-2">
                <p className="font-semibold text-white">Engineering Campus</p>
                <p className="text-gray-300 text-sm">Tel: +604-653 3107</p>
                <p className="text-gray-300 text-sm">Fax: +604-6573761</p>
                <p className="text-gray-300 text-sm">Email: bhepa@usm.my</p>
              </div>

              {/* Health Campus */}
              <div className="space-y-2">
                <p className="font-semibold text-white">Health Campus</p>
                <p className="text-gray-300 text-sm">Tel: +604-653 3107</p>
                <p className="text-gray-300 text-sm">Fax: +604-6573761</p>
                <p className="text-gray-300 text-sm">Email: bhepa@usm.my</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 py-6 border-t border-white/30 text-center">
          <p className="text-gray-400 text-sm">
            All Rights Reserved | MyEvent@USM © 2025
          </p>
        </div>
      </div>
    </footer>
  );
}