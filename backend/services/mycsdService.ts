import { supabase } from '../supabase/supabase';
import { MyCSDRecord, ClubPosition } from '@/types';

export async function getUserMyCSDRecords(userId: string): Promise<MyCSDRecord[]> {
  // First get matric_num for the user
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
      category: eventMycsd?.event_type || 'other',
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
    teras: 0,
    baruna: 0,
    advance: 0,
    labels: 0,
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
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const eventsThisMonth = records.filter(record => {
    const date = new Date(record.submittedAt);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  const pointsThisMonth = records
    .filter(record => {
      const date = new Date(record.submittedAt);
      return date.getMonth() === currentMonth && 
             date.getFullYear() === currentYear &&
             record.status === 'approved';
    })
    .reduce((sum, r) => sum + r.points, 0);
  
  return {
    totalPoints,
    totalEvents,
    pointsByCategory,
    pointsByLevel,
    eventsThisMonth,
    pointsThisMonth,
  };
}
