import { supabase } from './supabase.ts';

export interface StoredFile {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  type: 'pdf' | 'slide' | 'doc' | 'image' | 'other';
  uploadedAt: string;
  isLocalFallback?: boolean;
}

export const STORAGE_BUCKET = 'academic-vault';

/**
 * Format bytes into human-readable string (KB, MB)
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
 * Convert a File or Blob into a Base64 Data URL (fallback when Supabase Storage is not ready)
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a file to Supabase Storage with resilient local fallback
 */
export async function uploadAcademicFile(
  file: File,
  folder: 'lectures' | 'tasks' | 'general' = 'general'
): Promise<StoredFile> {
  const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const fileType = inferFileType(file.name, file.type);
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${cleanName}`;

  try {
    // 1. Attempt upload to Supabase Storage
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error || !data) {
      throw error || new Error('Supabase storage upload failed');
    }

    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    return {
      id: fileId,
      name: file.name,
      url: urlData.publicUrl,
      sizeBytes: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isLocalFallback: false,
    };
  } catch (_err) {
    // 2. Resilient Fallback: Convert to Data URL / Blob URL for client persistence
    const dataUrl = await fileToDataUrl(file);

    return {
      id: fileId,
      name: file.name,
      url: dataUrl,
      sizeBytes: file.size,
      type: fileType,
      uploadedAt: new Date().toISOString(),
      isLocalFallback: true,
    };
  }
}
