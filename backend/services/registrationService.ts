import { supabase } from '../supabase/supabase';
import { Registration, RegistrationStatus, DBRegistration, PaymentStatus } from '@/types';

// Map DB registration to frontend type
const mapRegistration = (dbReg: DBRegistration & { payments?: any[] }): Registration => {
  // Determine status based on event_status (primary) or attendance
  let status: RegistrationStatus = 'confirmed';

  if (dbReg.event_status) {
    // If event_status is used, map it
    if (dbReg.event_status === 'pending') status = 'pending';
    else if (dbReg.event_status === 'approved') status = 'confirmed';
    else if (dbReg.event_status === 'rejected') status = 'cancelled';
  } else {
    // Fallback or legacy logic
    status = dbReg.attendance === 'present' ? 'attended' : 'confirmed';
  }

  // Override if attended
  if (dbReg.attendance === 'present') status = 'attended';

  // Get payment info if available (joined manually or via query)
  const payment = dbReg.payments?.[0]; // Assuming one active payment per registration for now

  return {
    id: `${dbReg.event_id}-${dbReg.user_id}`,
    eventId: dbReg.event_id,
    userId: dbReg.user_id,
    userName: dbReg.users?.user_name || 'Unknown',
    userEmail: dbReg.users?.user_email || '',
    matricNumber: dbReg.users?.students?.matric_num,
    faculty: dbReg.users?.students?.faculty || '',
    status: status,
    paymentStatus: payment ? (payment.payment_status as PaymentStatus) : undefined,
    paymentAmount: payment ? payment.payment_amount : undefined,
    qrCode: payment ? payment.proof_of_payment : undefined, // Using qrCode field for receipt temporarily or add separate field
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
        students (matric_num, faculty)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  // Fetch payments for these registrations
  const eventIds = data.map(r => r.event_id);
  let paymentsMap: Record<string, any> = {};

  if (eventIds.length > 0) {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .in('event_id', eventIds);

    if (payments) {
      paymentsMap = payments.reduce((acc: any, p) => {
        const key = `${p.event_id}-${p.user_id}`;
        acc[key] = [p];
        return acc;
      }, {});
    }
  }

  // Merge
  const mergedData = data.map(r => ({
    ...r,
    payments: paymentsMap[`${r.event_id}-${r.user_id}`] || []
  }));

  return mergedData.map(mapRegistration);
}

export async function getEventRegistrations(eventId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      users (
        user_name,
        user_email,
        students (matric_num, faculty)
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event registrations:', error);
    return [];
  }

  // Fetch payments for this event
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('event_id', eventId);

  const paymentsMap = (payments || []).reduce((acc: any, p) => {
    acc[p.user_id] = [p];
    return acc;
  }, {});

  const mergedData = data.map(r => ({
    ...r,
    payments: paymentsMap[r.user_id] || []
  }));

  return mergedData.map(mapRegistration);
}

export async function getAllRegistrations() {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      users (
        user_name,
        user_email,
        students (matric_num, faculty)
      )
    `);

  if (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }

  return data.map(mapRegistration);
}

export async function createRegistration(registration: {
  eventId: string;
  userId: string;
  paymentProofUrl?: string; // URL of uploaded file
  paymentAmount?: number;
}) {
  // 1. Create registration
  // Status is 'pending' if payment is required (proof provided), otherwise 'approved' (free event)
  // Assuming frontend passes proof if required.
  const status = registration.paymentProofUrl ? 'pending' : 'approved';

  const { data: reg, error: regError } = await supabase
    .from('registrations')
    .upsert({
      event_id: registration.eventId,
      user_id: registration.userId,
      event_status: status,
      registration_date: new Date().toISOString() // Update date on re-registration
    }, { onConflict: 'event_id, user_id' })
    .select()
    .single();

  if (regError) {
    console.error('Error creating registration:', regError);
    throw regError;
  }

  // 2. Create payment record if proof provided
  if (registration.paymentProofUrl) {
    // Check if payment already exists
    const { data: payments } = await supabase
      .from('payments')
      .select('payment_id')
      .eq('event_id', registration.eventId)
      .eq('user_id', registration.userId);

    const existingPayment = payments?.[0];

    let payError;

    if (existingPayment) {
      // Update existing payment
      const { error } = await supabase
        .from('payments')
        .update({
          payment_amount: registration.paymentAmount || 0,
          payment_method: 'transfer',
          payment_status: 'pending',
          proof_of_payment: registration.paymentProofUrl,
          payment_date: new Date().toISOString()
        })
        .eq('payment_id', existingPayment.payment_id);
      payError = error;
    } else {
      // Create new payment
      const { error } = await supabase
        .from('payments')
        .insert({
          event_id: registration.eventId,
          user_id: registration.userId,
          payment_amount: registration.paymentAmount || 0,
          payment_method: 'transfer', // Default for now
          payment_status: 'pending',
          proof_of_payment: registration.paymentProofUrl,
          payment_date: new Date().toISOString()
        });
      payError = error;
    }

    if (payError) {
      console.error('Error creating payment:', payError);
      // Clean up registration? Or leave it as pending without payment (user can retry?)
      // For now throw
      throw payError;
    }
  }

  return reg;
}

export async function checkInUser(eventId: string, userId: string) {
  const { data, error } = await supabase
    .from('registrations')
    .update({ attendance: 'present' })
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error checking in user:', error);
    throw error;
  }

  return data;
}

export async function approveRegistration(eventId: string, userId: string) {
  // Update registration status to approved
  const { error: regError } = await supabase
    .from('registrations')
    .update({ event_status: 'approved' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (regError) throw regError;

  // Update payment status to paid
  const { error: payError } = await supabase
    .from('payments')
    .update({ payment_status: 'paid' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (payError) {
    console.error('Error updating payment status:', payError);
    // Non-fatal?
  }
}

export async function rejectRegistration(eventId: string, userId: string) {
  // Update registration status to rejected
  const { error: regError } = await supabase
    .from('registrations')
    .update({ event_status: 'rejected' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (regError) throw regError;

  // Update payment status to failed (or refunded if implemented)
  const { error: payError } = await supabase
    .from('payments')
    .update({ payment_status: 'failed' })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (payError) console.error('Error updating payment status:', payError);
}
