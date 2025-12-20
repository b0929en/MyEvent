import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-purple-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-orange-500 font-semibold mb-4 border-l-4 border-orange-500 pl-2">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 1</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 2</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 3</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 4</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 5</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-orange-500 font-semibold mb-4 border-l-4 border-orange-500 pl-2">
              Support
            </h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 1</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 2</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 3</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 4</Link></li>
              <li><Link href="#" className="text-gray-300 hover:text-white">Link 5</Link></li>
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
        <div className="mt-12 pt-8 border-t border-purple-900 text-center">
          <p className="text-gray-400 text-sm">
            All Rights Reserved | Universiti Sains Malaysia © 2025
          </p>
        </div>
      </div>
    </footer>
  );
}