'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRequireRole } from '@/contexts/AuthContext';

// Components
import AdminSidebar from './components/AdminSidebar';

import OverviewTab from './components/OverviewTab';
import UsersTab from './components/UsersTab';
import ProposalsTab from './components/ProposalsTab';
import MyCSDTab from './components/MyCSDTab';
import EventsTab from './components/EventsTab';

function DashboardContent() {
  const { user, isLoading } = useRequireRole(['admin'], '/');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar activeTab={currentTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Dynamic Content */}
            {currentTab === 'overview' && <OverviewTab />}
            {currentTab === 'users' && <UsersTab />}
            {currentTab === 'proposals' && <ProposalsTab />}
            {currentTab === 'mycsd' && <MyCSDTab />}
            {currentTab === 'events' && <EventsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}