import { supabase, isSupabaseConfigured } from './supabase.ts';

export interface StoredFile {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  type: 'pdf' | 'slide' | 'doc' | 'image' | 'other';
  uploadedAt: string;
  isLocalFallback?: boolean;
  bucket?: string;
}

/**
 * Legacy storage bucket for backward compatibility with existing tests
 */
export const STORAGE_BUCKET = 'academic-vault';

/**
 * Dedicated CampusOS Supabase Storage Buckets
 */
export const STORAGE_BUCKETS = {
  ACADEMIC_MATERIALS: 'academic-materials',
  TASK_ATTACHMENTS: 'task-attachments',
  STUDENT_AVATARS: 'student-avatars',
  LEGACY_VAULT: 'academic-vault',
} as const;

export type StorageBucketId = (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS];

export type StorageFolder = 'lectures' | 'tasks' | 'avatars' | 'general';

/**
 * Resolves the appropriate Supabase storage bucket based on logical folder / domain intent
 */
export function resolveBucketForFolder(folder: StorageFolder | string): string {
  switch (folder) {
    case 'lectures':
    case 'syllabus':
    case 'academic':
      return STORAGE_BUCKETS.ACADEMIC_MATERIALS;
    case 'tasks':
    case 'attachments':
    case 'workspaces':
      return STORAGE_BUCKETS.TASK_ATTACHMENTS;
    case 'avatars':
    case 'profiles':
      return STORAGE_BUCKETS.STUDENT_AVATARS;
    case 'general':
    default:
      return STORAGE_BUCKETS.ACADEMIC_MATERIALS;
  }
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'MB'}`;
}

/**
 * Infer file category from name or MIME type
 */
export function inferFileType(filename: string, mimeType?: string): StoredFile['type'] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || mimeType === 'application/pdf') return 'pdf';
  if (
    lower.endsWith('.ppt') ||
    lower.endsWith('.pptx') ||
    mimeType?.includes('presentation') ||
    mimeType?.includes('powerpoint')
  ) {
    return 'slide';
  }
  if (
    lower.endsWith('.doc') ||
    lower.endsWith('.docx') ||
    mimeType?.includes('word') ||
    mimeType?.includes('document')
  ) {
    return 'doc';
  }
  if (
    lower.endsWith('.png') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg') ||
    lower.endsWith('.webp') ||
    mimeType?.startsWith('image/')
  ) {
    return 'image';
  }
  return 'other';
}

/**
 * Convert a File or Blob into a Base64 Data URL.
 * Resilient fallback: uses Node.js Buffer when FileReader is not available (Node.js test runner / SSR).
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  if (typeof FileReader === 'undefined') {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'application/octet-stream';
    return `data:${mimeType};base64,${base64}`;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Supabase Storage with bucket routing and resilient local fallback.
 */
export async function uploadAcademicFile(
  file: File,
  folder: StorageFolder = 'general',
  subfolderOrPrefix?: string
): Promise<StoredFile> {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileType = inferFileType(file.name, file.type);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const bucket = resolveBucketForFolder(folder);
  const prefix = subfolderOrPrefix ? `${subfolderOrPrefix}_` : '';
  const path = `${folder}/${prefix}${Date.now()}_${cleanName}`;

  const isOnline = typeof navigator === 'undefined' || navigator.onLine;
  const isConfigured = isSupabaseConfigured();

  // If cloud storage is unconfigured or browser is offline, instantly return local fallback
  if (!isConfigured || !isOnline) {
    const dataUrl = await fileToDataUrl(file);
    return {
      id: fileId,
      name: file.name,
      url: dataUrl,
      sizeBytes: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isLocalFallback: true,
      bucket,
    };
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error || !data) {
      throw error || new Error('Supabase storage upload failed');
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      id: fileId,
      name: file.name,
      url: urlData.publicUrl,
      sizeBytes: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isLocalFallback: false,
      bucket,
    };
  } catch (_err) {
    const dataUrl = await fileToDataUrl(file);
    return {
      id: fileId,
      name: file.name,
      url: dataUrl,
      sizeBytes: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isLocalFallback: true,
      bucket,
    };
  }
}

/**
 * Specialized helper: Upload lecture slide deck to 'academic-materials' bucket
 */
export async function uploadLectureSlide(file: File, courseId?: string): Promise<StoredFile> {
  return uploadAcademicFile(file, 'lectures', courseId ? `course_${courseId}` : undefined);
}

/**
 * Specialized helper: Upload task attachment to 'task-attachments' bucket
 */
export async function uploadTaskAttachment(file: File, taskId?: string): Promise<StoredFile> {
  return uploadAcademicFile(file, 'tasks', taskId ? `task_${taskId}` : undefined);
}

/**
 * Specialized helper: Upload student profile avatar to 'student-avatars' bucket
 */
export async function uploadStudentAvatar(file: File, studentId?: string): Promise<StoredFile> {
  return uploadAcademicFile(file, 'avatars', studentId ? `student_${studentId}` : undefined);
}

/**
 * Delete a file from Supabase Storage with safe offline fallback
 */
export async function deleteAcademicFile(
  path: string,
  folder: StorageFolder = 'general'
): Promise<boolean> {
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;
  const isConfigured = isSupabaseConfigured();

  if (!isConfigured || !isOnline) {
    // Safe offline fallback: local simulated deletion succeeded
    return true;
  }

  try {
    const bucket = resolveBucketForFolder(folder);
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.warn('[Storage Engine] Failed to delete file from bucket:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Storage Engine] Error during file deletion:', err);
    return false;
  }
}
