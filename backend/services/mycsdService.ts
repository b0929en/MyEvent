import { supabase } from '../supabase/supabase';
import { MyCSDRecord, ClubPosition } from '@/types';

// Helper to calculate points based on level string
export function getPointsForLevel(level?: string): number {
  if (!level) return 2;
  const l = level.toLowerCase().trim();
  if (l.includes('antarab') || l.includes('antarabangsa')) return 8;
  if (l.includes('universit') || l.includes('negeri')) return 4;
  // P.Pengajian, Desasiswa, Persatuan, Kelab, Kampus and other local levels
  return 2;
}

export async function submitMyCSDClaim(eventId: string, documentUrl: string, level: string, category: string) {
  // 1. Get Event Details to find the organizer (user_id)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      event_requests (
        user_id
      )
    `)
    .eq('event_id', eventId)
    .single();

  if (eventError || !event) throw new Error('Event not found');

  // CRITICAL: Update the event with the organizer's proposed level/category
  // This ensures the admin sees the correct level before approving
  await supabase
    .from('events')
    .update({
      mycsd_level: level,
      mycsd_category: category
    })
    .eq('event_id', eventId);

  // 2. Check if a request already exists
  const { data: existingRequest } = await supabase
    .from('mycsd_requests')
    .select('mr_id')
    .eq('event_id', eventId)
    .single();

  if (existingRequest) {
    // Update existing request
    const { error } = await supabase
      .from('mycsd_requests')
      .update({
        lk_document: documentUrl,
        status: 'pending'
      })
      .eq('mr_id', existingRequest.mr_id);

    if (error) throw error;
  } else {
    // Handle potential array response for event_requests
    const eventRequest = Array.isArray(event.event_requests)
      ? event.event_requests[0]
      : event.event_requests;

    const userId = eventRequest?.user_id;

    // Create new request
    const { error } = await supabase
      .from('mycsd_requests')
      .insert({
        event_id: eventId,
        user_id: userId,
        lk_document: documentUrl,
        status: 'pending'
      });

    if (error) throw error;
  }
}

export async function approveMyCSDRequest(requestId: string) {
  // 1. Get Request Details
  const { data: request, error: reqError } = await supabase
    .from('mycsd_requests')
    .select(`
      *,
      events (
        *,
        event_requests (
          org_id
        )
      )
    `)
    .eq('mr_id', requestId)
    .single();

  if (reqError || !request) throw new Error('Request not found');
  const event = request.events;

  // 2. Create/Get MyCSD Record & Event MyCSD
  // Determine fixed points based on event level stored in the events table
  const points = getPointsForLevel(event.mycsd_level || 'kampus');

  const { data: record, error: recordError } = await supabase
    .from('mycsd_records')
    .insert({
      mycsd_score: points,
      mycsd_type: 'event'
    })
    .select()
    .single();

  if (recordError) throw recordError;

  // Link to event_mycsd
  const { error: linkError } = await supabase
    .from('event_mycsd')
    .insert({
      record_id: record.record_id,
      mycsd_category: event.mycsd_category || 'REKA CIPTA DAN INOVASI', // Fallback
      event_level: event.mycsd_level || 'kampus',
      mr_id: requestId
    });

  if (linkError) throw linkError;

  // 3. Get Present Participants
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select(`
      user_id,
      attendance,
      users (
        students (matric_num)
      )
    `)
    .eq('event_id', event.event_id)
    .eq('attendance', 'present');

  if (regError) throw regError;

  // 4. Distribute Points (Insert into mycsd_logs)
  if (registrations && registrations.length > 0) {
    const logsToInsert = registrations
      .filter((reg: any) => reg.users?.students?.matric_num)
      .map((reg: any) => ({
        matric_no: reg.users.students.matric_num,
        record_id: record.record_id,
        score: points,
        position: 'Participant'
      }));

    if (logsToInsert.length > 0) {
      const { error: logError } = await supabase
        .from('mycsd_logs')
        .insert(logsToInsert);

      if (logError) throw logError;
    }

    // 5. Send Notifications
    const notifications = registrations.map((reg: any) => ({
      user_id: reg.user_id,
      type: 'mycsd',
      title: 'MyCSD Points Awarded',
      message: `You have received ${points} MyCSD points for attending ${event.event_name}.`,
      link: '/profile'
    }));

    await supabase.from('notifications').insert(notifications);
  }

  // 6. Update Request Status & Event Claimed Status
  await supabase
    .from('mycsd_requests')
    .update({ status: 'approved' })
    .eq('mr_id', requestId);

  await supabase
    .from('events')
    .update({ is_mycsd_claimed: true, mycsd_points: points })
    .eq('event_id', event.event_id);
}

export async function getAllMyCSDRequests() {
  const { data, error } = await supabase
    .from('mycsd_requests')
    .select(`
      *,
      users (
        user_name,
        user_email
      ),
      events (
        event_name,
        category,
        mycsd_level,    
        mycsd_category,
        event_requests (
          organizations (
            org_name
          )
        )
      ),
      event_mycsd (
        event_level,
        mycsd_category,
        mycsd_records (
          mycsd_score
        )
      )
    `);

  if (error) {
    console.error('Error fetching mycsd requests:', error);
    return [];
  }

  // Use Promise.all to fetch counts for all requests in parallel
  const requestsWithCounts = await Promise.all(data.map(async (req: any) => {
    const event = req.events;
    // For pending requests, event_mycsd is empty. We must fallback to the event table data.
    const eventMycsd = req.event_mycsd?.[0];
    const record = eventMycsd?.mycsd_records;

    const displayLevel = eventMycsd?.event_level || event?.mycsd_level || 'kampus';
    const displayCategory = eventMycsd?.mycsd_category || event?.mycsd_category || 'REKA CIPTA DAN INOVASI';

    let displayPoints = 0;
    if (record?.mycsd_score) {
      displayPoints = record.mycsd_score;
    } else {
      displayPoints = getPointsForLevel(displayLevel);
    }

    // Fetch participant count (present)
    const { count: participantCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', req.event_id)
      .eq('attendance', 'present');

    // Fetch committee count (Mocked for now as schema doesn't explicit support it)
    // In future, this could be fetched from a committee table or specific roles
    const committeeCount = 0;

    return {
      id: req.mr_id,
      userId: req.user_id,
      userName: req.users?.user_name || 'Unknown User',
      userEmail: req.users?.user_email || '',
      eventId: req.event_id,
      eventName: event?.event_name || 'Unknown Event',
      organizerName: event?.event_requests?.organizations?.org_name || 'Unknown Org',
      category: displayCategory,
      level: displayLevel,
      points: displayPoints,
      role: 'participant',
      status: req.status,
      proofDocument: req.lk_document,
      participantCount: participantCount || 0,
      committeeCount: committeeCount,
      submittedAt: req.created_at || new Date().toISOString(), // Use DB created_at if available? fallback to now
      updatedAt: new Date().toISOString(),
    };
  }));

  return requestsWithCounts;
}

export async function updateMyCSDRequestStatus(requestId: string, status: string) {
  const { error } = await supabase
    .from('mycsd_requests')
    .update({ status })
    .eq('mr_id', requestId);

  if (error) throw error;
}

export async function getUserMyCSDRecords(userId: string): Promise<MyCSDRecord[]> {
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('matric_num')
    .eq('user_id', userId)
    .single();

  if (studentError || !studentData) return [];

  const matricNum = studentData.matric_num;

  const { data, error } = await supabase
    .from('mycsd_logs')
    .select(`
      *,
      mycsd_records (
        *,
        event_mycsd (
          *,
          mycsd_requests (
            events (
              event_id,
              event_name,
              event_requests (
                organizations (
                  org_name
                )
              )
            )
          )
        )
      )
    `)
    .eq('matric_no', matricNum);

  if (error) {
    console.error('Error fetching mycsd logs:', error);
    return [];
  }

  return data.map((log: any) => {
    const eventMycsd = log.mycsd_records?.event_mycsd;
    const event = eventMycsd?.mycsd_requests?.events;
    const organization = event?.event_requests?.organizations;

    return {
      id: log.record_id,
      userId: userId,
      eventId: event?.event_id || '',
      eventName: event?.event_name || 'Unknown Event',
      organizationName: organization?.org_name || 'Unknown Organization',
      category: eventMycsd?.mycsd_category || 'REKA CIPTA DAN INOVASI',
      level: eventMycsd?.event_level || 'kampus',
      role: log.position,
      points: log.score,
      semester: '2024/2025-1',
      status: 'approved',
      submittedAt: new Date().toISOString(),
    };
  });
}

export async function getUserClubPositions(userId: string): Promise<ClubPosition[]> {
  return [];
}

export function calculateMyCSDSummary(userId: string, records: MyCSDRecord[], positions: ClubPosition[]) {
  const totalPoints = records
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.points, 0) +
    positions.reduce((sum, p) => sum + p.points, 0);

  const totalEvents = records.length;

  const pointsByCategory: Record<string, number> = {
    'REKA CIPTA DAN INOVASI': 0,
    'KEUSAHAWAN': 0,
    'KEBUDAYAAN': 0,
    'SUKAN/REKREASI/SOSIALISASI': 0,
    'KEPIMPINAN': 0,
  };

  records.forEach(record => {
    if (record.status === 'approved' && record.category) {
      pointsByCategory[record.category] = (pointsByCategory[record.category] || 0) + record.points;
    }
  });

  const pointsByLevel: Record<string, number> = {
    antarabangsa: 0,
    negeri_universiti: 0,
    kampus: 0,
  };

  records.forEach(record => {
    if (record.status === 'approved' && record.level) {
      pointsByLevel[record.level] = (pointsByLevel[record.level] || 0) + record.points;
    }
  });

  return {
    totalPoints,
    totalEvents,
    pointsByCategory,
    pointsByLevel,
    eventsThisMonth: 0, // Mock
    pointsThisMonth: 0, // Mock
  };
}