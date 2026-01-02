import { supabase } from '../supabase/supabase';
import { User, UserRole, DBUser } from '@/types';

const mapUser = (dbUser: DBUser): User => {
  let role: UserRole = 'student';
  const dbRole = dbUser.user_role?.toLowerCase();

  if (dbRole === 'organization_admin' || dbRole === 'organization admin') role = 'organizer';
  if (dbRole === 'admin') role = 'admin';

  return {
    id: dbUser.user_id,
    email: dbUser.user_email,
    name: dbUser.user_name,
    role: role,
    matricNumber: dbUser.students?.matric_num,
    faculty: dbUser.students?.faculty,
    organizationId: dbUser.organization_admins?.org_id,
    organizationName: dbUser.organization_admins?.organizations?.org_name,
    position: dbUser.organization_admins?.user_position || undefined,
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
      organization_admins (
        org_id,
        user_position,
        organizations (org_name)
      )
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
      organization_admins (
        org_id,
        user_position,
        organizations (org_name)
      )
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
      organization_admins (
        org_id,
        user_position,
        organizations (org_name)
      )
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
      organization_admins (
        org_id,
        user_position,
        organizations (org_name)
      )
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

export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      students (matric_num, faculty),
      organization_admins (
        org_id,
        user_position,
        organizations (org_name)
      )
    `)
    .eq('user_email', email)
    .single();

  if (error || !data) {
    console.log('verifyUserPassword: User not found or error', error);
    return null;
  }

  // Linear comparison for now (or simple string compare)
  // In a real production app, use bcrypt.compare here
  const storedPassword = data.user_password ? String(data.user_password).trim() : '';
  const providedPassword = password ? String(password).trim() : '';

  console.log(`Verifying password for ${email}. Stored (trimmed): '${storedPassword}', Provided (trimmed): '${providedPassword}'`);

  if (storedPassword === providedPassword) {
    return mapUser(data);
  }

  console.log('Password mismatch');
  return null;
}


