import { supabase } from '../supabase/supabase';
import { MyCSDRecord, ClubPosition } from '@/types';

// Helper to calculate points based on level string
// Helper to calculate points based on level and role
export function calculateMyCSDPoints(level: string, role: string): number {
  const l = level.toLowerCase().trim();
  const r = role.toLowerCase().trim();

  // 1. ANTABANGSA
  if (l === 'antarabangsa' || l.includes('antarabangsa')) {
    if (r === 'pengarah') return 24;
    if (r === 'ajk_tertinggi') return 24;
    if (r === 'pengarah_ajk_tertinggi' || r.includes('pengarah') || r.includes('tertinggi')) return 24;
    if (r === 'ajk_kecil' || r.includes('ajk')) return 16;
    if (r === 'peserta') return 8;
    if (r === 'pengikut') return 4;
    return 8;
  }

  // 2. KEBANGSAAN / ANTARA UNIVERSITI
  if (l === 'kebangsaan / antara university' || l === 'kebangsaan / antara university'.toLowerCase() || l.includes('kebangsaan') || (l.includes('antara') && !l.includes('antarabangsa'))) {
    if (r === 'pengarah') return 18;
    if (r === 'ajk_tertinggi') return 18;
    if (r === 'pengarah_ajk_tertinggi' || r.includes('pengarah') || r.includes('tertinggi')) return 18;
    if (r === 'ajk_kecil' || r.includes('ajk')) return 12;
    if (r === 'peserta') return 6;
    if (r === 'pengikut') return 3;
    return 6;
  }

  // 3. NEGERI / UNIVERSITI
  if (l === 'negeri / universiti' || l.includes('negeri') || l.includes('universiti')) {
    if (r === 'pengarah') return 12;
    if (r === 'ajk_tertinggi') return 12;
    if (r === 'pengarah_ajk_tertinggi' || r.includes('pengarah') || r.includes('tertinggi')) return 12;
    if (r === 'ajk_kecil' || r.includes('ajk')) return 8;
    if (r === 'peserta') return 4;
    if (r === 'pengikut') return 2;
    return 4;
  }

  // 4. P.Pengajian / Desasiswa / Persatuan / Kelab
  if (r === 'pengarah') return 6;
  if (r === 'ajk_tertinggi') return 6;
  if (r === 'pengarah_ajk_tertinggi' || r.includes('pengarah') || r.includes('tertinggi')) return 6;
  if (r === 'ajk_kecil' || r.includes('ajk')) return 4;
  if (r === 'peserta') return 2;
  return 1;
}

