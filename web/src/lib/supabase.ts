import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Checks if Supabase Cloud credentials are configured and not pointing to the mock client.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && url.trim().length > 0 && !url.includes('mock-supabase'));
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  persona: string;
  is_free: boolean;
  price_vnd: number;
  avatar_url?: string;
  tagline: string;
}

export interface VoiceLine {
  id: string;
  character_id: string;
  situation: 'start' | 'tab_switch' | 'idle' | 'face_away' | 'sleep' | 'completed' | 'give_up';
  roast_level: 'light' | 'medium' | 'extreme';
  variant: number;
  text: string;
  audio_url?: string;
  duration_ms: number;
}
