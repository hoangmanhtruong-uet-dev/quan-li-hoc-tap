import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const rawAnonKey = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)?.trim();

const supabaseUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : 'https://mock-supabase.supabase.co';
const supabaseAnonKey = rawAnonKey && rawAnonKey.length > 0 ? rawAnonKey : 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Checks if Supabase Cloud credentials are configured and not pointing to the mock client.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && url.trim().length > 0 && !url.includes('mock-supabase'));
}

/**
 * Checks if the current browser environment is online.
 * Safe for both browser (navigator.onLine) and server-side execution.
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Safely executes a Supabase or network operation with automatic offline detection
 * and fallback error suppression, preventing application crashes.
 */
export async function safeSupabaseOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T
): Promise<T> {
  if (!isOnline() || !isSupabaseConfigured()) {
    return fallbackValue;
  }
  try {
    return await operation();
  } catch (error) {
    console.warn('[CampusOS Supabase] Operation safely caught offline/network error:', error);
    return fallbackValue;
  }
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
