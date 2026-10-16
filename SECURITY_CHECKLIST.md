# Security Checklist

## Authentication and Authorization
- [ ] Use strong password hashing (bcrypt/argon2).
- [ ] Enforce email uniqueness and verified account state if needed.
- [ ] Issue JWT tokens with short expiration.
- [ ] Validate tokens on every API request.
- [ ] Protect endpoints by role: student vs team owner/member.

## Access control
- [ ] Ensure users can only access their own schedules, deadlines, exams, grades, roadmap, and documents.
- [ ] Ensure team workspace members can only access workspaces where they belong.
- [ ] Restrict task comments to team members.
- [ ] Enforce `access_scope` on uploaded documents.
- [ ] For `POST /api/ai/recommendations/{recommendation_id}/apply` and dismiss: verify recommendation belongs to authenticated user (and is not already accepted/dismissed).


## Input validation
- [ ] Validate all create/update payloads.
- [ ] Validate date/time ranges (start < end, due date after now if relevant).
- [ ] Reject invalid enum values.
- [ ] Protect against injection in filters and search.

## File upload security
- [ ] Validate file type and size.
- [ ] Store uploaded files outside of web root.
- [ ] Sanitize filenames or generate safe storage names.
- [ ] Enforce document access control on download.

## Data protection
- [ ] Encrypt sensitive data at rest when required by policy.
- [ ] Use HTTPS for all transport.
- [ ] Do not expose internal IDs in public responses unless authorized.

## AI data security
- [ ] Treat AI suggestions as read-only until user confirms changes.
- [ ] Log AI recommendation decisions for audit.
- [ ] Do not auto-update user schedule or deadlines without explicit confirmation.
- [ ] Do not send team-private document content to third-party AI services without consent.

## Session and logging
- [ ] Log authentication events and failed login attempts.
- [ ] Monitor abnormal access patterns.
- [ ] Avoid logging plaintext passwords and sensitive tokens.
- [ ] Use unique session identifiers for focus/Pomodoro sessions.

## Team workspace protections
- [ ] Prevent privilege escalation inside team workspaces.
- [ ] Only owners can change workspace membership/roles.
- [ ] Verify assignee IDs before assigning team tasks.

## Known implementation guardrails
- [ ] Do not implement auto-schedule rewriting without explicit confirmation.
- [ ] Keep finance data separate from core academic data until later phases.
- [ ] Document AI and data-handling assumptions in design docs.
