# DISPATCH — Worker R1 Remedy (Milestone M1 Iteration 2)

## Mission
Remediate the React 18 `useSyncExternalStore` reactivity defect and minor findings identified by Reviewer 1 and Reviewer 2 in Milestone M1 (Workspaces & Projects).

## Authoritative Inputs
- Original Request: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md` (timestamp `## 2026-10-16T17:39:47Z`)
- Master Plan: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md`
- Reviewer 1 Handoff: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_1_r1\handoff.md`
- Reviewer 2 Handoff: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_2_r1\handoff.md`
- Working Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\web`
- Your Metadata Directory: `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r1_remedy\`

## Required Fixes
1. **Fix Snapshot Immutability in `src/lib/workspace-engine.ts`**:
   In `persistWorkspaces(workspaces)`:
   Ensure `memoryWorkspaces` is assigned a cloned array with cloned items so React 18's `useSyncExternalStore` (`!Object.is(prev, next)`) detects the change and schedules a re-render.
   ```typescript
   export function persistWorkspaces(workspaces: WorkspaceItem[]): void {
     memoryWorkspaces = workspaces.map((ws) => ({
       ...ws,
       members: [...ws.members],
       tasks: ws.tasks.map((t) => ({ ...t, subtasks: [...t.subtasks] })),
       documents: [...ws.documents],
       activities: [...ws.activities],
     }));
     if (typeof window !== 'undefined') {
       try {
         localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(memoryWorkspaces));
         window.dispatchEvent(new CustomEvent(WORKSPACE_CHANGE_EVENT, { detail: memoryWorkspaces }));
       } catch (err) {
         console.error('Failed to persist workspaces to localStorage:', err);
       }
     }
     notifySubscribers();
   }
   ```
2. **Add Unit Test for Snapshot Referential Invalidation**:
   In `tests/workspace-engine.test.ts`, add a test verifying that `getStoredWorkspaces()` returns a new reference (`!Object.is(before, after)`) after calling `createWorkspaceTask`, `moveWorkspaceTask`, or `updateWorkspace`.
3. **Clean up Three.js Node Materials in `src/components/workspaces/workspace-holo-3d.tsx`**:
   Ensure `nodeMeshes.forEach(mesh => (mesh.material as THREE.Material).dispose())` is executed on unmount.
4. **Guard Subtask Checkbox in `src/components/workspaces/workspace-kanban.tsx`**:
   Ensure the subtask checkbox button has `disabled={!canUpdate}` and only calls `onToggleSubtask` when `canUpdate` is true.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work.

## Completion Criteria
1. Run `npm run typecheck` inside `web/` — must pass with 0 errors.
2. Run `npm test` inside `web/` — must pass 100% of tests.
3. Run `npm run build` inside `web/` — must compile cleanly with 0 errors.
4. Write `handoff.md` to `d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r1_remedy\handoff.md`.
5. Send message back to orchestrator (`2edd309a-1f42-49e0-9c2a-571cbec23f81`).


## 2026-10-16T18:15:39Z
Read ORIGINAL_REQUEST.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\ORIGINAL_REQUEST.md (timestamp ## 2026-10-16T17:39:47Z).
Read PROJECT.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\orchestrator_13\PROJECT.md.
Read Reviewer 1 report at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\reviewer_1_r1\handoff.md.
Read your DISPATCH.md at d:\MyProjects\MyProjectToMoney\Web-quan-li-hoc-tap\.agents\teamwork\worker_r1_remedy\DISPATCH.md.

Implement the required fixes for Milestone M1 (Workspaces & Projects):
1. Fix snapshot immutability in src/lib/workspace-engine.ts (clone array and items in persistWorkspaces to ensure useSyncExternalStore referential invalidation).
2. Add snapshot referential inequality test in tests/workspace-engine.test.ts.
3. Dispose Three.js node materials on unmount in src/components/workspaces/workspace-holo-3d.tsx.
4. Add disabled={!canUpdate} to subtask checkbox in src/components/workspaces/workspace-kanban.tsx.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task.

Run verification: npm run typecheck, npm test, npm run build in web/.
Write handoff.md and send message back to orchestrator (ID: 2edd309a-1f42-49e0-9c2a-571cbec23f81).
