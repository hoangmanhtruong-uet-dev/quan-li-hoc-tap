## 2026-10-16T21:01:12Z
You are worker_14_m2 (Storage Engine Worker).
Your working directory is: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_14_m2
Project root: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap
Web app directory: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web
Authoritative request log: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md
Project plan: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\PROJECT.md
Storage Analysis: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_2\analysis.md
Storage Handoff: d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\explorer_14_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your write ownership:
You exclusively own:
- `web/src/lib/storage-engine.ts`
- `web/src/lib/supabase.ts`
- `web/src/components/profile/holographic-student-card.tsx`
- `web/tests/supabase-storage-buckets.test.ts`

Your mission:
Upgrade the CampusOS Storage Engine (R2):
1. In `web/src/lib/supabase.ts`:
   - Export `isSupabaseConfigured(): boolean` (checks if `NEXT_PUBLIC_SUPABASE_URL` is set and does not include 'mock-supabase').
2. In `web/src/lib/storage-engine.ts`:
   - Maintain `export const STORAGE_BUCKET = 'academic-vault';` (required by existing test in `tests/storage-engine.test.ts`).
   - Define and export `STORAGE_BUCKETS`:
     ```ts
     export const STORAGE_BUCKETS = {
       ACADEMIC_MATERIALS: 'academic-materials',
       TASK_ATTACHMENTS: 'task-attachments',
       STUDENT_AVATARS: 'student-avatars',
       LEGACY_VAULT: 'academic-vault',
     } as const;
     ```
   - Define bucket resolution:
     ```ts
     export type StorageFolder = 'lectures' | 'tasks' | 'avatars' | 'general';
     export function resolveBucketForFolder(folder: StorageFolder): string;
     ```
     `'lectures' -> 'academic-materials'`, `'tasks' -> 'task-attachments'`, `'avatars' -> 'student-avatars'`, `'general' -> 'academic-materials'`.
   - Update `fileToDataUrl(file: File | Blob)`:
     If `typeof FileReader === 'undefined'`, fallback to `file.arrayBuffer()` -> `Buffer.from(buf).toString('base64')` returning `data:${file.type || 'application/octet-stream'};base64,${base64}`. This ensures it works in Node.js test environment and SSR without throwing!
   - Update `uploadAcademicFile(file: File, folder?: StorageFolder)` to route to the resolved bucket, with immediate fallback to Data URL if offline or unconfigured or if Supabase upload throws.
   - Add specialized helpers:
     - `uploadLectureSlide(file: File, courseId?: string): Promise<StoredFile>`
     - `uploadTaskAttachment(file: File, taskId?: string): Promise<StoredFile>`
     - `uploadStudentAvatar(file: File, studentId?: string): Promise<StoredFile>`
   - Export `deleteAcademicFile(path: string, folder?: StorageFolder): Promise<boolean>` with safe offline fallback.
3. In `web/src/components/profile/holographic-student-card.tsx`:
   - Connect the file input change handler to use `uploadStudentAvatar(file)` (or `uploadAcademicFile(file, 'avatars')`), saving `stored.url` to `localStorage.setItem('campusos-profile-avatar-v1', stored.url)` and updating component avatar state.
4. In `web/tests/supabase-storage-buckets.test.ts`:
   - Add tests verifying:
     - `STORAGE_BUCKET === 'academic-vault'` and `STORAGE_BUCKETS` has the 3 required buckets.
     - `resolveBucketForFolder` correctly routes folders.
     - `fileToDataUrl` converts file/blob to Base64 data URL in Node environment without `FileReader`.
     - `uploadAcademicFile`, `uploadLectureSlide`, `uploadTaskAttachment`, `uploadStudentAvatar` work with offline fallback returning `isLocalFallback: true`.
5. Run verification commands:
   - `npm run typecheck` in `web/` (0 errors).
   - `npm test` in `web/` (100% tests pass).
   - `npm run build` in `web/` (34/34 routes pass).
6. Deliver `handoff.md` with verification outputs.
