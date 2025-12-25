'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Bell, X, CheckCircle, Calendar, FileText, TrendingUp, AlertCircle } from 'lucide-react';

type NotificationType = 'event' | 'registration' | 'mycsd' | 'admin' | 'proposal';

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

// Mock notifications (backend will provide these)
const mockNotifications: Notification[] = [
  {
    id: 'notif1',
    type: 'registration',
    title: 'Registration Confirmed',
    message: 'Your registration for "Tech Talk: AI in Healthcare" has been confirmed.',
    link: '/events/event1',
    isRead: false,
    createdAt: '2026-01-20T10:30:00Z'
  },
  {
    id: 'notif2',
    type: 'event',
    title: 'New Event Available',
    message: 'Hackathon 2026 is now open for registration!',
    link: '/events/event2',
    isRead: false,
    createdAt: '2026-01-19T14:00:00Z'
  },
  {
    id: 'notif3',
    type: 'mycsd',
    title: 'MyCSD Points Approved',
    message: 'You have been awarded 5 MyCSD points for "Tech Talk: AI in Healthcare".',
    link: '/mycsd',
    isRead: true,
    createdAt: '2026-01-18T09:15:00Z'
  },
  {
    id: 'notif4',
    type: 'event',
    title: 'Event Reminder',
    message: 'Tech Talk: AI in Healthcare starts in 2 days. Don\'t forget to attend!',
    link: '/events/event1',
    isRead: true,
    createdAt: '2026-01-17T16:00:00Z'
  },
  {
    id: 'notif5',
    type: 'admin',
    title: 'System Maintenance',
    message: 'MyEvent @ USM will undergo scheduled maintenance on Jan 25, 2026.',
    isRead: true,
    createdAt: '2026-01-15T08:00:00Z'
  }
];

// Organizer-specific notifications
const organizerNotifications: Notification[] = [
  {
    id: 'org1',
    type: 'proposal',
    title: 'Proposal Approved',
    message: 'Your proposal for "Tech Talk Series" has been approved. You can now create the event.',
    link: '/organizer/events/create',
    isRead: false,
    createdAt: '2026-01-21T11:00:00Z'
  },
  {
    id: 'org2',
    type: 'event',
    title: 'Event Published',
    message: 'Your event "Hackathon 2026" has been approved and published.',
    link: '/organizer/dashboard',
    isRead: true,
    createdAt: '2026-01-20T15:30:00Z'
  },
  {
    id: 'org3',
    type: 'registration',
    title: 'New Registrations',
    message: '15 new students registered for "Hackathon 2026".',
    link: '/organizer/events/event2/attendees',
    isRead: true,
    createdAt: '2026-01-19T12:00:00Z'
  }
];

// Admin-specific notifications
const adminNotifications: Notification[] = [
  {
    id: 'admin1',
    type: 'proposal',
    title: 'New Proposal Submitted',
    message: 'Computer Science Society submitted a proposal for "Tech Talk Series 2026".',
    link: '/admin/proposals',
    isRead: false,
    createdAt: '2026-01-22T09:00:00Z'
  },
  {
    id: 'admin2',
    type: 'event',
    title: 'Event Pending Approval',
    message: '3 events are waiting for your approval.',
    link: '/admin/events',
    isRead: false,
    createdAt: '2026-01-21T14:30:00Z'
  },
  {
    id: 'admin3',
    type: 'mycsd',
    title: 'MyCSD Points Pending',
    message: '8 MyCSD point submissions are pending review.',
    link: '/admin/mycsd',
    isRead: true,
    createdAt: '2026-01-20T10:00:00Z'
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  
  // Load notifications based on user role
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    let allNotifs = [...mockNotifications];
    
    if (user?.role === 'organizer') {
      allNotifs = [...organizerNotifications, ...mockNotifications];
    } else if (user?.role === 'admin') {
      allNotifs = [...adminNotifications, ...mockNotifications];
    }
    
    return allNotifs;
  });

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'registration':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'mycsd':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'admin':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'proposal':
        return <FileText className="w-5 h-5 text-indigo-600" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view notifications</p>
          <Link href="/login" className="text-purple-600 hover:underline mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                  <p className="text-gray-600">
                    {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(['all', 'event', 'registration', 'mycsd', 'proposal', 'admin'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    filter === type
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-md p-4 transition-all ${
                    !notification.isRead ? 'border-l-4 border-purple-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      !notification.isRead ? 'bg-purple-50' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                          aria-label="Delete notification"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {format(new Date(notification.createdAt), 'MMM dd, yyyy h:mm a')}
                        </span>
                        
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-purple-600 hover:underline font-medium"
                          >
                            View details →
                          </Link>
                        )}
                        
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-gray-500 hover:text-purple-600 font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No notifications</p>
                <p className="text-gray-400 text-sm">
                  {filter !== 'all' ? 'Try changing the filter' : 'You\'re all caught up!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
