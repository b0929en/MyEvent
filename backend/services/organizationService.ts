import { supabase } from '../supabase/supabase';
import { Organization, DBOrganization } from '@/types';

const mapOrganization = (dbOrg: DBOrganization): Organization => {
  return {
    id: dbOrg.org_id,
    name: dbOrg.org_name,
    description: dbOrg.org_description || '',
    email: dbOrg.org_contact_email || '',
    phone: '', // Not in DBOrganization yet, defaulting
    logo: dbOrg.org_logo || undefined,
    // Provide defaults for fields not yet in DBOrganization but in Organization type
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export async function getOrganizationById(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('org_id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching organization:', error);
    }
    return null;
  }

  return mapOrganization(data);
}

export async function updateOrganization(id: string, updates: Partial<Organization>) {
  // Map frontend Organization type back to DB columns
  const dbUpdates: Partial<DBOrganization> = {};

  if (updates.name !== undefined) dbUpdates.org_name = updates.name;
  if (updates.description !== undefined) dbUpdates.org_description = updates.description;
  if (updates.email !== undefined) dbUpdates.org_contact_email = updates.email;
  if (updates.logo !== undefined) dbUpdates.org_logo = updates.logo;

  // social_link is in DB but not in Organization type directly (maybe add later?)

  const { error } = await supabase
    .from('organizations')
    .update(dbUpdates)
    .eq('org_id', id);

  if (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}
