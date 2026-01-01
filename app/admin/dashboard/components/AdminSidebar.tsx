import {
  Monitor,
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    // { id: 'users', label: 'Users', icon: Users },
    { id: 'proposals', label: 'Event Proposals', icon: FileText },
    { id: 'mycsd', label: 'MyCSD', icon: TrendingUp },
    { id: 'events', label: 'Event Pages', icon: Calendar },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen sticky top-0">
      {/* Brand */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">
          <span className="text-orange-500">My</span>
          <span className="text-white">Event</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Admin Control Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-800">
        {/* <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
          Settings
        </button> */}
        <button
          onClick={logout}
          className="w-full flex cursor-pointer items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
