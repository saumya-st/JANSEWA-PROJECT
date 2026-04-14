import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials not configured. Image upload will not work.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bucket name for issue images
export const IMAGES_BUCKET = 'issue-images';
