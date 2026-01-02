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

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    // 1. Fetch Event Proposals (For Organizers)
    const { data: proposals } = await supabase
      .from('event_requests')
      .select(`
        event_request_id,
        status,
        admin_notes,
        updated_at,
        events ( event_id, event_name )
      `)
      .eq('user_id', userId)
      .in('status', ['approved', 'rejected', 'revision_needed', 'published']);

    if (proposals) {
      proposals.forEach((p: any) => {
        const eventName = p.events?.[0]?.event_name || p.events?.event_name || 'Untitled Event';
        const eventId = p.events?.[0]?.event_id || p.events?.event_id;

        let title = '';
        let message = '';
        let link = '/organizer/dashboard';

        if (p.status === 'approved') {
          title = `Proposal Approved: ${eventName}`;
          message = `Your proposal for "${eventName}" has been approved. You can now publish it.`;
          link = `/organizer/events/create?secretKey=${p.event_request_id}`; // Direct them to create/publish
        } else if (p.status === 'published') {
          title = `Event Published: ${eventName}`;
          message = `Your event "${eventName}" is now live!`;
          link = `/events/${eventId}`;
        } else if (p.status === 'rejected') {
          title = `Proposal Rejected: ${eventName}`;
          message = `Your proposal was rejected. Reason: ${p.admin_notes || 'No notes provided.'}`;
        } else if (p.status === 'revision_needed') {
          title = `Revision Needed: ${eventName}`;
          message = `Updates requested: ${p.admin_notes}`;
        }

        notifications.push({
          id: `prop-${p.event_request_id}`,
          userId,
          type: 'proposal', // UI maps this icon
          title,
          message,
          link,
          isRead: false, // Virtual notifications are always "unread" unless we track them elsewhere
          createdAt: p.updated_at
        });
      });
    }

    // 2. Fetch MyCSD Claims (For Organizers)
    const { data: claims } = await supabase
      .from('mycsd_requests')
      .select(`
        mr_id,
        status,
        rejection_reason,
        updated_at,
        events ( event_name )
      `)
      .eq('user_id', userId)
      .in('status', ['approved', 'rejected']);

    if (claims) {
      claims.forEach((c: any) => {
        const eventName = c.events?.event_name || 'Unknown Event';

        let title = '';
        let message = '';

        if (c.status === 'approved') {
          title = 'MyCSD Claim Approved';
          message = `Your MyCSD claim for "${eventName}" has been approved.`;
        } else {
          title = 'MyCSD Claim Rejected';
          message = `MyCSD claim for "${eventName}" rejected: ${c.rejection_reason}`;
        }

        notifications.push({
          id: `claim-${c.mr_id}`,
          userId,
          type: 'mycsd',
          title,
          message,
          link: '/organizer/dashboard',
          isRead: false,
          createdAt: c.updated_at || new Date().toISOString()
        });
      });
    }

    // 3. Fetch MyCSD Points Awarded (For Participants)
    // We check registrations for events where is_mycsd_claimed is true
    const { data: participations } = await supabase
      .from('registrations')
      .select(`
        registration_id,
        created_at,
        events!inner (
          event_id,
          event_name,
          is_mycsd_claimed,
          mycsd_points,
          mycsd_requests ( updated_at )
        )
      `)
      .eq('user_id', userId)
      .eq('attendance', 'present')
      .eq('events.is_mycsd_claimed', true);

    if (participations) {
      participations.forEach((reg: any) => {
        const event = reg.events;
        // Get the approval date from the linked request, or fallback
        const approvalDate = event.mycsd_requests?.[0]?.updated_at || reg.created_at;

        notifications.push({
          id: `point-${reg.registration_id}`,
          userId,
          type: 'mycsd',
          title: 'MyCSD Points Awarded',
          message: `You earned ${event.mycsd_points} points for attending "${event.event_name}".`,
          link: '/profile',
          isRead: false,
          createdAt: approvalDate
        });
      });
    }

  } catch (error) {
    console.error('Error deriving notifications:', error);
  }

  // Sort by date desc
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// No-op since we derive notifications now
export async function createNotification(notification: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  // console.log('Notification skipped (using virtual derivation):', notification);
  return;
}

export async function markNotificationAsRead(notificationId: string) {
  // Not implemented for virtual notifications
  return;
}

export async function markAllNotificationsAsRead(userId: string) {
  // Not implemented for virtual notifications
  return;
}

// NEW: Helper for Admin Dashboard to get system activity
// This also needs to be derived if we want consistency, or we query 'event_requests' globally.
export async function getAllSystemNotifications() {
  // For Admin Dashboard, showing recent approved/rejected proposals is a good proxy.
  const { data } = await supabase
    .from('event_requests')
    .select(`
       event_request_id,
       status,
       updated_at,
       user_id,
       events ( event_name ),
       users ( user_name )
     `)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.event_request_id,
    userId: item.user_id,
    userName: item.users?.user_name || 'Unknown',
    type: 'admin', // Generic admin type
    title: `Proposal ${item.status}`,
    message: `${item.users?.user_name} - ${item.events?.event_name}: ${item.status}`,
    link: `/admin/dashboard`,
    isRead: true,
    createdAt: item.updated_at
  }));
}