
import { supabase } from '../supabase/supabase';
import { ProposalStatus } from '@/types';

export interface Proposal {
  id: string;
  organizerId: string;
  organizerName: string;
  eventTitle: string; // Note: event_requests doesn't have a title column in schema, might need to join with events or check if I missed it.
  // Wait, looking at schema.sql, event_requests DOES NOT have a title. 
  // But events table has event_request_id.
  // So a proposal is usually created BEFORE an event? Or does the event request contain the details?
  // In the schema, 'events' table has 'event_request_id'.
  // This implies the event is created and linked to the request.
  // However, usually a proposal comes with details.
  // Let's check if 'events' are created when a proposal is submitted.
  // If so, we can join 'events' on 'event_request_id'.
  
  eventDescription: string;
  category: string;
  estimatedParticipants: number;
  proposedDate: string;
  proposedVenue: string;
  documents: {
    eventProposal: string;
  };
  status: ProposalStatus;
  submittedAt: string;
  updatedAt: string;
}

export async function getAllProposals() {
  // We need to join with events to get the details, assuming an event record is created for the proposal
  // OR the proposal details should be in event_requests.
  // In the current schema, event_requests only has file, org_id, user_id.
  // It seems the 'events' table holds the data even for proposals?
  // Let's check seed.sql to see how they are linked.
  
  const { data, error } = await supabase
    .from('event_requests')
    .select(`
      *,
      organizations (
        org_name
      ),
      events (
        event_name,
        event_description,
        category,
        capacity,
        event_date,
        event_venue
      )
    `);

  if (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }

  return data.map((item: any) => {
    const event = item.events?.[0] || {}; // Assuming one-to-one or one-to-many
    
    return {
      id: item.event_request_id,
      organizerId: item.org_id,
      organizerName: item.organizations?.org_name || 'Unknown',
      eventTitle: event.event_name || 'Untitled Proposal',
      eventDescription: event.event_description || '',
      category: event.category || 'other',
      estimatedParticipants: event.capacity || 0,
      proposedDate: event.event_date,
      proposedVenue: event.event_venue,
      documents: {
        eventProposal: item.event_request_file || '',
      },
      status: item.status,
      submittedAt: item.submitted_at,
      updatedAt: item.submitted_at, // Schema doesn't have updated_at
    };
  });
}

export async function updateProposalStatus(id: string, status: string) {
  const { error } = await supabase
    .from('event_requests')
    .update({ status })
    .eq('event_request_id', id);

  if (error) throw error;
}

export async function createProposal(proposalData: any) {
  // 1. Get Org ID for the user
  const { data: orgAdmin, error: orgError } = await supabase
    .from('organization_admins')
    .select('org_id')
    .eq('user_id', proposalData.organizerId)
    .single();

  if (orgError || !orgAdmin) {
    console.error('Organization Admin check failed:', orgError);
    throw new Error('User is not an organization admin');
  }

  // 2. Create Event Request
  const { data: request, error: reqError } = await supabase
    .from('event_requests')
    .insert({
      org_id: orgAdmin.org_id,
      user_id: proposalData.organizerId,
      event_request_file: proposalData.documents.eventProposal, // Storing filename for now
      status: 'pending'
    })
    .select()
    .single();

  if (reqError) throw reqError;

  // 3. Create Event linked to Request
  const { error: eventError } = await supabase
    .from('events')
    .insert({
      event_name: proposalData.eventTitle,
      event_description: proposalData.eventDescription,
      event_date: proposalData.proposedDate,
      event_venue: proposalData.proposedVenue,
      category: proposalData.category,
      capacity: proposalData.estimatedParticipants,
      event_request_id: request.event_request_id
    });

  if (eventError) {
    // Rollback request if event creation fails (manual rollback)
    await supabase.from('event_requests').delete().eq('event_request_id', request.event_request_id);
    throw eventError;
  }

  return request;
}

export async function getProposalById(id: string) {
  const { data, error } = await supabase
    .from('event_requests')
    .select(`
      *,
      organizations (
        org_name
      ),
      events (
        event_name,
        event_description,
        category,
        capacity,
        event_date,
        event_venue
      )
    `)
    .eq('event_request_id', id)
    .single();

  if (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }

  const event = data.events?.[0] || {};
  
  return {
    id: data.event_request_id,
    organizerId: data.org_id,
    organizerName: data.organizations?.org_name || 'Unknown',
    eventTitle: event.event_name || 'Untitled Proposal',
    eventDescription: event.event_description || '',
    category: event.category || 'other',
    estimatedParticipants: event.capacity || 0,
    proposedDate: event.event_date,
    proposedVenue: event.event_venue,
    documents: {
      eventProposal: data.event_request_file || '',
    },
    status: data.status,
    submittedAt: data.submitted_at,
    updatedAt: data.submitted_at,
  };
}
