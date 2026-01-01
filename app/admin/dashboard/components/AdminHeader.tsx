'use client';

import { Search, Bell, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function AdminHeader() {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
      {/* Title / Breadcrumb context */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative hidden md:block w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events, users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all text-gray-900"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
            CTRL + K
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative">
            <Mail className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
            {/* Using a placeholder since profileImage is not currently in User type */}
            <span className="font-bold text-purple-600">{user?.name?.charAt(0) || 'A'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
