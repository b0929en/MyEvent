
import { supabase } from '../supabase/supabase';

export async function uploadEventBanner(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('event-banners')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-banners')
    .getPublicUrl(path);

  return publicUrl;
}

export async function uploadDocument(file: File, path: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(path);

  return publicUrl;
}
