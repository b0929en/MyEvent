import { supabase } from '../supabase/supabase';
import { ProposalStatus } from '@/types';
import { createNotification } from './notificationService';

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
    budgetPlan?: string;
    riskAssessment?: string;
    supportingDocuments?: string;
  };
  status: ProposalStatus;
  adminNotes?: string;
  submittedAt: string;
  updatedAt: string;
}

// Helper to safely parse document paths
const parseDocuments = (fileString: string | null) => {
  if (!fileString) {
    return { eventProposal: '' };
  }
  try {
    // Try parsing as JSON (New format with multiple files)
    const docs = JSON.parse(fileString);
    return {
      eventProposal: docs.eventProposal || '',
      budgetPlan: docs.budgetPlan || '',
      riskAssessment: docs.riskAssessment || '',
      supportingDocuments: docs.supportingDocuments || ''
    };
  } catch (e) {
    // Fallback: It's a legacy single string (Old format)
    return {
      eventProposal: fileString,
    };
  }
};

export async function getAllProposals() {
  const { data, error } = await supabase
    .from('event_requests')
    .select(`
      *,
      organizations ( org_name ),
      events ( event_name, event_description, category, capacity, event_date, event_venue )
    `);

  if (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }

  return data.map((item: any) => {
    const event = Array.isArray(item.events) ? item.events[0] : item.events;
    
    return {
      id: item.event_request_id,
      organizerId: item.org_id,
      organizerName: item.organizations?.org_name || 'Unknown',
      eventTitle: event?.event_name || 'Untitled Proposal',
      eventDescription: event?.event_description || '',
      category: event?.category || 'other',
      estimatedParticipants: event?.capacity || 0,
      proposedDate: event?.event_date,
      proposedVenue: event?.event_venue,
      // FIXED: Use parser here
      documents: parseDocuments(item.event_request_file),
      status: item.status,
      adminNotes: item.admin_notes || '',
      submittedAt: item.submitted_at,
      updatedAt: item.submitted_at,
    };
  });
}

export async function updateProposalStatus(id: string, status: string, adminNotes?: string) {
  const updates: any = { status };
  if (adminNotes !== undefined) updates.admin_notes = adminNotes;

  const { error } = await supabase.from('event_requests').update(updates).eq('event_request_id', id);
  if (error) throw error;

  // Notification Logic
  if (status === 'approved' || status === 'revision_needed' || status === 'rejected') {
    try {
      const { data: request } = await supabase
        .from('event_requests')
        .select(`user_id, events ( event_id, event_name )`)
        .eq('event_request_id', id)
        .single();
      
      if (request) {
        const event = Array.isArray(request.events) ? request.events[0] : request.events;
        await createNotification({
          userId: request.user_id,
          type: 'event', 
          title: status === 'approved' ? `Event Published: ${event?.event_name}` : `Proposal Update: ${event?.event_name}`,
          message: status === 'approved' 
            ? `Your proposal has been approved.` 
            : (status === 'revision_needed' ? `Revision requested: ${adminNotes}` : `Rejected: ${adminNotes}`),
          link: status === 'approved' ? `/events/${event?.event_id}` : '/organizer/dashboard'
        });
      }
    } catch (e) { console.error('Notify error', e); }
  }
}

export async function createProposal(proposalData: any) {
  const { data: orgAdmin, error: orgError } = await supabase
    .from('organization_admins')
    .select('org_id')
    .eq('user_id', proposalData.organizerId)
    .single();

  if (orgError || !orgAdmin) throw new Error('User is not an organization admin');

  // FIXED: Serialize documents object to string
  const documentsJSON = JSON.stringify(proposalData.documents);

  const { data: request, error: reqError } = await supabase
    .from('event_requests')
    .insert({
      org_id: orgAdmin.org_id,
      user_id: proposalData.organizerId,
      event_request_file: documentsJSON, // Store JSON string
      status: 'pending'
    })
    .select()
    .single();

  if (reqError) throw reqError;

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
    await supabase.from('event_requests').delete().eq('event_request_id', request.event_request_id);
    throw eventError;
  }
  return request;
}

export async function updateProposal(id: string, proposalData: any) {
  const requestUpdates: any = { status: 'pending' };
  
  if (proposalData.documents) {
    requestUpdates.event_request_file = JSON.stringify(proposalData.documents);
  }

  const { error: reqError } = await supabase
    .from('event_requests')
    .update(requestUpdates)
    .eq('event_request_id', id);

  if (reqError) throw reqError;

  const { data: eventData } = await supabase.from('events').select('event_id').eq('event_request_id', id).single();
  
  if (eventData) {
    await supabase
      .from('events')
      .update({
        event_name: proposalData.eventTitle,
        event_description: proposalData.eventDescription,
        event_date: proposalData.proposedDate,
        event_venue: proposalData.proposedVenue,
        category: proposalData.category,
        capacity: proposalData.estimatedParticipants,
      })
      .eq('event_id', eventData.event_id);
  }
}

export async function getProposalById(id: string) {
  const { data, error } = await supabase
    .from('event_requests')
    .select(`
      *,
      organizations ( org_name ),
      events ( event_name, event_description, category, capacity, event_date, event_venue )
    `)
    .eq('event_request_id', id)
    .single();

  if (error) return null;

  const event = Array.isArray(data.events) ? data.events[0] : data.events;
  
  return {
    id: data.event_request_id,
    organizerId: data.org_id,
    organizerName: data.organizations?.org_name || 'Unknown',
    eventTitle: event?.event_name || 'Untitled Proposal',
    eventDescription: event?.event_description || '',
    category: event?.category || 'other',
    estimatedParticipants: event?.capacity || 0,
    proposedDate: event?.event_date,
    proposedVenue: event?.event_venue,
    // FIXED: Use parser
    documents: parseDocuments(data.event_request_file), 
    status: data.status,
    adminNotes: data.admin_notes || '',
    submittedAt: data.submitted_at,
    updatedAt: data.submitted_at,
  };
}