export function getPointsForLevel(level?: string): number {
  return calculateMyCSDPoints(level || 'P.Pengajian / Desasiswa / Persatuan / Kelab', 'peserta');
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
    .select('*')
    .eq('event_id', eventId)
    .single();

  if (existingRequest) {
    // STRICT RULE: No resubmission allows if rejected or pending.
    // If it's already approved, no need to submit again anyway.
    if (existingRequest.status === 'rejected') {
      throw new Error('This Laporan Kejayaan has been rejected. Resubmission is not allowed.');
    }
    if (existingRequest.status === 'pending' || existingRequest.status === 'approved') {
      throw new Error('Laporan Kejayaan has already been submitted for this event.');
    }
  }

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
      status: 'pending',
      submitted_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function approveMyCSDRequest(requestId: string, committeeRoles?: Record<string, string>) {
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
  const eventLevel = event.mycsd_level || 'kampus';
  const participantPoints = calculateMyCSDPoints(eventLevel, 'peserta');

  const { data: record, error: recordError } = await supabase
    .from('mycsd_records')
    .insert({
      mycsd_score: participantPoints,
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
  // Identify committee members to exclude them from the 'Peserta' list (Committee role takes precedence)
  const committeeMatrics = new Set<string>();
  if (event.committee_members && Array.isArray(event.committee_members)) {
    event.committee_members.forEach((m: any) => {
      if (m.matricNumber) committeeMatrics.add(String(m.matricNumber).trim());
    });
  }

  if (registrations && registrations.length > 0) {
    const logsToInsert = registrations
      .filter((reg: any) => {
        const matric = reg.users?.students?.matric_num;
        // Ensure we compare trimmed strings
        return matric && !committeeMatrics.has(String(matric).trim());
      })
      .map((reg: any) => ({
        matric_no: String(reg.users.students.matric_num).trim(),
        record_id: record.record_id,
        score: participantPoints,
        position: 'Peserta'
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
      message: `You have received ${participantPoints} MyCSD points for attending ${event.event_name}.`,
      link: '/profile'
    }));

    // Attempt to send notifications, non-blocking
    supabase.from('notifications').insert(notifications);
  }

  // 5.5 Distribute Points to Committee Members
  if (event.committee_members && Array.isArray(event.committee_members)) {
    const committeeLogs = event.committee_members.map((member: any) => {
      const trimmedMatric = String(member.matricNumber).trim();
      // Get role from admin selection or fallback to original position, then default to 'ajk_kecil'
      const assignedRole = committeeRoles?.[trimmedMatric] || member.position || 'ajk_kecil';
      const points = calculateMyCSDPoints(eventLevel, assignedRole);

      let displayPosition = 'Peserta';
      if (assignedRole === 'pengarah') displayPosition = 'Pengarah';
      else if (assignedRole === 'ajk_tertinggi') displayPosition = 'AJK Tertinggi';
      else if (assignedRole === 'ajk_kecil') displayPosition = 'AJK Kecil';
      else if (assignedRole === 'pengikut') displayPosition = 'Pengikut';

      return {
        matric_no: trimmedMatric,
        record_id: record.record_id,
        score: points,
        position: displayPosition
      };
    });

    if (committeeLogs.length > 0) {
      // Use upsert to be safe, though filtering above should prevent conflict
      const { error: comLogError } = await supabase
        .from('mycsd_logs')
        .upsert(committeeLogs, { onConflict: 'matric_no, record_id' });

      if (comLogError) console.error('Error inserting committee logs', comLogError);
    }
  }

  // 6. Update Request Status & Event Claimed Status
  await supabase
    .from('mycsd_requests')
    .update({ status: 'approved' })
    .eq('mr_id', requestId);

  await supabase
    .from('events')
    .update({ is_mycsd_claimed: true, mycsd_points: participantPoints })
    .eq('event_id', event.event_id);
}

export async function rejectMyCSDRequest(requestId: string, reason: string) {
  if (!reason || reason.trim() === '') {
    throw new Error('Rejection reason is compulsory.');
  }

  const { error } = await supabase
    .from('mycsd_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('mr_id', requestId);

  if (error) throw error;
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
        committee_members,
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

    // Fetch committee members
    const committeeMembers = event?.committee_members || [];
    const committeeCount = committeeMembers.length;

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
      committeeMembers: committeeMembers,
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
  // 1. Get Student Matric Number
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('matric_num')
    .eq('user_id', userId)
    .single();

  if (studentError || !studentData) return [];
  const matricNum = studentData.matric_num;

  // 2. Get All Events Attended by the Student (Present)
  // We fetch registrations where attendance = 'present'
  const { data: registrations, error: regError } = await supabase
    .from('registrations')
    .select(`
      event_id,
      events (
        event_id,
        event_name,
        mycsd_level,
        mycsd_category,
        mycsd_points,
        event_requests (
          organizations (
            org_name
          )
        ),
        mycsd_requests (
          mr_id,
          status,
          rejection_reason,
          submitted_at,
          event_mycsd (
            event_level,
            mycsd_category,
             mycsd_records (
               record_id,
               mycsd_score
             )
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('attendance', 'present');

  if (regError) {
    console.error('Error fetching registrations:', regError);
    return [];
  }

  // 2.2 Get MyCSD Logs (Correct Approved Position & Score)
  const { data: csdLogs, error: logError } = await supabase
    .from('mycsd_logs')
    .select('record_id, score, position, mycsd_records(event_mycsd(mr_id, mycsd_requests(event_id)))')
    .eq('matric_no', matricNum);

  const logsMap = new Map();
  if (csdLogs) {
    csdLogs.forEach((log: any) => {
      // We need to map logs back to event_id. 
      // Path: log -> record -> event_mycsd -> request -> event_id
      // This is deep. 
      // Alternative: The log has record_id. In step 3, we can try to match record_id if available.
      // But record_id is only available if we fetch it via event->mycsd_request->...
      // Let's store by record_id for easy lookup later
      logsMap.set(log.record_id, log);
    });
  }

  // 2.5 Get Events where Student is a Committee Member
  // We need to query events where the committee_members JSONB column contains an object with this matric number.
  // Note: Using `contains` for JSONB. Structure is [{ matricNumber: "..." }, ...]
  // We need to be careful with the structure. The committee_members is an array of objects.

  const { data: committeeEvents, error: committeeError } = await supabase
    .from('events')
    .select(`
      event_id,
      event_name,
      mycsd_level,
      mycsd_category,
      mycsd_points,
      committee_members,
      event_requests (
        organizations (
          org_name
        )
      ),
      mycsd_requests (
        mr_id,
        status,
        rejection_reason,
        submitted_at,
        event_mycsd (
          event_level,
          mycsd_category,
           mycsd_records (
             record_id,
             mycsd_score
           )
        )
      )
    `)
    // Ideally we use .contains, but Supabase JS filter for JSON array containing object matches on subset of keys.
    // Let's try to fetch relevant ones or just client side filter if volume is low, but better to filter DB side.
    // However, since we don't have a normalized committee table, we might have to fetch recent events or similar.
    // For now, let's try a text search on the JSON column as a workaround or fetch all and filter if dataset is small.
    // Better approach: Since we can't easily do deep array filter in standard REST easily without proper index or RPC,
    // we'll try to rely on a "contains" filter if the structure is consistent, 
    // OR we just fetch all events (bad). 
    // actually, let's assume we can filter by `committee_members` not being null, and then filter in JS for this user.
    // It's not efficient for production at scale but works for MVP.
    // A better approach would be to have a separate table for committee members.
    .not('committee_members', 'is', null);

  // Filter committee events for this student
  const myCommitteeEvents = (committeeEvents || []).filter((evt: any) => {
    const members = evt.committee_members;
    if (Array.isArray(members)) {
      return members.some((m: any) => String(m.matricNumber).trim() === matricNum.trim());
    }
    return false;
  }).map((evt: any) => {
    // Shape it similar to registration event structure to reuse mapping logic
    return { events: evt };
  });

  // Merge (deduplicate based on event_id)
  const allRecords = [...registrations, ...myCommitteeEvents];
  const uniqueRecordsMap = new Map();

  allRecords.forEach((item: any) => {
    if (item.events && !uniqueRecordsMap.has(item.events.event_id)) {
      uniqueRecordsMap.set(item.events.event_id, item);
    }
  });

  const uniqueRegistrations = Array.from(uniqueRecordsMap.values());

  // 3. Map to MyCSDRecord format
  return uniqueRegistrations.map((reg: any) => {
    const event = reg.events;
    // Sort mycsd_requests by submitted_at desc
    const requests = event.mycsd_requests || [];
    requests.sort((a: any, b: any) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());

    // We take the approved one or the latest one
    const mycsdRequest = requests.find((r: any) => r.status === 'approved') || requests[0];
    const eventMycsd = mycsdRequest?.event_mycsd?.[0];
    const organization = event?.event_requests?.organizations;

    // Determine Status
    let status: 'waiting_for_report' | 'pending_approval' | 'approved' | 'rejected' = 'waiting_for_report'; // Default: waiting for organizer
    let rejectionReason = '';

    if (mycsdRequest) {
      if (mycsdRequest.status === 'approved') {
        status = 'approved';
      } else if (mycsdRequest.status === 'rejected') {
        status = 'rejected';
        rejectionReason = mycsdRequest.rejection_reason;
      } else {
        status = 'pending_approval'; // Submitted by organizer, waiting for admin
      }
    }

    // Determine Points
    let points = 0;
    if (status === 'approved') {
      // Only show points if approved
      const record = eventMycsd?.mycsd_records;
      points = record?.mycsd_score || event.mycsd_points || 0;
    } else {
      // Show estimated points in the record so users can see what they WILL get.
      // The summary calculation ensures these are not added to the total.
      const displayLevel = eventMycsd?.event_level || event.mycsd_level || 'kampus';
      points = getPointsForLevel(displayLevel);
    }

    // Determine Role & Position
    let role: 'participant' | 'committee' | 'organizer' = 'participant';
    let position = 'Peserta';

    // Check if user is in committee list
    const committeeList = event.committee_members;
    if (Array.isArray(committeeList)) {
      const committeeMember = committeeList.find((m: any) => String(m.matricNumber).trim() === matricNum.trim());
      if (committeeMember) {
        role = 'committee';
        // Map backend position code to display text
        const posCode = committeeMember.position || 'ajk_kecil';
        if (posCode === 'pengarah') position = 'Pengarah';
        else if (posCode === 'ajk_tertinggi') position = 'AJK Tertinggi';
        else if (posCode === 'ajk_kecil') position = 'AJK Kecil';
        else if (posCode === 'pengikut') position = 'Pengikut';
        else position = posCode.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

        // Recalculate estimated points based on role if not approved yet
        if (status !== 'approved') {
          const displayLevel = eventMycsd?.event_level || event.mycsd_level || 'kampus';
          points = calculateMyCSDPoints(displayLevel, posCode);
        }
      }
    }

    // OVERRIDE: If Approved, use the OFFICIAL position and score from mycsd_logs
    if (status === 'approved') {
      // We need the record_id. 
      // record -> eventMycsd -> mycsd_records
      const recordId = eventMycsd?.mycsd_records?.record_id;
      if (recordId && logsMap.has(recordId)) {
        const log = logsMap.get(recordId);
        points = log.score;
        position = log.position || position;
        // If position suggests committee, ensure role is committee
        if (['Pengarah', 'AJK Tertinggi', 'AJK Kecil', 'Pengikut'].some(p => position.includes(p))) {
          role = 'committee';
        }
      }
    }

    // Force "-" if not approved, per user request
    if (status !== 'approved') {
      points = '-' as any;
      position = '-';
    }

    return {
      id: event.event_id, // Use Event ID as unique key if record_id doesn't exist yet
      userId: userId,
      eventId: event.event_id,
      eventName: event.event_name,
      organizationName: organization?.org_name || 'Unknown Organization',
      category: eventMycsd?.mycsd_category || event.mycsd_category || 'REKA CIPTA DAN INOVASI',
      level: eventMycsd?.event_level || event.mycsd_level || 'kampus',
      role: role as any,
      position: position as any,
      points: points,
      semester: '2024/2025-1', // Placeholder or calculate based on date
      status: status,
      rejectionReason: rejectionReason,
      submittedAt: mycsdRequest?.submitted_at || new Date().toISOString(),
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