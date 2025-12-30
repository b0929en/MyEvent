import { supabase } from '../supabase/supabase';
import { User, UserRole, DBUser } from '@/types';

const mapUser = (dbUser: DBUser): User => {
  let role: UserRole = 'student';
  if (dbUser.user_role === 'organization_admin') role = 'organizer';
  if (dbUser.user_role === 'admin') role = 'admin';

  return {
    id: dbUser.user_id,
    email: dbUser.user_email,
    name: dbUser.user_name,
    role: role,
    matricNumber: dbUser.students?.matric_num,
    faculty: dbUser.students?.faculty,
    organizationId: dbUser.organization_admins?.org_id,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.created_at,
  };
};

export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students (matric_num, faculty),
      organization_admins (org_id)
    `);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data.map(mapUser);
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students (matric_num, faculty),
      organization_admins (org_id)
    `)
    .eq('user_email', email)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
    }
    return null;
  }

  return mapUser(data);
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students (matric_num, faculty),
      organization_admins (org_id)
    `)
    .eq('user_id', id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
    }
    return null;
  }

  return mapUser(data);
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students (matric_num, faculty),
      organization_admins (org_id)
    `);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return data.map(mapUser);
}

export async function getStudentByMatric(matricNumber: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      matric_num,
      faculty,
      users (
        user_id,
        user_name,
        user_email
      )
    `)
    .eq('matric_num', matricNumber)
    .single();

  if (error || !data) {
    return null;
  }

  const userUser = Array.isArray(data.users) ? data.users[0] : data.users;

  return {
    matricNumber: data.matric_num,
    faculty: data.faculty,
    name: userUser?.user_name,
    email: userUser?.user_email,
    userId: userUser?.user_id
  };
}
