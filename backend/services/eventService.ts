import { supabase } from '../supabase/supabase';
import { Event, EventCategory, MyCSDCategory, MyCSDLevel } from '@/types';
import { getPointsForLevel } from '../utils';

const mapEvent = (dbEvent: any): Event => {
  // Extract MyCSD info if available
  const mycsdRequest = dbEvent.mycsd_requests?.find((req: any) => req.status === 'approved') || dbEvent.mycsd_requests?.[0];
  const eventMycsd = mycsdRequest?.event_mycsd?.[0]; 
  const mycsdRecord = eventMycsd?.mycsd_records;
  const resolvedLevel = dbEvent.mycsd_level || eventMycsd?.event_level;
  const resolvedPoints = mycsdRecord?.mycsd_score ?? getPointsForLevel(resolvedLevel);

  // Use the proposal's submission time as the event creation time
  // Fallback to current time only if data is missing
  const createdDate = dbEvent.event_requests?.submitted_at || new Date().toISOString();

  return {
    id: dbEvent.event_id,
    title: dbEvent.event_name,
    description: dbEvent.event_description || '',
    venue: dbEvent.event_venue || '',
    startDate: dbEvent.event_date,
    endDate: dbEvent.end_date || dbEvent.event_date,
    startTime: dbEvent.start_time || '00:00',
    endTime: dbEvent.end_time || '23:59',
    capacity: dbEvent.capacity || 0,
    registeredCount: dbEvent.registered_count || 0,
    bannerImage: dbEvent.banner_image,
    category: (dbEvent.category as EventCategory) || 'other',
    organizerId: dbEvent.event_requests?.org_id || '',
    organizerName: dbEvent.event_requests?.organizations?.org_name || 'Unknown Organizer',
    
    participationFee: 0,
    hasMyCSD: dbEvent.has_mycsd ?? (!!mycsdRequest && mycsdRequest.status === 'approved'),
    mycsdCategory: (dbEvent.mycsd_category || eventMycsd?.mycsd_category) as MyCSDCategory,
    mycsdLevel: (dbEvent.mycsd_level || eventMycsd?.event_level) as MyCSDLevel,
    mycsdPoints: resolvedPoints,
    
    objectives: dbEvent.objectives || [],
    links: dbEvent.links || [],
    agenda: dbEvent.agenda || [],
    is_mycsd_claimed: dbEvent.is_mycsd_claimed || false,

    status: dbEvent.event_requests?.status || 'published',
    registrationDeadline: dbEvent.event_date,
    createdAt: createdDate, // Now using real data
    updatedAt: createdDate,
  };
};

export async function getEvents(filters?: {
  search?: string;
  category?: EventCategory[];
  hasMyCSD?: boolean;
  mycsdCategory?: MyCSDCategory[];
  mycsdLevel?: MyCSDLevel[];
}) {
  let query = supabase
    .from('events')
    .select(`
      *,
      event_requests (
        org_id,
        status,
        submitted_at, 
        organizations (
          org_name
        )
      ),
      mycsd_requests (
        status,
        event_mycsd (
          mycsd_category,
          event_level,
          mycsd_records (
            mycsd_score
          )
        )
      )
    `);

  if (filters?.search) {
    query = query.or(`event_name.ilike.%${filters.search}%,event_description.ilike.%${filters.search}%`);
  }

  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data.map(mapEvent);
}

export async function getEventById(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_requests (
        org_id,
        status,
        submitted_at,
        organizations (
          org_name
        )
      ),
      mycsd_requests (
        status,
        event_mycsd (
          mycsd_category,
          event_level,
          mycsd_records (
            mycsd_score
          )
        )
      )
    `)
    .eq('event_id', id)
    .single();

  if (error) {
    console.error('Error fetching event with joins:', error);
    return null;
  }

  return mapEvent(data);
}

export async function updateEventStatus(eventId: string, status: string) {
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('event_request_id')
    .eq('event_id', eventId)
    .single();

  if (fetchError || !event) throw fetchError || new Error('Event not found');

  const { error } = await supabase
    .from('event_requests')
    .update({ status })
    .eq('event_request_id', event.event_request_id);

  if (error) throw error;
}

export const getFilteredEvents = getEvents;

export async function updateEventByRequestId(requestId: string, updates: any) {
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('event_request_id', requestId);

  if (error) throw error;
}

export async function deleteEvent(eventId: string) {
  const { data: event, error: fetchError } = await supabase
    .from('events')
    .select('event_request_id')
    .eq('event_id', eventId)
    .single();
    
  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('event_requests')
    .update({ status: 'cancelled' })
    .eq('event_request_id', event.event_request_id);

  if (error) throw error;
}