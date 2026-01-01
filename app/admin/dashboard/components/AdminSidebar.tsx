'use client';

import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'proposals', label: 'Proposals', icon: FileText },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'mycsd', label: 'MyCSD', icon: TrendingUp },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-2 border-b border-gray-100">
        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">MyEvent</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-purple-600' : 'text-gray-400'}`} />
            {item.label}
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-100 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </button>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
