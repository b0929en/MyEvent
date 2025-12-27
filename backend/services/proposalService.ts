import { supabase } from '../supabase/supabase';
import { ProposalStatus } from '@/types';

export interface Proposal {
  id: string;
  organizerId: string;
  organizerName: string;
  eventTitle: string;
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
    // Reverted to original loose coupling (|| {})
    const event = item.events?.[0] || {};
    
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
      // Fix: Map 'published' status (from DB) to 'approved' (for Frontend)
      // This ensures proposals for published events show up in the Approved tab
      status: item.status,
      submittedAt: item.submitted_at,
      updatedAt: item.submitted_at,
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
      event_request_file: proposalData.documents.eventProposal,
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
    // Rollback request if event creation fails
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

  // Reverted to original loose coupling
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
    // Fix: Map 'published' status to 'approved' here as well
    status: data.status === 'published' ? 'approved' : data.status,
    submittedAt: data.submitted_at,
    updatedAt: data.submitted_at,
  };
}