import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from './supabase.ts';

const inMemoryPersonalWorkspaces = new Map<string, string>();

/**
 * Ensures that the student has an active personal workspace.
 * Queries Supabase 'workspaces' table or falls back cleanly to memory in offline mode.
 */
export async function ensurePersonalWorkspace(userId: string): Promise<string> {
  if (isSupabaseConfigured()) {
    try {
      const { data: existing, error: selectError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .eq('type', 'PERSONAL')
        .maybeSingle();

      if (existing?.id && !selectError) {
        return existing.id;
      }

      const workspaceId = crypto.randomUUID();
      const { error: insertWsError } = await supabase.from('workspaces').insert({
        id: workspaceId,
        owner_id: userId,
        name: 'Personal',
        type: 'PERSONAL',
        progress_percent: 0,
      });

      if (!insertWsError) {
        await supabase.from('workspace_members').insert({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          user_id: userId,
          role: 'OWNER',
        });
        return workspaceId;
      }
    } catch (error) {
      console.error('ensurePersonalWorkspace Supabase error:', error);
    }
  }

  // Resilient in-memory fallback for offline dev/test modes
  let workspaceId = inMemoryPersonalWorkspaces.get(userId);
  if (!workspaceId) {
    workspaceId = `personal-ws-${userId}`;
    inMemoryPersonalWorkspaces.set(userId, workspaceId);
  }
  return workspaceId;
}
