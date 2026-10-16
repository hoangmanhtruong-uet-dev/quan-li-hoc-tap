import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORAGE_BUCKET,
  STORAGE_BUCKETS,
  resolveBucketForFolder,
  fileToDataUrl,
  uploadAcademicFile,
  uploadLectureSlide,
  uploadTaskAttachment,
  uploadStudentAvatar,
  deleteAcademicFile,
  type StoredFile,
} from '../src/lib/storage-engine.ts';

import { isSupabaseConfigured } from '../src/lib/supabase.ts';

test('Storage Buckets (1/6): STORAGE_BUCKET and STORAGE_BUCKETS constants match specification', () => {
  // Legacy bucket preserved for backward compatibility
  assert.equal(STORAGE_BUCKET, 'academic-vault');

  // Multi-bucket architecture
  assert.equal(STORAGE_BUCKETS.ACADEMIC_MATERIALS, 'academic-materials');
  assert.equal(STORAGE_BUCKETS.TASK_ATTACHMENTS, 'task-attachments');
  assert.equal(STORAGE_BUCKETS.STUDENT_AVATARS, 'student-avatars');
  assert.equal(STORAGE_BUCKETS.LEGACY_VAULT, 'academic-vault');
});

test('Storage Buckets (2/6): resolveBucketForFolder correctly routes folders and intent aliases', () => {
  // Academic materials routing
  assert.equal(resolveBucketForFolder('lectures'), 'academic-materials');
  assert.equal(resolveBucketForFolder('syllabus'), 'academic-materials');
  assert.equal(resolveBucketForFolder('academic'), 'academic-materials');
  assert.equal(resolveBucketForFolder('general'), 'academic-materials');

  // Task attachments routing
  assert.equal(resolveBucketForFolder('tasks'), 'task-attachments');
  assert.equal(resolveBucketForFolder('attachments'), 'task-attachments');
  assert.equal(resolveBucketForFolder('workspaces'), 'task-attachments');

  // Student avatars routing
  assert.equal(resolveBucketForFolder('avatars'), 'student-avatars');
  assert.equal(resolveBucketForFolder('profiles'), 'student-avatars');

  // Unknown folder defaults to academic-materials
  assert.equal(resolveBucketForFolder('custom-unknown-folder' as any), 'academic-materials');
});

test('Storage Buckets (3/6): fileToDataUrl converts file/blob to Base64 in Node environment without FileReader', async () => {
  assert.equal(typeof FileReader, 'undefined', 'FileReader should be undefined in Node.js test environment');

  const textPayload = 'Hello CampusOS Storage Engine!';
  const blob = new Blob([textPayload], { type: 'text/plain' });

  const dataUrl = await fileToDataUrl(blob);
  assert.ok(dataUrl.startsWith('data:text/plain;base64,'));

  // Verify decoded content matches verbatim
  const base64Data = dataUrl.replace(/^data:text\/plain;base64,/, '');
  const decodedString = Buffer.from(base64Data, 'base64').toString('utf-8');
  assert.equal(decodedString, textPayload);

  // Test with File object and PDF MIME
  const pdfFile = new File(['%PDF-1.4 mock stream data'], 'document.pdf', {
    type: 'application/pdf',
  });
  const pdfDataUrl = await fileToDataUrl(pdfFile);
  assert.ok(pdfDataUrl.startsWith('data:application/pdf;base64,'));
});

test('Storage Buckets (4/6): uploadAcademicFile executes resilient offline fallback when unconfigured', async () => {
  const fileContent = 'Sample syllabus and course requirements';
  const file = new File([fileContent], 'CS101_Syllabus.pdf', { type: 'application/pdf' });

  const result: StoredFile = await uploadAcademicFile(file, 'lectures');

  assert.equal(result.isLocalFallback, true);
  assert.equal(result.bucket, 'academic-materials');
  assert.equal(result.type, 'pdf');
  assert.equal(result.name, 'CS101_Syllabus.pdf');
  assert.equal(result.sizeBytes, fileContent.length);
  assert.ok(result.url.startsWith('data:application/pdf;base64,'));
  assert.ok(result.id.startsWith('file-'));
  assert.ok(result.uploadedAt.length > 0);
});

test('Storage Buckets (5/6): specialized helpers route to appropriate buckets with offline fallback', async () => {
  // 1. Lecture Slide -> academic-materials
  const slide = new File(['Slide deck content'], 'AI_Intro_Lecture1.pptx', {
    type: 'application/vnd.ms-powerpoint',
  });
  const slideResult = await uploadLectureSlide(slide, 'ai-101');
  assert.equal(slideResult.isLocalFallback, true);
  assert.equal(slideResult.bucket, 'academic-materials');
  assert.equal(slideResult.type, 'slide');
  assert.ok(slideResult.url.startsWith('data:application/vnd.ms-powerpoint;base64,'));

  // 2. Task Attachment -> task-attachments
  const archive = new File(['Source code zip contents'], 'homework1_submission.zip', {
    type: 'application/zip',
  });
  const taskResult = await uploadTaskAttachment(archive, 'task-456');
  assert.equal(taskResult.isLocalFallback, true);
  assert.equal(taskResult.bucket, 'task-attachments');
  assert.equal(taskResult.type, 'other');
  assert.ok(taskResult.url.startsWith('data:application/zip;base64,'));

  // 3. Student Avatar -> student-avatars
  const avatar = new File(['PNG image binary data'], 'profile_photo.png', {
    type: 'image/png',
  });
  const avatarResult = await uploadStudentAvatar(avatar, 'student-789');
  assert.equal(avatarResult.isLocalFallback, true);
  assert.equal(avatarResult.bucket, 'student-avatars');
  assert.equal(avatarResult.type, 'image');
  assert.ok(avatarResult.url.startsWith('data:image/png;base64,'));
});

test('Storage Buckets (6/6): deleteAcademicFile and isSupabaseConfigured behave correctly in mock/offline environment', async () => {
  // deleteAcademicFile handles offline deletion gracefully
  const deleted = await deleteAcademicFile('lectures/test_file.pdf', 'lectures');
  assert.equal(deleted, true);

  // isSupabaseConfigured correctly identifies mock vs real configuration
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.equal(isSupabaseConfigured(), false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.supabase.co';
    assert.equal(isSupabaseConfigured(), false);

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://production-campusos.supabase.co';
    assert.equal(isSupabaseConfigured(), true);
  } finally {
    if (originalUrl !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    } else {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    }
  }
});
