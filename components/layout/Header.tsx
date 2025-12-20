import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-orange-500">My</span>
              <span className="text-purple-900">EVENT</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-purple-900 hover:text-orange-500 font-medium">
              Home
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-orange-500 font-medium">
              Events
            </Link>
            <Link href="/mycsd" className="text-gray-700 hover:text-orange-500 font-medium">
              MyCSD
            </Link>
            <Link href="/profile" className="text-gray-700 hover:text-orange-500 font-medium">
              Profile
            </Link>
            <Link href="/logout" className="text-red-600 hover:text-red-700 font-medium">
              Log Out
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}