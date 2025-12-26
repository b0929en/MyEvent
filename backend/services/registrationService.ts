import { supabase } from '../supabase/supabase';
import { Registration, RegistrationStatus } from '@/types';

const mapRegistration = (dbReg: any): Registration => {
  return {
    id: `${dbReg.event_id}-${dbReg.user_id}`,
    eventId: dbReg.event_id,
    userId: dbReg.user_id,
    userName: dbReg.users?.user_name || 'Unknown',
    userEmail: dbReg.users?.user_email || '',
    matricNumber: dbReg.users?.students?.matric_num,
    status: (dbReg.attendance === 'present' ? 'attended' : 'confirmed') as RegistrationStatus,
    registeredAt: dbReg.registration_date,
    updatedAt: dbReg.registration_date,
  };
};

export async function getUserRegistrations(userId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      users (
        user_name,
        user_email,
        students (matric_num)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching registrations with joins:', error);
    
    // Fallback
    const { data: simpleData, error: simpleError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', userId);

    if (simpleError) {
        console.error('Error fetching registrations simple:', simpleError);
        throw simpleError;
    }
    return simpleData.map(mapRegistration);
  }

  return data.map(mapRegistration);
}

export async function getEventRegistrations(eventId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      users (
        user_name,
        user_email,
        students (matric_num)
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event registrations:', error);
    return [];
  }

  return data.map(mapRegistration);
}

export async function getAllRegistrations() {
    const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      users (
        user_name,
        user_email,
        students (matric_num)
      )
    `);

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return data.map(mapRegistration);
}

export async function createRegistration(registration: Partial<Registration>) {
  const { data, error } = await supabase
    .from('registrations')
    .insert({
        event_id: registration.eventId,
        user_id: registration.userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating registration:', error);
    throw error;
  }

  return data;
}
