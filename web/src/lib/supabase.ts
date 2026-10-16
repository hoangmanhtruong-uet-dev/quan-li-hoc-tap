import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-supabase.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
