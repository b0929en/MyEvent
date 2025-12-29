import { supabase } from '../supabase/supabase';
import { DBNotification } from '@/types';

export type NotificationType = 'event' | 'registration' | 'mycsd' | 'admin' | 'proposal';

export interface Notification {
  id: string;
  userId: string | null;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
  userName?: string; // Added for Admin Dashboard display
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data.map((n: DBNotification) => ({
    id: n.notification_id,
    userId: n.user_id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
}

export async function createNotification(notification: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
    });

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('notification_id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// NEW: Helper for Admin Dashboard to get system activity
export async function getAllSystemNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      users (
        user_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching system notifications:', error);
    return [];
  }

  return data.map((n: DBNotification & { users?: { user_name: string } }) => ({
    id: n.notification_id,
    userId: n.user_id,
    userName: n.users?.user_name || 'Unknown User',
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.is_read,
    createdAt: n.created_at,
  }));
}